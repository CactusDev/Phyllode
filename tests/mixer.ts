
import test from "ava";

import { MixerParser } from "../src/parsers";

const proxyChatMessage: ProxyMessage = {
	botInfo: {
		username: "cactusbotdev",
		botId: 123
	},
	channel: "0x01",
	meta: {
		role: "owner",
		action: false
	},
	parts: [
		"Test"
	],
	service: "Mixer",
	source: "0x01"
};

const cactusChatMessage: CactusContext = {
	packet: {
		type: "message",
		text: [
			{
				type: "text",
				data: "Test"
			}
		],
		action: false
	},
	channel: "0x01",
	user: "0x01",
	role: "owner",
	service: "Mixer",
	target: undefined
};

const proxyResponse: ProxyResponse = {
	channel: "0x01",
	message: "Test",
	meta: {
		action: false,
		target: undefined
	},
	service: "Mixer"
}

test("parser shouldn't give anything if it was given nothing", async t => {
	const parser = new MixerParser();
	t.is(await parser.parse(null), null);
});

test("parser should properly parse proxy messages into CactusFormat", async t => {
	const parser = new MixerParser();
	t.deepEqual(await parser.parse(proxyChatMessage), cactusChatMessage);
});

test("parser should convert cactus packet into a proxy response", async t => {
	const parser = new MixerParser();
	t.deepEqual(await parser.synthesize([cactusChatMessage]), [proxyResponse]);
})
