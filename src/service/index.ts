import { MixerHandler } from "./services/mixer";
import { Service, ServiceStatus } from "./service";

// THIS IS ONLY TEMP DATA UNTIL WE HAVE A MODEL IN STONE
const channels = [
    {
        channel: 17887,
        service: "Mixer"  // Should this be an id?
    }
]

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

    constructor() {

    }

    private async loadAllChannels() {
        // This does nothing right now. This needs a database to exist before
        // anything can really happen here.
    }

    /**
     * Connect to a new channel.
     *
     * @param channel the channel to connect to.
     * @param service the type of service to be handled.
     * @returns {Promise<boolean>} if the connection was successful.
     */
    public async connectChannel(channel: string | number, service: Service): Promise<ConnectionTristate> {
        service.setStatus(ServiceStatus.CONNECTING);
        const connected = await service.connect();
        if (!connected) {
            return ConnectionTristate.FALSE;
        }
        service.setStatus(ServiceStatus.AUTHENTICATING);
        const authenticated = await service.authenticate(channel, 25873);
        if (!authenticated) {
            return ConnectionTristate.FAILED;
        }
        service.setStatus(ServiceStatus.READY);

        if (this.channels[channel] === undefined) {
            this.channels[channel] = [service];
        } else {
            this.channels[channel].push(service);
        }
        console.log(`Connected to channel ${channel}.`);
        return ConnectionTristate.TRUE;
    }

    /**
     * Connect all the channels to their respective services
     *
     * @memberof ServiceHandler
     */
    public async connectAllChannels() {
        await this.loadAllChannels();

        channels.forEach(async channel => {
            // TODO: How do we make this not suck?
            let service: Service = undefined;
            if (channel.service === "Mixer") {
                service = new MixerHandler();
            }

            // Make sure it's a valid service
            if (service === undefined) {
                throw new Error("Attempetd to use service that doesn't exist.");
            }
            // Connect to the channel
            await this.connectChannel(channel.channel, service);
        });
    }
}
