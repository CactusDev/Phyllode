import { ServiceHandler } from "./service";
import { Injectable } from "@angular/core";

import { Logger } from "./logger";

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
        Logger.info("Core", "Attempting to connect to channels...");
        this.serviceHandler.connectAllChannels();

        process.on("SIGTERM", () => this.stop());
        process.on("SIGINT", () => this.stop());
    }

    public async stop() {
        Logger.info("Core", "Disconnecting from all channels...");
        await this.serviceHandler.disconnectAllChannels();
        process.exit(0);
    }
}
