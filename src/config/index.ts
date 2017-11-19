
export class Config {

    public core: {
        api_url: string;
        cereus: {
            url: string;
            response_endpoint: string;
        };
    }

    public redis: {
        db: number;
        host: string;
        port: number;
        password: string;
    };

    public rabbitmq: {
        host: string;
        port: number;
        username: string;
        password: string;
        queues: {
            messages: string;
            events: string;
        }
    };
}
