
import { Config } from "../config";
import { EventEmitter } from "events";

import * as Amqp from "amqp-ts";

export class RabbitHandler extends EventEmitter {
    private connection: Amqp.Connection;
    private proxyExchange: Amqp.Exchange;
    private messageQueue: Amqp.Queue;
    private outgoingQueue: Amqp.Queue;

    constructor(private config: Config) {
        super();
    }

    public async connect() {
        this.connection = new Amqp.Connection(`amqp://${this.config.rabbitmq.host}:${this.config.rabbitmq.port}`);
        this.proxyExchange = this.connection.declareExchange("proxy");
        
        this.messageQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages);
        this.outgoingQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages + "-proxy");
        
        this.messageQueue.bind(this.proxyExchange);
        this.outgoingQueue.bind(this.proxyExchange);

        this.messageQueue.activateConsumer((raw) => {
            raw.ack();

            const message = JSON.parse(raw.getContent());
            this.emit("service:message", message);
        });

        await this.connection.completeConfiguration();
    }

    public async disconnect() {
        await this.connection.close();
    }

    public async queueResponse(message: ProxyResponse[]) {
        for (let i = 0; i < message.length; i++) {
            message[i].order = i;
        }

        const stringed = JSON.stringify(message);
        await this.outgoingQueue.send(new Amqp.Message(stringed));
    }
}
