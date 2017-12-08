
import { MessageHandler } from "../src/handlers";
import test from "ava";

import { Cereus } from "../src/cereus";
import axios from "axios";
const mockAdapter = require("axios-mock-adapter");

const cereus = new Cereus("response");

// heh....
function getCereus() {
	return new mockAdapter(axios);
}

const messageHandler = new MessageHandler(cereus, null);

const proxyMixerChatMessage: ProxyMessage = {
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

const proxyTwitchChatMessage: ProxyMessage = {
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


test("should have a valid mixer parser", async t => {
	t.not((<any> messageHandler).mixerParser, null);
});

test("should have a valid twitch parser", async t => {
	t.not((<any> messageHandler).twitchParser, null);
});

test("should give the proper parser for twitch", async t => {
	t.deepEqual(await (<any> messageHandler).getParser("twitch"), (<any> messageHandler).twitchParser);
});

test("should give the proper parser for mixer", async t => {
	t.deepEqual(await (<any> messageHandler).getParser("mixer"), (<any> messageHandler).mixerParser);
});

test("should give null if a parser doesn't exist", async t => {
	t.is(await (<any> messageHandler).getParser("fake"), null);
});

test("should give null if cereus gives an empty list", async t => {
	const c = getCereus();
	c.onGet("/response").reply(404);

	t.is(await messageHandler.onServiceMessage({ channel: "", data: "", event: "", service: "" }), null);
});
