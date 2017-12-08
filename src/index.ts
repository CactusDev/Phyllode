import { Logger } from "cactus-stl";

import "reflect-metadata";

import { ReflectiveInjector } from "@angular/core";
import { Core } from "./core";
import { RabbitHandler } from "./rabbit";
import { Cereus } from "./cereus";

import * as nconf from "config";
import { Config } from "./config";

import { RedisController } from "cactus-stl";
import { HandlerController } from "./handlers/handler";
import { HANDLERS } from "./handlers";

// HACK: For some reason, if I put handlers into the main injector, they don't work.
// But, if I add them as a child, they work just fine.
const hackyFix = ReflectiveInjector.resolve(HANDLERS);
export const injector = ReflectiveInjector.resolveAndCreate([
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
    {
        provide: HandlerController,
        deps: [RabbitHandler],
        useFactory: (rabbit: RabbitHandler) => {
            return new HandlerController(rabbit);
        }
    },
    Core
]).createChildFromResolved(hackyFix);

injector.get(ReflectiveInjector).provideInjector(injector);

const core: Core = injector.get(Core);
core.start()
    .catch(err => Logger.error("Core", err));
