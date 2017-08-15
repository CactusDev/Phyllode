import { ServiceStatus } from "../src/service/service";

import "reflect-metadata";

import { test } from "ava";
import { DiscordHandler } from "../src/service/services";

const discord = new DiscordHandler(null);

const messagePacket = [
    "test",
    "123",
    "456"
]

const convertedMessage: CactusScope = {
    packet: {
        "type": "message",
        text: [{
            "type": "text",
            data: "test"
        }],
        action: false // TODO
    },
    channel: "456",
    user: "Innectic",
    role: "owner",
    service: "Discord"
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

const urlSegment: CactusScope = {
    channel: "456",
    packet: {
        action: false,
        type: "message",
        text: [
            {type: "url", data: "https://google.com"}
        ],
    },
    user: "Innectic",
    role: "owner",
    service: "Discord"
}

const emojiSegment: CactusScope = {
    channel: "456",
    packet: {
        action: false,
        type: "message",
        text: [
            {type: "emoji", data: ":green_heart:"}
        ],
    },
    user: "Innectic",
    role: "owner",
    service: "Discord"
}

const eventPacket: CactusScope = {
    packet: {
        type: "event",
        kind: {
            success: true,
            streak: 1,
            type: "follow"
        }
    },
    user: "0x01",
    role: "user",
    service: "Twitch",
    channel: undefined,
}

const nullConvertedMessage: CactusScope = {
    packet: {
        "type": "message",
        text: [null],
        action: false // TODO
    },
    channel: "456",
    user: "Innectic",
    role: "owner",
    service: "Discord"
}


test("can only 'connect' once", async t => {
    t.true(await discord.connect("abc"));
    discord.setStatus(ServiceStatus.READY);
    t.false(await discord.connect("abc"));
});

test("has the proper name", async t => {
    t.is(discord.serviceName, "Discord");
});

test("converts 'literally anything' to 'owner'", async t => {
    const result = await discord.convertRole("literally anything");
    t.is(result, "owner");
});

test("converts a Discord message packet to a Cactus message packet", async t => {
    const result = await discord.convert(["test", "123", "456"]);
    t.deepEqual(result, convertedMessage);
});

test("converts a Cactus message packet to a Discord message packet", async t => {
    const result = await discord.invert(convertedMessage);
    t.deepEqual(result, ["test"]);
});

test("converts a text, cactus, and green heart to the proper format for Discord.", async t => {
    const result = await discord.invert(multiEmoji);
    t.deepEqual(result, ["Cactus love! :cactus::green_heart:"]);
});

test("converts https://google.com into a url segment", async t => {
    const result = await discord.convert(["https://google.com", "123", "456"]);
    t.deepEqual(result, urlSegment);
});

test("ignores non-message types while inverting", async t => {
    t.deepEqual(await discord.invert(eventPacket), []);
});

test("ignores null messages", async t => {
    t.deepEqual(await discord.invert(nullConvertedMessage), []);
});
