
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";
import { TwitchParser, AbstractServiceParser } from "./parsers";

export class PacketHandler {

    private serviceParsers: {[name: string]: AbstractServiceParser};

    constructor(private cereus: Cereus, private rabbit: RabbitHandler) {
        this.serviceParsers = {
            "twitch": new TwitchParser()
        };
    }

    public async handleData(message: ProxyMessage | ServiceEvent) {
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

    public async handleRepeat(data: RepeatMessage) {
        const parser = this.getParser(data.service)
        if (!parser) {
            console.error(`could not get parser for ${data.service}`)
            return
        }

        const response = await parser.synthesize([
            {
                packet: data.packet,
                channel: data.channel,
                service: data.service
            }
        ])
        await this.rabbit.queueResponse(response)
    }

    private createEventData(event: ServiceEvent): CactusEvent | null {
        switch (event.event) {
            case "start":
                return {
                    type: "start",
                    new: event.extra.new
                }
            case "follow":
                return {
                    type: "follow",
                    success: true // TODO: Check with the event cache to make sure that this user didn't follow recently.
                }
            case "subscribe":
                return {
                    type: "subscribe",
                    streak: 0
                }
            default:
                return null
        }
    }

    private async handleEventData(message: ServiceEvent): Promise<CactusContext> {
        let data: CactusEvent = null;

        switch (message.event) {
            case "start":
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
        return this.serviceParsers[service.toLowerCase()];
    }
}
