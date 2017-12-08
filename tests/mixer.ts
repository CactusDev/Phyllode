
import test from "ava";

import { MixerParser } from "../src/parsers";

const fewEmoji: Emojis = {
	":)": {
        standard: "simple_smile",
        alternatives: ["smile", "smiley", "grin", "grinning"]
    },
    ":(": {
        standard: "sob"
    }
}

const reversedEmoji: ReverseEmojis = {
	simple_smile: ":)",
	sob: ":("
}

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
		"Test",
		"",
		"https://google.com"
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
			},
			{
				type: "url",
				data: "https://google.com"
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
	message: "Test https://google.com",
	meta: {
		action: false,
		target: undefined
	},
	service: "Mixer"
}

const parser = new MixerParser();

test("parser shouldn't give anything if it was given nothing", async t => {
	t.is(await parser.parse(null), null);
});

test("parser should properly parse proxy messages into CactusFormat", async t => {
	t.deepEqual(await parser.parse(proxyChatMessage), cactusChatMessage);
});

test("parser should convert cactus packet into a proxy response", async t => {
	t.deepEqual(await parser.synthesize([cactusChatMessage]), [proxyResponse]);
});

test("parser should convert :smile: to :]", async t => {
	t.is(await parser.getEmoji("smile"), ":]");
});

test("parser should convert .sarcasm to :mappa", async t => {
	t.is(await parser.getEmoji(".sarcasm"), ":mappa");
});

test("parser should properly reverse emoji", async t => {
	t.deepEqual(await (<any> parser).reverseEmojis(fewEmoji), reversedEmoji);
});

test("parser should give nothing if it's missing the meta", async t => {
	t.is(await parser.parse({
		botInfo: {
			username: "cactusbotdev",
			botId: 123
		},
		channel: "0x01",
		meta: null,
		parts: [
			"Test"
		],
		service: "Mixer",
		source: "0x01"
	}), null);
})
