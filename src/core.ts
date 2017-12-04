import { Injectable } from "@angular/core";

import { Logger } from "cactus-stl";
import { RedisController } from "cactus-stl";
import { RabbitHandler } from "./rabbit";

import { Cereus } from "./cereus";
import { HandlerController } from "./handlers/handler";

/**
 * Start all the Core services.
 *
 * @export
 * @class Core
 */
@Injectable()
export class Core {

    constructor(private redis: RedisController, private rabbit: RabbitHandler, private cereus: Cereus, private handlerController: HandlerController) {
    }

    /**
     * Start the app.
     *
     * @memberof Core
     */
    public async start() {
        try {
            Logger.info("Core", "Setting up handler controller...");
            await this.handlerController.setup();
            Logger.info("Core", "Done!");

            // Logger.info("Core", "Connecting to Redis...");
            // await this.redis.connect();
            // Logger.info("Core", "Connected to Redis!");

            Logger.info("Core", "Attempting to connect to RabbitMQ...");
            await this.rabbit.connect();
            Logger.info("Core", "Connected to RabbitMQ!");
        } catch (e) {
            Logger.error("Core", e);
        }

        process.on("SIGTERM", () => this.stop());
        process.on("SIGINT", () => this.stop());
    }

    public async stop() {
        try {
            Logger.info("Core", "Disconnecting from Redis...");
            await this.redis.disconnect()
            Logger.info("Core", "Disconnected from Redis.");
        } catch (e) {
            Logger.error("Core", e);
        }

        try {
            Logger.info("Core", "Disconnecting from RabbitMQ...");
            await this.rabbit.disconnect();
            Logger.info("Core", "Disconnected from RabbitMQ!");
        } catch (e) {
            Logger.error("Core", e);
        }
        process.exit(0);
    }
}
