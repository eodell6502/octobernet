#!/usr/bin/env node

import { config as cfg } from "./config.mjs";
import MDBWrapper from "./mdbwrapper.mjs";
import minicle from "minicle";
import { sha224 } from "js-sha256";

var mdb;

main();


//==============================================================================

async function main() {

    minicle.outputHeader("@0E@Octopus@07@ -- @0B@CLI tool for Octoberon@07@", "pcdos2", "@0C@");

    var options = {
        commands: [ "help", "mkdb", "mktbl", "mkuser", "testdata" ],
        switches: {
            help: {

            },
            mkdb: {
                "drop-database": { short: "d", maxArgs: 0 },
            },
            mktbl: {

            },
            mkuser: {
                username:    { short: "u", maxArgs: 1 },
                email:       { short: "e", maxArgs: 1 },
                password:    { short: "p", maxArgs: 1 },
                type:        { short: "t", maxArgs: 1 },
                displayname: { short: "d", maxArgs: 1 },
            },
            testdata: {

            }
        }
    };

    var sw = minicle.parseCliArgs(process.argv.slice(2), options);
    if(sw.errcode)
        minicle.errmsg("fatal", sw.errmsg);

    if(sw.command != help) {
        mdb = new MDBWrapper(cfg.db.host, cfg.db.user, cfg.db.password,
            cfg.db.database, cfg.db.port);
        var res = await mdb.connect();
        if(!res) {
            minicle.errmsg("fatal", "Unable to connect to database");
            process.exit(1);
        }
        minicle.errmsg("info", "Database connection established.");
    }

    switch(sw.command) {
        case "help":
            await help(sw.switches);
            break;
        case "mkdb":
            await mkdb(sw.switches);
            break;
        case "mktbl":
            await mktbl(sw.switches);
            break;
        case "mkuser":
            await mkuser(sw.switches);
            break;
        case "testdata":
            await testdata(sw.switches);
            break;
        default:
            minicle.errmsg("fatal", "No command supplied.");
            break;
    }

    process.exit(0);
}


//==============================================================================

async function mkdb(switches) {

    minicle.errmsg("info", "Creating database \"" + cfg.db.database + "\"...");

    if(switches["drop-database"].cnt)
        await mdb.exec("DROP DATABASE `" + cfg.db.database + "`");
    await mdb.exec("CREATE DATABASE IF NOT EXISTS `" + cfg.db.database + "`");
    minicle.errmsg("info", "Database creation completed.");
    await mktbl();

}


//==============================================================================

