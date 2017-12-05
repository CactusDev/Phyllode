
# About EventExecutors

Event executors are simple functions annotated with @Event, that handle internal, or external events that they specify.

They're allowed to return a value, but that value may not always be listened to. Said value must be one of the internally defined
event response types.

If this event is a `stop`, then all execution will stop. For the case of a fatal error, like not being able to contact Cereus, RabbitMQ,
or something like that, this error should be used.

## EventExecutor events

EventExecutors can subscribe to any event, but they might not ever get data. This system supports wildcards too.

#### Example Event Handler

```typescript

@EventHandler()
export class ExampleEventHandler {

    @Event("*")
    public async iTakeAllTheThings(data: EventData) {
        console.log("There was an event somewhere:", JSON.stringify(data));
    }

    @Event("service:message")
    public async onServiceMessage(data: EventData) {
        console.log(`Got a message on ${data.service} in channel ${data.channel}.`, JSON.stringify(data.data));
    }
}
```

## Using dependencies within the handler class

EventHandlers fully support having dependencies that are in the main injector.

```typescript

@EventHandler()
@Injectable()
export class AnotherEventHandler {

    constructor(private rabbit: RabbitHandler) {

    }

    @Event("service:message")
    public async onServiceMessage(data: EventData) {
        const response = // do something here
        await this.rabbit.queueResponse(response);
    }
}

```

Currently, handlers that take dependencies must be marked `@Injectable`, but that is only temporary
