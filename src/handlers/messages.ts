
import { Event, EventController } from ".";

import { TwitchParser, MixerParser, AbstractServiceParser } from "../parsers";
import { RabbitHandler } from "../rabbit";
import { Cereus } from "../cereus";
import { Logger } from "cactus-stl";

import { StopResponse } from "./responses"

@EventController({ depends: [Cereus, RabbitHandler] })
export class MessageHandler {

    private twitchParser: TwitchParser;
    private mixerParser: MixerParser;

    constructor(private cereus: Cereus, private rabbit: RabbitHandler) {
        this.twitchParser = new TwitchParser();
        this.mixerParser = new MixerParser();
    }
    
    @Event("service:channel:message")
    public async onServiceMessage(data: EventData) {
        const parser = await this.getParser(data.service);
        if (!parser) {
            Logger.error("Message Handler", `No parser for service '${data.service}' exists.`);
            return null;
        }
        const result = await parser.parse(data.data);
        let thingy = await this.cereus.parseServiceMessage(result);
        console.log(thingy);
        const response = await this.cereus.handle(thingy);
        console.log(response);
        if (!response) {
            return response;
        }
        const ready = await parser.synthesize(response);
        console.log(ready);
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
