
import { Event, EventController } from ".";
import { Injectable } from "@angular/core";

import { TwitchParser, MixerParser, AbstractServiceParser } from "../parsers";
import { RabbitHandler } from "../rabbit";
import { Cereus } from "../cereus";
import { Logger } from "cactus-stl";

@EventController()
@Injectable()
export class MessageHandler {

    private twitchParser: TwitchParser;
    private mixerParser: MixerParser;

    constructor(private cereus: Cereus, private rabbit: RabbitHandler) {
        this.twitchParser = new TwitchParser();
        this.mixerParser = new MixerParser();
    }
    
    @Event("message")
    public async onServiceMessage(data: EventData) {
        const parser = await this.getParser(data.service);
        if (!parser) {
            Logger.error("Message Handler", `No parser for service '${data.service}' exists.`);
            return;
        }
        const result = await parser.parse(data.data);
        const response = await this.cereus.handle(await this.cereus.parseServiceMessage(result));
        if (!response) {
            return;
        }
        const ready = await parser.synthesize(response);
        ready.forEach(async part => await this.rabbit.queueResponse(part));
    }

    private async getParser(service: string): Promise<AbstractServiceParser> {
        switch (service.toLowerCase()) {
            case "mixer":
                return this.mixerParser;
            case "twitch":
                return this.twitchParser;
            default:
                return null;
        }
    }
}
