
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
