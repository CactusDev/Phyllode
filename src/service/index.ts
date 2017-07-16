import { Service } from './service';

// THIS IS ONLY TEMP DATA UNTIL WE HAVE A MODEL IN STONE
const channels = [
    {
        channel: "innectic",
        service: "mixer",  // Should this be an id?
    }
]

/**
 * Channel is a channel on a service that is currently being tracked.
 * 
 * @interface Channel
 */
interface Channel {
    [channelUuid: string]: Service[]
}

/**
 * Service handler handles the tracking of channels.
 * 
 * @export
 * @class ServiceHandler
 */
export class ServiceHandler {

    constructor() {

    }

    /**
     * Connect all the channels to their respective services
     * 
     * @memberof ServiceHandler
     */
    public async connectAllChannels() {

    }
}
