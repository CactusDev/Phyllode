import { ServiceHandler } from "./service";
import { Injectable } from "@angular/core";

/**
 * Start all the Core services.
 * 
 * @export
 * @class Core
 */
@Injectable()
export class Core {

    constructor(private serviceHandler: ServiceHandler) {
    }

    /**
     * Start the app.
     * 
     * @memberof Core
     */
    public async start() {
        this.serviceHandler.connectAllChannels();
    }
}
