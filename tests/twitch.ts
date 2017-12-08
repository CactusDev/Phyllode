
import test from "ava";

import { TwitchParser } from "../src/parsers";

const proxyChatMessage: ProxyMessage = {
	botInfo: {
		username: "cactusbotdev",
		botId: 123
	},
	channel: "0x01",
	meta: {
		badges: {
			broadcaster: "1"
		},
		"display-name": "0x01",
		emotes: null,
		id: "df85e223-ff8b-4d77-a5b9-570974ec8ab9",
		mod: false,
		"sent-ts": "1512690718917",
		subscriber: false,
		turbo: false,
		"user-id": "82607708",
		"user-type": null,
		username: "0x01",
		"message-type": "chat"
	},
	parts: [
		"Test"
	],
	service: "Twitch",
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
	service: "Twitch",
	target: undefined
};

const proxyResponse: ProxyResponse = {
	channel: "0x01",
	message: "Test",
	meta: {
		action: false,
		target: undefined
	},
	service: "Twitch"
}

test("parser shouldn't give anything if it was given nothing", async t => {
	const parser = new TwitchParser();
	t.is(await parser.parse(null), null);
});

test("parser should properly parse proxy messages into CactusFormat", async t => {
	const parser = new TwitchParser();
	t.deepEqual(await parser.parse(proxyChatMessage), cactusChatMessage);
});

test("parser should convert cactus packet into a proxy response", async t => {
	const parser = new TwitchParser();
	t.deepEqual(await parser.synthesize([cactusChatMessage]), [proxyResponse]);
});

test("parser should convert smile to :)", async t => {
	const parser = new TwitchParser();
	t.is(await parser.getEmoji("smile"), ":)"); // XXX: This can probably break easily
});

test("parser should convert .sarcasm to :mappa", async t => {
	const parser = new TwitchParser();
	t.is(await parser.getEmoji(".sarcasm"), "Kappa");
});
