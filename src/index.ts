import { Logger } from "./logger";
Logger.setup();

import "reflect-metadata";

import { ReflectiveInjector } from "@angular/core";
import { Core } from "./core";
import { ServiceHandler } from "./service";

import * as nconf from "config";
import { Config } from "./config";

import { RedisController } from "cactus-stl";

const injector = ReflectiveInjector.resolveAndCreate([
    {
        provide: Config,
        useValue: nconf
    },
    {
        provide: ServiceHandler,
        deps: [Config],
        useFactory: (config: Config) => {
            const serviceHandler = new ServiceHandler(config);
            return serviceHandler;
        }
    },
    {
        provide: RedisController,
        deps: [Config],
        useFactory: (config: Config) => {
            const redisController = new RedisController(config.core.redis);
            return redisController;
        }
    },
    Core
]);

const core: Core = injector.get(Core);
core.start()
    .catch(err => Logger.error("Core", err));
