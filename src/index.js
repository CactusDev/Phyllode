// import "reflect-metadata";
// import { ReflectiveInjector } from "@angular/core";
// import { Core } from "./core";
// import { ServiceHandler } from "./service";
// import * as nconf from "config";
// import { Config } from "./config";
// const injector = ReflectiveInjector.resolveAndCreate([
//     {
//         provide: Config,
//         useValue: nconf
//     },
//     {
//         provide: ServiceHandler,
//         deps: [Config],
//         useFactory: (config: Config) => {
//             const serviceHandler = new ServiceHandler(config);
//             return serviceHandler;
//         }
//     },
//     Core
// ]);
// const core: Core = injector.get(Core);
// core.start()
//     .catch(console.error);
var current = "";
var inVariable = false;
// let last = "text";
var packets = [];
var message = "!command add +testing This command has been run %COUNT% times!";
var _loop_1 = function (i) {
    var char = message[i];
    if (char === " ") {
        inVariable = false;
        current += " ";
    }
    else if (char === "%") {
        if (inVariable) {
            inVariable = false;
            var modifiers = [];
            var split = current.split("|");
            var ready_1 = [];
            if (split && split.length > 0) {
                var name_1 = split[0];
                delete split[0];
                ready_1.push(name_1);
                ready_1[1] = [];
                split.filter(function (e) { return e !== null; }).forEach(function (e) { return ready_1[1].push(e); });
            }
            else {
                ready_1 = [current, []];
            }
            var now = {
                type: "variable",
                data: ready_1
            };
            // last = now.type;
            packets.push(now);
            current = "";
        }
        else {
            inVariable = true;
            packets.push({
                type: "text",
                data: current
            });
            current = "";
        }
    }
    else {
        current += char;
        var now = {
            type: "text",
            data: current
        };
        if (i === message.length - 1) {
            packets.push(now);
        }
        // last = now.type;
    }
};
for (var i = 0; i < message.length; i++) {
    _loop_1(i);
}
console.log(JSON.stringify(packets));
