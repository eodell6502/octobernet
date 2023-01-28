#!/usr/bin/env node

import { config as cfg } from "./config.mjs";
import MDBWrapper from "./mdbwrapper.mjs";
import Gadgetry from "gadgetry-api";
import * as api from "./api.mjs";

global.mdb = null;
global.cfg = cfg;

main();


//==============================================================================

async function main() {
    console.log("Starting OctoberNet...");

    //--------------------------------------------------------------------------

    console.log("Establishing database connection...");
    mdb = new MDBWrapper(cfg.db.host, cfg.db.user, cfg.db.password,
        cfg.db.database, cfg.db.port);
    var res = await mdb.connect();
    if(!res) {
        console.log("Unable to connect to database.");
        process.exit(1);
    }
    console.log("Database connection established.");

    //--------------------------------------------------------------------------

    // TODO: load remaining config from database

    //--------------------------------------------------------------------------

    console.log("Initializing API...");
    var $G = new Gadgetry(api, {
        maxFieldCount: 32,
        maxFieldSize:  12000000,
        maxFileCount:  64,
        maxFileSize:   12000000,
        port:          cfg.port,
    });


}
