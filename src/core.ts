import { ServiceHandler } from "./service";
import { Injectable } from "@angular/core";

import { Logger } from "./logger";
import { RedisController } from "cactus-stl";

/**
 * Start all the Core services.
 *
 * @export
 * @class Core
 */
@Injectable()
export class Core {

    constructor(private serviceHandler: ServiceHandler, private redis: RedisController) {
    }

    /**
     * Start the app.
     *
     * @memberof Core
     */
    public async start() {
        Logger.info("Core", "Connecting to Redis...");
        this.redis.connect().then(() => {
            Logger.info("Core", "Connected to Redis!");

            Logger.info("Core", "Attempting to connect to channels...");
            this.serviceHandler.connectAllChannels();
        })
        .catch((error: string) => Logger.error("Core", error));

        process.on("SIGTERM", () => this.stop());
        process.on("SIGINT", () => this.stop());
    }

    public async stop() {
        Logger.info("Core", "Removing spines...");
        await this.serviceHandler.disconnectAllChannels();
        Logger.info("Core", "Done!");

        Logger.info("Core", "Disconnecting from Redis...");
        this.redis.disconnect().then(() => {
            Logger.info("Core", "Disconnected from Redis.");
            process.exit(0);
        })
        .catch((error: string) => Logger.error("Core", error));
    }
}
