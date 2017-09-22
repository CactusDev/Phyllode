import { Cereus } from "../cereus";

import { MixerHandler, TwitchHandler, DiscordHandler } from "./services";
import { Service, ServiceStatus } from "./service";
import { Config } from "../config";
import { Logger } from "../logger";

import { MixerAuthenticator, AuthenticationData } from "./services/mixer/authentication";
import { RedisController } from "cactus-stl";

export const mixerAuthenticator: MixerAuthenticator = new MixerAuthenticator();

interface ServiceMapping {
    [name: string]: typeof Service
}

interface IChannel {
    channel: string;
    service: "Mixer" | "Twitch" | "Discord";
    botUser: string | number;
}

// THIS IS ONLY TEMP DATA UNTIL WE HAVE A MODEL IN STONE
let channels: IChannel[] = [];

const services: ServiceMapping = {
    mixer: MixerHandler,
    twitch: TwitchHandler,
    discord: DiscordHandler
};

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

    private connected: ConnectedServices = {};

    private keysInRotation: {[account: string]: string} = {};

    constructor(private config: Config, private redis: RedisController) {
        mixerAuthenticator.setup(this.config.core.oauth.mixer.clientId,
                                 this.config.core.oauth.mixer.clientSecret,
                                 this.config.core.oauth.mixer.redirectURI);
    }

    /**
     * Connect to a given channel on a service
     *
     * @param {string} channel The name of the channel to connect to
     * @param {string} service the service to use as the agent
     */
    public async connectToChannel(channel: string, botId: string | number, serviceName: string) {
        // Find OAuth for this botId
        const oauth = this.keysInRotation[botId];
        if (!oauth) {
            // TODO: Get the auth. Needs the API
            console.log("Can't get keys");
        }

        serviceName = serviceName.toLowerCase();
        const service: Service = new (services[serviceName].bind(this));
        
        // Initialize the service
        Logger.info("services", `Initializing instance for ${channel}...`);
        await service.initialize();
        service.setStatus(ServiceStatus.AUTHENTICATING);
        
        // Connect to the service
        Logger.info("services", `Connecting instance for ${channel}...`);
        await service.connect(oauth);
        service.setStatus(ServiceStatus.CONNECTING);

        // Authenticate to the service
        Logger.info("services", `Authenticating instance for ${channel}...`);
        await service.authenticate(channel, botId);
        service.setStatus(ServiceStatus.READY);

        // Now that we're connected, and ready for things, update the status in Redis.
        const data: ChannelStatus = {
            connected: true,
            reconnecting: false,
            botUser: botId,
            controllerId: "todo"
        };
        this.redis.set(`channel:${serviceName}:${channel}`, JSON.stringify(data));
        // Update internal cache
        if (!this.connected[serviceName]) {
            this.connected[serviceName] = {};
        }

        if (this.connected[serviceName][channel]) {
            this.connected[serviceName][channel].push(service);
        } else {
            this.connected[serviceName][channel] = [service];
        }
    }

    public async connectAllChannels() {
        Logger.info("Services", "Loading channels...");
        await this.loadAllChannels();
        Logger.info("Services", "Done! Starting connections...");

        // TODO: Needs the api
        this.keysInRotation["25873"] = this.config.core.authentication.cactusbotdev.mixer;

        channels.forEach(async channel => {
            await this.connectToChannel(channel.channel, channel.botUser, channel.service);
        });
    }

    /**
     * Broadcast a message to all connected channels.
     *
     * @param {string} mesasge the message to broadcast
     * @param {string?} service the service that should be broadcasted to
     */
    public async broadcastMessage(message: CactusContext, service?: string) {
        Object.keys(this.connected).filter(serviceName => service && serviceName == service).forEach(async serviceName =>
            Object.keys(this.connected[serviceName]).forEach(async channel =>
                this.connected[serviceName][channel].forEach(async service => await service.sendMessage(message))));
    }

    public async sendMessageToChannel(channel: string, service: string, message: CactusContext) {
        Object.keys(this.connected).filter(serviceName => serviceName == service).forEach(async serviceName =>
            Object.keys(this.connected[serviceName]).filter(ch => ch == channel).forEach(async channel =>
                this.connected[serviceName][channel].forEach(async service => await service.sendMessage(message))));
    }

    public async disconnectAllChannels(reason?: string) {
        Object.keys(this.connected).forEach(async channel => {
            Object.keys(this.connected[channel]).forEach(serviceName => 
                this.connected[channel][serviceName].forEach(async service => {
                    await service.disconnect();
                    // After disconnect, update Redis.
                    const status = {
                        connected: false,
                        reconnecting: false,
                        botUser: service.channel
                    };
                    this.redis.set(`status:${name}:${service.channel}`, JSON.stringify(status));
                }));
        });
    }

    private async loadAllChannels() {
        channels = [
            {
                channel: "innectic",
                service: "Mixer",
                botUser: 25873
            }
        ]
    }
}
