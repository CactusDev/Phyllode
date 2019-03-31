import "reflect-metadata";

import { Logger } from "cactus-stl";

import { Core } from "./core";
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";

import * as nconf from "config";
import { Config } from "./config";

import { RedisController } from "cactus-stl";
import { Injector } from "dependy";

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
        injects: Core,
        depends: [RedisController, RabbitHandler, Cereus]
    }
);

const core: Core = injector.get(Core);
core.start()
    .catch(err => Logger.error("Core", err));
