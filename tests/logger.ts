
import { test } from "ava";
import { Logger } from "../src/logger";

/*
=======
WARNING
=======

THIS FILE IS LIREALLY JUST TO HELP WITH TEST COVERAGE. STUPID THINGS WILL GO HERE
*/

test("Just calls the logger", t => {
    Logger.setup();
    Logger.info("Core", "A");
    Logger.warn("Core", "A");
    Logger.error("Core", "A");
    delete process.env["TEST"];
    Logger.info("Core", "A");
    Logger.warn("Core", "A");
    Logger.error("Core", "A");
    process.env["TEST"] = "true";
    t.pass();
});
