
import { Event, EventController } from ".";
import { TwitchParser, MixerParser, AbstractServiceParser } from "../parsers";
import { RabbitHandler } from "../rabbit";
import { Cereus } from "../cereus";

@EventController()
export class MessageHandler {

	constructor(private cereus: Cereus, private rabbit: RabbitHandler) {

	}

    private twitchParser: TwitchParser = new TwitchParser();
    private mixerParser: MixerParser = new MixerParser();

	@Event("message")
	public async onServiceMessage(data: EventData) {
		console.log("Got a message from event!", data);
		console.log("Testing the dep injection", this.rabbit.eventNames());
		// let parser: AbstractServiceParser;
		// if (data.service === "mixer") {
		// 	parser = this.mixerParser;
		// } else if (data.service === "twitch") {
		// 	parser = this.twitchParser;
		// }

		// const result = await parser.parse(data.data);
		// const response = await this.cereus.handle(await this.cereus.parseServiceMessage(result));
		// if (!response) {
		// 	return;
		// }
		// const ready = await parser.synthesize(response);
		// ready.forEach(async part => await this.rabbit.queueResponse(part));
	}
}
