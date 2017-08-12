"use strict";

// We need this for testing services.
require("reflect-metadata");

const chai = require("chai");
chai.use(require("chai-as-promised"));

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const mixer = require("../dist/service/services/mixer").MixerHandler;
const twitch = require("../dist/service/services/twitch").TwitchHandler;

const mixerChatConverted = {
    type: "message",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false,
    user: "0x01",
    role: "user"
}

const mixerWhisperConverted = {
    type: "message",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false,
    user: "0x01",
    role: "user",
    target: "CactusBotDev"
}

const mixerWhisperPacket = {
    "channel": 17887,
    "id": "086474c0-6f1f-11e7-acbe-8532481fa356",
    "user_name": "0x01",
    "user_id": 1293590,
    "user_roles": [
        "User"
    ],
    "user_level": 5,
    "message": {
        "message":[
            {"type": "text", "data": "test", "text": "test"}
        ],
        "meta": {
            "whisper": true
        }
    },
    "target": "CactusBotDev"
}

const mixerChatPacket = {
    "channel": 17887,
    "id": "cc486cd0-6f1e-11e7-acbe-8532481fa356",
    "user_name": "0x01",
    "user_id": 1293590,
    "user_roles": [
        "User"
    ],
    "user_level": 5,
    "message": {
        "message": [
            {"type": "text", "data": "test", "text": "test"}
        ],
        "meta": {}
    }
}

const twitchChatPacket = [
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

const twitchChatConverted = {
    type: "message",
    user: "Innectic",
    role: "owner",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false
}

const twitchWhisperPacket = [
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
        "message-type": "whisper"
    }
]

const twitchWhisperConverted = {
    type: "message",
    user: "Innectic",
    role: "user",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false,
    target: "innectic"
}

describe("Service", () => {
    describe("Mixer", () => {
        it("should convert an incoming message", (done) => {
            mixer.prototype.convert(mixerChatPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerChatConverted)).notify(done);
        });

        it("should convert a whispered message", (done) => {
            mixer.prototype.convert(mixerWhisperPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerWhisperConverted)).notify(done);
        });

        // This might look like it does nothing, but it's important.
        it("should convert the 'cactus' emote into ':cactus'", (done) => {
            mixer.prototype.getEmoji("cactus").should.eventually.be.equal(":cactus").notify(done);
        });

        it("should convert the ':mappa' emote into '.sarcasm'", (done) => {
            mixer.prototype.getEmoji("mappa").should.eventually.be.equal(".sarcasm").notify(done);
        });

        it("should convert the ':D' emote into 😃", (done) => {
            mixer.prototype.getEmoji(":D").should.eventually.be.equal("😃").notify(done);
        });

        it("should convert the 'Mod' role to 'moderator'", (done) => {
            mixer.prototype.convertRole("Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'User' role to 'user'", (done) => {
            mixer.prototype.convertRole("User").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Owner' role to 'owner'", (done) => {
            mixer.prototype.convertRole("Owner").should.eventually.be.equal("owner").notify(done);
        });

        it("should convert the 'Founder' role to 'moderator'", (done) => {
            mixer.prototype.convertRole("Founder").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'Global Mod' role to 'moderator'", (done) => {
            mixer.prototype.convertRole("Global Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'SPAM' role to 'user'", (done) => {
            mixer.prototype.convertRole("SPAM").should.eventually.be.equal("user").notify(done);            
        });
    });

    describe("Twitch", () => {
        it("should convert an incoming message", (done) => {
            twitch.prototype.convert(twitchChatPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(twitchChatConverted)).notify(done);
        });

        it("should convert a whispered message", (done) => {
            twitch.prototype.convert(twitchWhisperPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(twitchWhisperConverted)).notify(done);
            });

        it("should convert the 'Kappa' emote into '.sarcasm'", (done) => {
            twitch.prototype.getEmoji("Kappa").should.eventually.be.equal(".sarcasm").notify(done);
        });

        it("should leave the 'cactus' emote alone", (done) => {
            twitch.prototype.getEmoji("cactus").should.eventually.be.equal("cactus").notify(done);
        });

        it("should convert the ':D' emote into 😃", (done) => {
            twitch.prototype.getEmoji(":D").should.eventually.be.equal("😃").notify(done);
        });

        it("should convert the 'Mod' role to 'moderator'", (done) => {
            twitch.prototype.convertRole("Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'User' role to 'user'", (done) => {
            twitch.prototype.convertRole("User").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Broadcaster' role to 'owner'", (done) => {
            twitch.prototype.convertRole("broadcaster").should.eventually.be.equal("owner").notify(done);
        });

        it("should convert the 'SPAM' role to 'user'", (done) => {
            twitch.prototype.convertRole("SPAM").should.eventually.be.equal("user").notify(done);            
        });
    });
});
