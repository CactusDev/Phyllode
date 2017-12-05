
import { Injectable } from "@angular/core";
import { Event, EventController } from ".";

@EventController()
@Injectable()
export class EventHandler {

    @Event("follow")
    public async onUserFollowChannel(data: EventData) {

    }
}
