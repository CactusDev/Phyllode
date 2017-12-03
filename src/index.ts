import { Logger } from "./logger";
Logger.setup();

import "reflect-metadata";

import { ReflectiveInjector } from "@angular/core";
import { Core } from "./core";
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";

import * as nconf from "config";
import { Config } from "./config";

import { RedisController } from "cactus-stl";
import { HandlerController } from "./handlers/handler";
import { EventHandler } from "./handlers";

const injector = ReflectiveInjector.resolveAndCreate([
    {
        provide: Config,
        useValue: nconf
    },
    {
        provide: RedisController,
        deps: [Config],
        useFactory: (config: Config) => {
            const redisController = new RedisController(config.redis);
            return redisController;
        }
    },
    {
        provide: RabbitHandler,
        deps: [Config],
        useFactory: (config: Config) => {
            const rabbit = new RabbitHandler(config);
            return rabbit;
        }
    },
    {
        provide: Cereus,
        deps: [Config],
        useFactory: (config: Config) => {
            return new Cereus(`${config.core.cereus.url}/${config.core.cereus.response_endpoint}`);
        }
    },
    Core
]);

const rabbit: RabbitHandler = injector.get(RabbitHandler);
const controller = new HandlerController(rabbit);

// const core: Core = injector.get(Core);
// core.start()
//     .catch(err => Logger.error("Core", err));
