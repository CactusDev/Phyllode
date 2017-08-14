
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

test("has the proper name", async t => {
    t.is(discord.serviceName, "Discord");
});

test("converts 'literally anything' to 'owner'", async t => {
    const result = await discord.convertRole("literally anything");
    t.is(result, "owner");
});

test("converts a Discord message packet to a Cactus message packet", async t => {
    const result = await discord.convert(messagePacket);
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
