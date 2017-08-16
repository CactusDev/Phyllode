
import { test } from "ava";
import { MixerAPI } from "../src/service/services/mixer/api";
import { default as axios } from "axios";

const mockAdapter = require("axios-mock-adapter");
let mockAPI = new mockAdapter(axios);
const mixerAPI = new MixerAPI("~");

mockAPI.onGet("~/channels/0x01").reply(201, {
    id: 1,
    userId: 2,
    token: "0x01"
});

mockAPI.onGet("~/channels/1").reply(201, {
    id: 1,
    userId: 2,
    token: "0x01"
});

mockAPI.onGet("~/users/current").reply(201, {
    username: "0x01"
});

mockAPI.onGet("~/chats/1").reply(201, {
    authkey: "abc",
    endpoints: ["wss://a.b"]
});

test("shouldn't give proper channel id.", async t => {
    t.is(await mixerAPI.getChannelId("0x01"), -1);
});

test("shouldn't give proper user id.", async t => {
    t.is(await mixerAPI.getUserId("0x01"), -1);
});

test("shouldn't give proper channel name.", async t => {
    t.is(await mixerAPI.getChannelName(1), "");
});

test("shouldn't give proper current user name.", async t => {
    t.is(await mixerAPI.getCurrentUserName({}), "");
});

test("shouldn't give proper endpoints and authkey.", async t => {
    t.is(await mixerAPI.getChats(1, {}), null);
});
