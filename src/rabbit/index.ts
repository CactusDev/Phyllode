
import { Config } from "../config";
import { EventEmitter } from "events";

import * as Amqp from "amqp-ts";

export class RabbitHandler extends EventEmitter {
	private connection: Amqp.Connection;
	private proxyExchange: Amqp.Exchange;
	private messageQueue: Amqp.Queue;

	constructor(private config: Config) {
		super();
	}

	public async connect() {
		this.connection = new Amqp.Connection(`amqp://localhost`);
		this.proxyExchange = this.connection.declareExchange("proxy");
		this.messageQueue = this.connection.declareQueue(this.config.rabbitmq.queues.messages);
		this.messageQueue.bind(this.proxyExchange);

		this.messageQueue.activateConsumer((messageRaw) => {
			const message = JSON.parse(messageRaw.getContent());
			this.emit("service:message", message);
			messageRaw.ack();
		});

		await this.connection.completeConfiguration();
	}

	public async disconnect() {
		await this.connection.close();
	}

	public async queueResponse(message: ProxyResponse) {
		const stringed = JSON.stringify(message);
		await this.proxyExchange.send(new Amqp.Message(stringed));
	}
}
