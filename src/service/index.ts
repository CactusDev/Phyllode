import { Cereus } from "../cereus";

import { MixerHandler, TwitchHandler } from "./services";
import { Service, ServiceStatus } from "./service";
import { Config } from "../config";

interface ServiceMapping {
    [name: string]: any  // How can this be not-any?
}

// THIS IS ONLY TEMP DATA UNTIL WE HAVE A MODEL IN STONE
const channels = [
    {
        channel: 17887,
        service: "Mixer",
        botUser: 25873
    }
    // {
    //     channel: "Innectic",
    //     service: "Twitch",
    //     botUser: "cactusbotdev"
    // }
]

const services: ServiceMapping = {
    mixer: MixerHandler,
    twitch: TwitchHandler
};

/**
 * Channel is a channel on a service that is currently being tracked.
 *
 * @interface Channel
 */
interface Channels {
    [channelUuid: string]: Service[]
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

    constructor(private config: Config) {
    }

    private async loadAllChannels() {
        // This does nothing right now. This needs an api to exist before
        // anything can really happen here.
    }

    /**
     * Connect to a new channel.
     *
     * @param channel the channel to connect to.
     * @param service the type of service to be handled.
     * @returns {Promise<boolean>} if the connection was successful.
     */
    public async connectChannel(channel: any, service: Service, name: string): Promise<ConnectionTristate> {
        service.status = ServiceStatus.CONNECTING;
        const authInfo: {[service: string]: string} = this.config.core.authentication.cactusbotdev;

        // Attempt to connect to the service
        const connected = await service.connect(authInfo[name.toLowerCase()]);
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

        if (this.channels[channel.channel] === undefined) {
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

        channels.forEach(async channel => {
            const name: string = channel.service.toLowerCase();
            const service: Service = new services[name](cereus);
            // Make sure it's a valid service
            if (service === undefined) {
                throw new Error("Attempetd to use service that doesn't exist.");
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
            // Listen for event packets
            console.log("Attempting to listen for events...");
            service.events.subscribe(
                (event: CactusEventPacket) => {
                    console.log("Got event: " + JSON.stringify(event));
                },
                (error) => console.error,
                () => console.log("Done")
            );
            console.log("Listening for events!");
        });
    }

    public async sendServiceMessage(channel: string, service: string, message: CactusMessagePacket) {
        this.channels[channel].forEach(async channelService => {
        });
    }
}