async function mktbl(switches) {

    minicle.errmsg("info", "Creating tables...");
    await mdb.pool.query("USE `" + cfg.db.database + "`");

    await mdb.exec("DROP TABLE attachments");
    var q = "CREATE TABLE `attachments` ( "
        + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
        + "`messageId` int(10) unsigned NOT NULL, "
        + "`filename` varchar(128) NOT NULL DEFAULT '', "
        + "`size` int(10) unsigned NOT NULL DEFAULT 0, "
        + "`hash` varchar(64) DEFAULT NULL, "
        + "`localpath` varchar(256) DEFAULT NULL, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `hash` (`hash`), "
        + "KEY `messageId` (`messageId`), "
        + "KEY `filename` (`filename`) "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE config");
    var q = "CREATE TABLE `config` ( "
        + "`name` varchar(128) NOT NULL, "
        + "`type` varchar(16) NOT NULL DEFAULT 'integer', "
        + "`val` longtext DEFAULT NULL, "
        + "`sdesc` varchar(64) DEFAULT NULL, "
        + "`ldesc` text DEFAULT NULL, "
        + "`ui` text DEFAULT NULL, "
        + "PRIMARY KEY (`name`) USING BTREE "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE federations");
    var q = "CREATE TABLE `federations` ( "
        + "`id` int(11) NOT NULL AUTO_INCREMENT, "
        + "`name` varchar(64) NOT NULL, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `name` (`name`) "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE forums");
    var q = "CREATE TABLE `forums` ( "
        + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
        + "`guid` varchar(64) NOT NULL, "
        + "`federationId` int(10) unsigned DEFAULT NULL, "
        + "`name` varchar(64) NOT NULL, "
        + "`sdesc` varchar(64) NOT NULL, "
        + "`ldesc` varchar(256) NOT NULL, "
        + "`tos` text DEFAULT NULL, "
        + "`origin` varchar(64) DEFAULT NULL, "
        + "`parent` varchar(64) DEFAULT NULL, "
        + "`moderator` varchar(64) DEFAULT NULL, "
        + "`binariesAttached` tinyint(3) unsigned NOT NULL DEFAULT 0, "
        + "`binariesEmbedded` tinyint(3) unsigned NOT NULL DEFAULT 0, "
        + "`binaryTypes` text DEFAULT NULL, "
        + "`maxSize` int(10) unsigned NOT NULL DEFAULT 65536, "
        + "`commercial` enum('none','individual','corporate') NOT NULL DEFAULT 'none', "
        + "`admin` tinyint(3) unsigned NOT NULL DEFAULT 0, "
        + "`bodyType` set('html','text') NOT NULL DEFAULT 'html', "
        + "`advertise` tinyint(3) unsigned NOT NULL DEFAULT 0, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `guid` (`guid`), "
        + "KEY `name` (`name`), "
        + "KEY `origin` (`origin`), "
        + "KEY `parent` (`parent`), "
        + "KEY `moderator` (`moderator`) "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE hosts");
    var q = "CREATE TABLE `hosts` ( "
        + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
        + "`guid` varchar(64) DEFAULT NULL, "
        + "`sdesc` varchar(80) DEFAULT NULL, "
        + "`ldesc` text DEFAULT NULL, "
        + "`domain` varchar(128) DEFAULT NULL, "
        + "`publicUrl` varchar(256) DEFAULT NULL, "
        + "`apiUrl` varchar(256) DEFAULT NULL, "
        + "`sysopName` varchar(64) DEFAULT NULL, "
        + "`sysopEmail` varchar(64) DEFAULT NULL, "
        + "`publicKey` text DEFAULT NULL, "
        + "`utcOffset` float DEFAULT NULL, "
        + "`updated` datetime DEFAULT NULL, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `guid` (`guid`), "
        + "UNIQUE KEY `domain` (`domain`) "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE messages");
    var q = "CREATE TABLE `messages` ( "
        + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
        + "`guid` varchar(64) NOT NULL, "
        + "`fromUsername` varchar(64) NOT NULL, "
        + "`fromHost` varchar(64) NOT NULL, "
        + "`fromEmail` varchar(64) DEFAULT NULL, "
        + "`fromName` varchar(64) DEFAULT NULL, "
        + "`created` datetime NOT NULL, "
        + "`seen` datetime NOT NULL, "
        + "`utcOffset` float NOT NULL DEFAULT 0, "
        + "`forumId` int(10) unsigned NOT NULL DEFAULT 0, "
        + "`subject` varchar(128) NOT NULL DEFAULT '0', "
        + "`path` text NOT NULL, "
        + "`parent` varchar(64) DEFAULT '', "
        + "`expires` datetime DEFAULT NULL, "
        + "`approved` tinyint(4) DEFAULT NULL, "
        + "`hasAttachments` tinyint(4) NOT NULL DEFAULT 0, "
        + "`admin` tinyint(4) NOT NULL DEFAULT 0, "
        + "`processed` tinyint(4) NOT NULL DEFAULT 0, "
        + "`body` mediumtext NOT NULL, "
        + "`signature` text DEFAULT NULL, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `guid` (`guid`), "
        + "KEY `fromUsername` (`fromUsername`), "
        + "KEY `fromHost` (`fromHost`), "
        + "KEY `fromEmail` (`fromEmail`), "
        + "KEY `forumId` (`forumId`), "
        + "KEY `parent` (`parent`), "
        + "KEY `approved` (`approved`), "
        + "KEY `hasAttachments` (`hasAttachments`), "
        + "KEY `admin` (`admin`), "
        + "KEY `processed` (`processed`) "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE sessions");
    var q = "CREATE TABLE `sessions` ( "
        + "`userId` int(10) unsigned NOT NULL DEFAULT 0, "
        + "`session` longtext DEFAULT NULL, "
        + "PRIMARY KEY (`userId`) USING BTREE "
        + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE users");
    var q = "CREATE TABLE `users` ( "
        + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
        + "`username` varchar(64) NOT NULL, "
        + "`email` varchar(64) NOT NULL, "
        + "`password` varchar(64) NOT NULL, "
        + "`type` enum('noob','user','admin') NOT NULL DEFAULT 'noob', "
        + "`loginToken` varchar(64) DEFAULT NULL, "
        + "`loginExpires` datetime DEFAULT NULL, "
        + "`verificationToken` varchar(64) DEFAULT NULL, "
        + "`verificationExpires` datetime DEFAULT NULL, "
        + "`displayName` varchar(64) DEFAULT NULL, "
        + "`created` datetime DEFAULT NULL, "
        + "`deleted` datetime DEFAULT NULL, "
        + "`suspendedUntil` datetime DEFAULT NULL, "
        + "`lastActive` datetime DEFAULT NULL, "
        + "PRIMARY KEY (`id`), "
        + "UNIQUE KEY `username` (`username`), "
        + "UNIQUE KEY `email` (`email`), "
        + "UNIQUE KEY `verificationToken` (`verificationToken`), "
        + "UNIQUE KEY `loginToken` (`loginToken`), "
        + "UNIQUE KEY `displayName` (`displayName`) "
        + ") ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    await mdb.exec(q);

    var defaultConfig = {
        sessionLifetime:      { type: "integer", val: 60 * 24, sdesc: "Login session lifetime in minutes." },
        verificationLifetime: { type: "integer", val: 60 * 24, sdesc: "Verification token lifetime in minutes." },
        port:                 { type: "integer", val: 8080, sdesc: "Port for the Octoberon API." },
        mainUrl:              { type: "string",  val: "http://192.168.1.140/", sdesc: "URL of the login page." },
        maxFieldCount:        { type: "integer", val: 32, sdesc: "Maximum fields allowed in API call." },
        maxFieldSize:         { type: "integer", val: 128000000, sdesc: "Maximum size of an API field in bytes." },
        maxFileCount:         { type: "integer", val: 64, sdesc: "Maximum number of files per API call." },
        maxFileSize:          { type: "integer", val: 128000000, sdesc: "Maximum uploaded file size in bytes." },
        pwdMinLength:         { type: "integer", val: 8, sdesc: "Minimum length of passwords." },
        pwdHasLowercase:      { type: "boolean", val: "true", sdesc: "Require lowercase characters in passwords." },
        pwdHasUppercase:      { type: "boolean", val: "true", sdesc: "Require uppercase characters in passwords." },
        pwdHasNumbers:        { type: "boolean", val: "true", sdesc: "Require numbers in passwords." },
        pwdHasSpecialChars:   { type: "boolean", val: "true", sdesc: "Require non-alphanumeric characters in passwords." },
    };

    var q = "INSERT INTO `config` (`name`, `type`, `val`, `sdesc`) VALUES(?, ?, ?, ?)";
    for(var k in defaultConfig) {
        var dc = defaultConfig[k];
        await mdb.exec(q, [k, dc.type, dc.val, dc.sdesc]);
    }

    minicle.errmsg("info", "Table creation completed.");
}


