
import { Event, EventController } from ".";

import { RedisController, Logger } from "cactus-stl";

@EventController(true)
export class EventHandler {

	constructor(private redis: RedisController) {

	}

    @Event(["service:channel:follow", "service:channel:subscribe", "service:channel:host"])
    public async onUserFollowChannel(data: EventData) {
    	const currentTime = new Date().getMilliseconds();
    	// Build a cacheable event.
    	const storedEvent: BasicCachedEvent = {
    		created: currentTime,
    		updated: currentTime,
    		ends: currentTime + 4000, // TODO: Make this a configurable thing
    		data: data.data
    	};

    	Logger.info("Core", `Caching event 'follow' for channel ${data.channel} on user ${data.data.user}`);
    }
}
