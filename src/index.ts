import "reflect-metadata";

import { Logger } from "cactus-stl";

import { Core } from "./core";
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";

import * as nconf from "config";
import { Config } from "./config";

import { RedisController } from "cactus-stl";
import { HandlerController } from "./handlers/handler";
import { HANDLERS } from "./handlers";

import { Injector } from "dependy";

let handlerInjection: any[] = [];
HANDLERS.forEach(async handler => handlerInjection.push({ injects: handler.target, depends: handler.depends }));

const injector = new Injector(
    {
        injects: Config,
        value: nconf
    },
    {
        injects: RedisController,
        depends: [Config],
        create: (config: Config) => {
            const redisController = new RedisController(config.redis);
            return redisController;
        }
    },
    {
        injects: RabbitHandler,
        depends: [Config]
    },
    {
        injects: Cereus,
        depends: [Config],
        create: (config: Config) => {
            return new Cereus(`${config.core.cereus.url}/${config.core.cereus.response_endpoint}`);
        }
    },
    {
        injects: HandlerController,
        depends: [RabbitHandler]
    },
    {
        injects: Core,
        depends: [RedisController, RabbitHandler, Cereus, HandlerController]
    },
    ...handlerInjection
);

injector.get(HandlerController).provideInjector(injector);

const core: Core = injector.get(Core);
core.start()
    .catch(err => Logger.error("Core", err));
