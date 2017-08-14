"use strict";

// We need this for testing services.
require("reflect-metadata");

const chai = require("chai");
chai.use(require("chai-as-promised"));

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const twitch = new (require("../dist/service/services/twitch").TwitchHandler)(null);

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
    "packet": {
        "type": "message",
        "text": [
            {
                "type": "text",
                "data": "test"
            }
        ],
        "action": false
    },
    "user": "Innectic",
    "role": "owner",
    "service": "Twitch"
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
    "packet": {
        "type": "message",
        "text": [
            {
                "type": "text",
                "data": "test"
            }
        ],
        "action": false
    },
    "user": "Innectic",
    "role": "user",
    "service": "Twitch",
    "target": "innectic"
}

describe("Service", () => {
    describe("Mixer", () => {
        it("should convert an incoming message", (done) => {
            mixer.convert(mixerChatPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerChatConverted)).notify(done);
        });

        it("should convert a whispered message", (done) => {
            mixer.convert(mixerWhisperPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerWhisperConverted)).notify(done);
        });

        // This might look like it does nothing, but it's important.
        it("should convert the 'cactus' placeholder into the ':cactus' emoji", (done) => {
            mixer.getEmoji("cactus").should.eventually.be.equal(":cactus").notify(done);
        });

        it("should convert the '.sarcasm' placeholder into the ':mappa' emoji ", (done) => {
            mixer.getEmoji(".sarcasm").should.eventually.be.equal(":mappa").notify(done);
        });

        it("should omit the 'TESTING' emote.", (done) => {
            mixer.getEmoji("TESTING").should.eventually.be.equal(":TESTING:").notify(done);
        })

        it("should convert the 'green_heart' placeholder into the '<3' emoji", (done) => {
            mixer.getEmoji("green_heart").should.eventually.be.equal("<3").notify(done);
        });

        it("should convert the 'Mod' role to 'moderator'", (done) => {
            mixer.convertRole("Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'User' role to 'user'", (done) => {
            mixer.convertRole("User").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Owner' role to 'owner'", (done) => {
            mixer.convertRole("Owner").should.eventually.be.equal("owner").notify(done);
        });

        it("should convert the 'Founder' role to 'user'", (done) => {
            mixer.convertRole("Founder").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Global Mod' role to 'user'", (done) => {
            mixer.convertRole("Global Mod").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'SPAM' role to 'user'", (done) => {
            mixer.convertRole("SPAM").should.eventually.be.equal("user").notify(done);
        });
    });

    describe("Twitch", () => {
        it("should convert an incoming message", (done) => {
            twitch.convert(twitchChatPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(twitchChatConverted)).notify(done);
        });

        it("should convert a whispered message", (done) => {
            twitch.convert(twitchWhisperPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(twitchWhisperConverted)).notify(done);
            });

        it("should convert the '.sarcasm' placeholder into the 'Kappa' emoji", (done) => {
            twitch.getEmoji(".sarcasm").should.eventually.be.equal("Kappa").notify(done);
        });

        it("should omit the 'cactus' placeholder", (done) => {
            twitch.getEmoji("cactus").should.eventually.be.equal(":cactus:").notify(done);
        });

        it("should convert the 'smile' placeholder into the ':D' emoji", (done) => {
            twitch.getEmoji("smile").should.eventually.be.equal(":D").notify(done);
        });

        it("should convert the 'Mod' role to 'moderator'", (done) => {
            twitch.convertRole("Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'User' role to 'user'", (done) => {
            twitch.convertRole("User").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Broadcaster' role to 'owner'", (done) => {
            twitch.convertRole("broadcaster").should.eventually.be.equal("owner").notify(done);
        });

        it("should convert the 'SPAM' role to 'user'", (done) => {
            twitch.convertRole("SPAM").should.eventually.be.equal("user").notify(done);
        });
    });
});
