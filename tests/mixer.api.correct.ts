
import { test } from "ava";
import { MixerAPI } from "../src/service/services/mixer/api";
import { default as axios } from "axios";

const mockAdapter = require("axios-mock-adapter");
let mockAPI = new mockAdapter(axios);
const mixerAPI = new MixerAPI("~");

test.beforeEach("Before", async t => {
    mockAPI.onGet("~/channels/0x01").reply(200, {
        id: 1,
        userId: 2,
        token: "0x01"
    });

    mockAPI.onGet("~/channels/1").reply(200, {
        id: 1,
        userId: 2,
        token: "0x01"
    });

    mockAPI.onGet("~/users/current").reply(200, {
        username: "0x01"
    });

    mockAPI.onGet("~/chats/1").reply(200, {
        authkey: "abc",
        endpoints: ["wss://a.b"]
    });
});

test("should give proper channel id.", async t => {
    t.deepEqual(await mixerAPI.getChannelId("0x01"), 1);
});

test("should give proper user id.", async t => {
    t.deepEqual(await mixerAPI.getUserId("0x01"), 2);
});

test("should give proper channel name.", async t => {
    t.deepEqual(await mixerAPI.getChannelName(1), "0x01");
});

test("should give proper current user name.", async t => {
    t.deepEqual(await mixerAPI.getCurrentUserName({}), "0x01");
});

test("should give proper endpoints and authkey.", async t => {
    t.deepEqual(await mixerAPI.getChats(1, {}), {
        authkey: "abc",
        endpoints: ["wss://a.b"]
    });
});
