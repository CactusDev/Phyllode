
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

// This is literally just to make the coverage not suck here
test("coverage hack", async t => {
	const thing = new BasicHandler();
	t.is(await thing.blarg(), "Why did this happen");
	t.is(await thing.anotherRealOne(null), "Yay!");
	t.is(await thing.thisBreaks(null), undefined);
	t.is(await thing.thisWillToo(null), undefined);
})

const injector = ReflectiveInjector.resolveAndCreate([
	BasicHandler
]);

const handler = new HandlerController(null, injector);

async function doTesting() {
	await handler.setup([ BasicHandler ]);
	
	test("only the correct handlers are registered", async t => {
		const result = await handler.push("blah", {});
		t.is(result.length, 0, "Got result from an invalid handler, blah.");

		const otherResult = await handler.push("RealEvent", {
	        event: "message",
	        service: "Twitch",
	        channel: "0x01",
	        data: "Testing"
	    });

		t.truthy(otherResult.length > 0, "Didn't get a result from an existing handler");
        t.deepEqual(otherResult, ["Things."]);
	});
}

doTesting();
