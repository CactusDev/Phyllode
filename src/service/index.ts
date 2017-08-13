import { Cereus } from "../cereus";

import { MixerHandler, TwitchHandler, DiscordHandler } from "./services";
import { Service, ServiceStatus } from "./service";
import { Config } from "../config";

import { MixerAuthenticator, AuthenticationData } from "./services/mixer/authentication";

export const mixerAuthenticator: MixerAuthenticator = new MixerAuthenticator();

interface ServiceMapping {
    [name: string]: typeof Service
}

interface IChannel {
    channel: string | number;
    service: "Mixer" | "Twitch" | "Discord";
    botUser: string | number;
}

// THIS IS ONLY TEMP DATA UNTIL WE HAVE A MODEL IN STONE
const channels: IChannel[] = [
    // {
    //     channel: "innectic",
    //     service: "Mixer",
    //     botUser: 25873
    // },
    {
        channel: "CactusDev",
        service: "Discord",
        botUser: "CactusBot"
    }
    // {
    //     channel: "Innectic",
    //     service: "Twitch",
    //     botUser: "cactusbotdev"
    // }
]

const services: ServiceMapping = {
    mixer: MixerHandler,
    twitch: TwitchHandler,
    discord: DiscordHandler
};

/**
 * Channel is a channel on a service that is currently being tracked.
 *
 * @interface Channel
 */
interface Channels {
    [channelUuid: string]: Service[]
}

interface ConnectedServices {
    [service: string]: {
        [username: string]: Service[];
    };
}

/**
 * Tristate for the status of a connection to a service
 *
 * @export
 * @enum {number}
 */
export enum ConnectionTristate {
    TRUE, FALSE, FAILED
}

/**
 * Service handler handles the tracking of channels.
 *
 * @export
 * @class ServiceHandler
 */
export class ServiceHandler {

    private channels: Channels = {};
    private connected: ConnectedServices = {};

    private keysInRotation: {[account: string]: string} = {};

    constructor(private config: Config) {
        mixerAuthenticator.setup(this.config.core.oauth.mixer.clientId,
                                 this.config.core.oauth.mixer.clientSecret,
                                 this.config.core.oauth.mixer.redirectURI);
    }

    /**
     * Connect to a new channel.
     *
     * @param channel the channel to connect to.
     * @param service the type of service to be handled.
     * @returns {Promise<boolean>} if the connection was successful.
     */
    public async connectChannel(channel: IChannel, service: Service, name: string): Promise<ConnectionTristate> {
        service.status = ServiceStatus.CONNECTING;
        const authInfo: { [service: string]: string } = this.config.core.authentication.cactusbotdev;

        if (!this.keysInRotation[channel.botUser]) {
            if (name === "mixer") {
                await mixerAuthenticator.refreshToken(authInfo.mixer, channel.botUser.toString());
            } else if (name === "discord") {
                this.keysInRotation[channel.botUser.toString()] = this.config.core.oauth.discord.auth;
            }
        }
        // Attempt to connect to the service
        const connected = await service.connect(this.keysInRotation[channel.botUser.toString()]);
        if (!connected) {
            return ConnectionTristate.FALSE;
        }
        service.status = ServiceStatus.AUTHENTICATING;

        // Attempt to authenticate
        const authenticated = await service.authenticate(channel.channel, channel.botUser);
        if (!authenticated) {
            return ConnectionTristate.FAILED;
        }
        service.status = ServiceStatus.READY;

        if (!this.channels[channel.channel]) {
            this.channels[channel.channel] = [service];
        } else {
            this.channels[channel.channel].push(service);
        }
        console.log(`Connected to channel ${channel.channel}.`);
        return ConnectionTristate.TRUE;
    }

    /**
     * Connect all the channels to their respective services
     *
     * @memberof ServiceHandler
     */
    public async connectAllChannels() {
        await this.loadAllChannels();
        const cereus = new Cereus(this);
        const authInfo: {[service: string]: string} = this.config.core.authentication.cactusbotdev;

        channels.forEach(async channel => {
            // TODO: This is only temp until the api supports the things I need
            if (channel.service === "Twitch" && !this.keysInRotation[channel.botUser]) {
                this.keysInRotation[channel.botUser] = authInfo.twitch;
            }
            const name: string = channel.service.toLowerCase();
            // This line is the reason I don't sleep at night.
            const service: Service = new (services[name].bind(this, cereus, this.config));
            // Make sure it's a valid service
            if (!service) {
                throw new Error("Attempted to use service that doesn't exist.");
            }
            // Connect to the channel
            const connected = await this.connectChannel(channel, service, name);
            if (connected === ConnectionTristate.FAILED) {
                console.log("Failed to authenticate!");
                return;
            } else if (connected === ConnectionTristate.FALSE) {
                console.log("Unable to connect to service.");
                return;
            }
            console.log("Connected.");
            // Add to the connected channels
            if (!this.connected[name]) {
                this.connected[name] = {};
            }
            if (!this.connected[name][channel.botUser]) {
                this.connected[name][channel.botUser] = [];
            }
            this.connected[name][channel.botUser].push(service);
            // Listen for event packets
            console.log("Attempting to listen for events...");
            service.events.subscribe(
                async (scope: CactusScope) => {
                    const responses = await cereus.handle(scope);
                    if (!responses) {
                        return;
                    }
                    responses.forEach(async response => {
                        this.sendServiceMessage(channel.channel.toString(), channel.service, response);
                    })
                },
                (error) => console.error,
                () => console.log("Done")
            );
            console.log("Listening for events!");
        });

        mixerAuthenticator.on("mixer:reauthenticate", async (data: AuthenticationData, user: string) => {
            this.keysInRotation[user] = data.access_token;
            if (!this.connected["mixer"][user]) {
                return;
            }
            for (let connected of this.connected["mixer"][user]) {
                const disconnected = await connected.disconnect();
                if (!disconnected) {
                    console.log("Unable to disconnect from Mixer.");
                    continue;
                }
                await connected.reauthenticate(data);
            }
        });
    }

    public async sendServiceMessage(channel: string, service: string, message: CactusScope) {
        this.channels[channel].filter(e => e.serviceName.toLowerCase() === service.toLowerCase())
            .forEach(async channelService => await channelService.sendMessage(message));
    }

    private async loadAllChannels() {
        // This does nothing right now. This needs an api to exist before
        // anything can really happen here.
    }
}
