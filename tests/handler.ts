
import test from "ava";

import { EventController, Event } from "../src/handlers";
import { HandlerController } from "../src/handlers/handler";

import { reflectAnnotations, createAnnotationFactory } from "reflect-annotations";

import { Injectable, ReflectiveInjector } from "@angular/core";

class FakeAnnotation {
    constructor(public handlerName: string[] | string) {}
}
export const FakeEvent = createAnnotationFactory(FakeAnnotation);

@EventController()
@Injectable()
export class BasicHandler {

	@FakeEvent("blah")
	public async blarg() {
		return "Why did this happen";
	}

	@Event(["Event", "AnotherEvent"])
	public async anotherRealOne(data: EventData) {
		return "Yay!";
	}
	
	@Event("RealEvent")
	public async thisIsReal(data: EventData) {
		return "Things."
	}

	@Event(null)
	public async thisBreaks(data: EventData) {

	}

	@Event("A")
	@Event("B")
	public async thisWillToo(data: EventData) {
		
	}
}

const injector = ReflectiveInjector.resolveAndCreate([
	BasicHandler
]);

const handler = new HandlerController(null, injector);

async function doTesting() {
	await handler.setup([ BasicHandler ]);
	
	test("only the correct handlers are registered", async t => {
		const result = await handler.push("blah", {});
		if (result && result === ["Why did this happen"]) {
			t.fail("Got result from an invalid handler, blah.");
		}

		const otherResult = await handler.push("RealEvent", {
	        event: "message",
	        service: "Twitch",
	        channel: "0x01",
	        data: "Testing"
	    });

		if (!otherResult) {
			t.fail("Didn't get a result from an existing handler");
			return;
		}
		t.deepEqual(otherResult, ["Things."]);
	});
}

doTesting();
