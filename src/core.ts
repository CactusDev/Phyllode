import { Injectable } from "@angular/core";

import { Logger } from "./logger";
import { RedisController } from "cactus-stl";
import { RabbitHandler } from "./rabbit";

import { TwitchParser, MixerParser } from "./parsers";
import { Cereus } from "./cereus";

/**
 * Start all the Core services.
 *
 * @export
 * @class Core
 */
@Injectable()
export class Core {

    private twitchParser: TwitchParser;
    private mixerParser: MixerParser;

    constructor(private redis: RedisController, private rabbit: RabbitHandler, private cereus: Cereus) {
        this.twitchParser = new TwitchParser();
        this.mixerParser = new MixerParser();
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
                if (message.service === "Twitch") {
                    const result = await this.twitchParser.parse(message);

                    // Ask cereus what we should do
                    const response = await this.cereus.handle(await this.cereus.parseServiceMessage(result));
                    if (!response || response.length === 0) {
                        return;
                    }
                    const synth = await this.twitchParser.synthesize(response);
                    synth.forEach(async s => await this.rabbit.queueResponse(s));
                } else if (message.service === "Mixer") {
                    const result = await this.mixerParser.parse(message);

                    // Ask cereus what we should do
                    const response = await this.cereus.handle(await this.cereus.parseServiceMessage(result));
                    if (!response || response.length === 0) {
                        return;
                    }
                    const synth = await this.mixerParser.synthesize(response);
                    synth.forEach(async s => await this.rabbit.queueResponse(s));
                }
            });
        } catch (e) {
            Logger.error("core", e);
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
