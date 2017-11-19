import { Injectable } from "@angular/core";

import { Logger } from "./logger";
import { RedisController } from "cactus-stl";
import { RabbitHandler } from "./rabbit";
import { TwitchParser } from "./parsers";

/**
 * Start all the Core services.
 *
 * @export
 * @class Core
 */
@Injectable()
export class Core {

    private twitchParser: TwitchParser;

    constructor(private redis: RedisController, private rabbit: RabbitHandler) {
        this.twitchParser = new TwitchParser();
    }

    /**
     * Start the app.
     *
     * @memberof Core
     */
    public async start() {
        try {
            Logger.info("Core", "Connecting to Redis...");
            await this.redis.connect();
            Logger.info("Core", "Connected to Redis!");

            Logger.info("Core", "Attempting to connect to RabbitMQ...");
            await this.rabbit.connect();
            Logger.info("Core", "Connected to RabbitMQ!");

            this.rabbit.on("service:message", async (message: ProxyMessage) => {
                const result = await this.twitchParser.parse(message);
                console.log(JSON.stringify(await this.twitchParser.synthesize(result)));
            });
        } catch (e) {
            Logger.error("core", e);
        }

        process.on("SIGTERM", () => this.stop());
        process.on("SIGINT", () => this.stop());
    }

    public async stop() {
        Logger.info("Core", "Disconnecting from Redis...");
        this.redis.disconnect().then(() => {
            Logger.info("Core", "Disconnected from Redis.");
            process.exit(0);
        })
        .catch((error: string) => Logger.error("Core", error));
    }
}
