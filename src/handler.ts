
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";
import { TwitchParser, MixerParser, AbstractServiceParser } from "./parsers";

export class PacketHandler {

    private twitchParser: TwitchParser;
    private mixerParser: MixerParser;

    constructor(private cereus: Cereus, private rabbit: RabbitHandler) {
        this.twitchParser = new TwitchParser();
        this.mixerParser = new MixerParser();
    }

    public async handleData(message: ProxyMessage | ServiceEvent) {
        console.log(message.channel);
        const parser = this.getParser(message.service);
        if (!parser) {
            console.error(`could not get parser for ${message.service}`);
            return;
        }

        let context: CactusContext = null;
        if (message.type === "message") {
            const parsed = await parser.parse(message);
            context = await this.cereus.parseServiceMessage(parsed);
        } else if (message.type === "event") {
            context = await this.handleEventData(<ServiceEvent> message)
        }
        const result = await this.cereus.handle(context);
        if (!result) {
            console.error("no cereus response");
            return;
        }
        await this.rabbit.queueResponse(await parser.synthesize(result));
    }

    private async handleEventData(message: ServiceEvent): Promise<CactusContext> {
        let data: CactusEvent = null;

        if (message.event === "start") {
            data = <StartEvent>{
                type: "start",
                new: message.extra.new
            };
        }
        if (!data) {
            console.error(`could not handle event type: ${message.event}`);
            return;
        }

        return {
            channel: message.channel,
            packet: {
                type: "event",
                kind: data
            },
            service: message.service,
            target: message.target,
            user: message.target
        };
    }

    private getParser(service: string): AbstractServiceParser {
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
