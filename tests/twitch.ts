
import "reflect-metadata";

import { test } from "ava";
import { TwitchHandler } from "../src/service/services";

const twitch = new TwitchHandler(null);

const twitchChatPacket: any = [
    // Message
    "test",
    // State
    {
        badges: {
            broadcaster: "1"
        },
        color: "#2E8B57",
        "display-name": "Innectic",
        emotes: null,
        id: "8b67ba96-0f5a-45c6-b265-b07091dbbcc7",
        mod: false,
        "room-id": "82607708",
        "sent-ts": "1502568743764",
        subscriber: false,
        "tmi-sent-ts": "1502568745720",
        turbo: false,
        "user-id": "82607708",
        "user-type": null,
        "emotes-raw": null,
        "badges-raw": "broadcaster/1",
        username: "innectic",
        "message-type": "chat"
    }
]

const twitchChatConverted: any = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: false
    },
    user: "Innectic",
    role: "owner",
    service: "Twitch",
    channel: undefined
}

const twitchWhisperPacket: any = [
    "test",
    {
        badges: null,
        color: "#2E8B57",
        "display-name": "Innectic",
        emotes: null,
        "message-id": "11",
        "thread-id": "82607708_124841066",
        turbo: false,
        "user-id": "82607708",
        "user-type": null,
        "emotes-raw": null,
        "badges-raw": null,
        username: "innectic",
        "message-type": "whisper",
    }
]

const twitchWhisperConverted: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: false
    },
    user: "Innectic",
    role: "user",
    service: "Twitch",
    target: "innectic",
    channel: undefined
};

const twitchChatActionConverted: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: true
    },
    user: "0x01",
    role: "user",
    service: "Twitch",
    channel: undefined, // What in tarnation
    target: "CactusBotDev"
}

const multiEmoji: CactusScope = {
    packet: {
        "type": "message",
        text: [
            {"type": "text", "data": "Cactus love! "},
            {"type": "emoji", "data": "cactus"},
            {"type": "emoji", "data": "green_heart"}
        ],
        action: false // TODO
    },
    channel: "456",
    user: "Innectic",
    role: "owner",
    service: "Discord"
}

test("has the proper name", async t => {
    t.is(twitch.serviceName, "Twitch");
});

test("converts a Twitch chat packet to a Cactus chat packet", async t => {
    const result = await twitch.convert(twitchChatPacket);
    t.deepEqual(result, twitchChatConverted);
});

test("converts a Twitch whisper packet to a Cactus whisper packet", async t => {
    const result = await twitch.convert(twitchWhisperPacket);
    t.deepEqual(result, twitchWhisperConverted);
});

test("converts a Cactus message packet to a Twitch message packet", async t => {
    const result = await twitch.invert(twitchChatConverted);
    t.deepEqual(result, ["test"]);
});

test("converts a Cactus message whisper packet to a Twitch whisper packet", async t => {
    const result = await twitch.invert(twitchWhisperConverted);
    t.deepEqual(result, ["test"]);
});

test("converts a Cactus message action packet to a Twitch message action packet", async t => {
    const result = await twitch.invert(twitchChatActionConverted);
    t.deepEqual(result, ["ACTION test"]);
});

test("converts 'Broadcaster' to 'owner'", async t => {
    const result = await twitch.convertRole("Broadcaster");
    t.is(result, "owner");
});

test("converts 'Mod' to 'moderator'", async t => {
    const result = await twitch.convertRole("Mod");
    t.is(result, "moderator");
});

test("converts 'literally anything else' to 'user'", async t => {
    const result = await twitch.convertRole("literally anything else");
    t.is(result, "user");
});

test("converts a text, cactus, and green heart to the proper format for Twitch.", async t => {
    const result = await twitch.invert(multiEmoji);
    t.deepEqual(result, ["Cactus love! :cactus: <3"]);
})