//==============================================================================

async function mkuser(switches) {
    minicle.errmsg("info", "Creating new user...");

    if(!switches.username.cnt)
        minicle.errmsg("fatal", "A --username/-u must be supplied.");
    if(!switches.email.cnt)
        minicle.errmsg("fatal", "An --email/-e must be supplied");
    if(!switches.password.cnt)
        minicle.errmsg("fatal", "A --password/-p must be supplied");
    if(!switches.type.cnt)
        minicle.errmsg("fatal", "A --type/-t must be supplied");
    if(["noob", "user", "admin"].indexOf(switches.type.args[0]) == -1)
        minicle.errmsg("fatal", "Legal --type values are \"noob\", \"user\", \"admin\".");
    if(!switches.displayname.cnt)
        minicle.errmsg("fatal", "A --displayname/-d must be supplied");

    await mdb.pool.query("USE `" + cfg.db.database + "`");
    var q = "INSERT INTO users (username, email, password, type, displayName) "
        + "VALUES (?, ?, ?, ?, ?)";
    await mdb.exec(q, [switches.username.args[0], switches.email.args[0],
        sha224(switches.password.args[0]), switches.type.args[0],
        switches.displayname.args[0]]);

    minicle.errmsg("info", "User created.");

}


//==============================================================================

async function testdata(switches) {

    minicle.errmsg("info", "Creating test data...");
    await mdb.pool.query("USE `" + cfg.db.database + "`");

    var q = "INSERT INTO `users` (`id`, `username`, `email`, `password`, `type`, `loginToken`, `loginExpires`, `verificationToken`, `verificationExpires`, `displayName`, `created`, `deleted`, `suspendedUntil`, `lastActive`) VALUES "
        + "(1, 'joe_noob', 'joe_noob@kyrillia.com', '95c7fbca92ac5083afda62a564a3d014fc3b72c9140e3cb99ea6bf12', 'noob', NULL, '2023-02-01 19:41:02', NULL, NULL, 'Joe Noob', '2023-01-27 12:40:05', NULL, NULL, '2023-01-31 19:41:02'), "
        + "(2, 'joe_user', 'joe_user@kyrillia.com', '95c7fbca92ac5083afda62a564a3d014fc3b72c9140e3cb99ea6bf12', 'user', NULL, NULL, NULL, NULL, 'Joe User', '2023-01-27 12:57:49', NULL, NULL, '2023-02-04 16:50:05'), "
        + "(3, 'joe_admin', 'joe_admin@kyrillia.com', '95c7fbca92ac5083afda62a564a3d014fc3b72c9140e3cb99ea6bf12', 'admin', NULL, '2023-02-01 19:41:02', NULL, NULL, 'Joe Admin', '2023-01-27 12:58:43', NULL, NULL, '2023-01-31 19:41:02'), "
        + "(4, 'joe_deleted', 'joe_deleted@kyrillia.com', '95c7fbca92ac5083afda62a564a3d014fc3b72c9140e3cb99ea6bf12', 'user', NULL, NULL, NULL, NULL, 'Joe Deleted', '2023-01-27 12:59:40', '2023-01-27 12:59:41', NULL, NULL), "
        + "(5, 'joe_suspended', 'joe_suspended@kyrillia.com', '95c7fbca92ac5083afda62a564a3d014fc3b72c9140e3cb99ea6bf12', 'user', NULL, NULL, NULL, NULL, 'Joe Suspended', '2023-01-27 13:00:31', NULL, '2024-01-27 13:00:34', NULL)";
    await mdb.exec(q);

    minicle.errmsg("info", "Test data creation completed.");
}


//==============================================================================

async function help(switches) {
    console.log(
`Usage: octopus [command] [switches...]

    help ..... show this text
    mkdb ..... create database
               --drop-database ... drop pre-existing database and start over
    mktbl ..... create tables in pre-existing database
    mkuser .... create user
`);
}



