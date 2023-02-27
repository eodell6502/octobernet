#!/usr/bin/env node

import { config as cfg } from "./config.mjs";
import MDBWrapper from "./mdbwrapper.mjs";
import minicle from "minicle";
import { sha224 } from "js-sha256";
import testdata from "./testdata.mjs";

global.mdb = null;

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
            await testdataProcess(sw.switches);
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
       + "`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, "
       + "`guid` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci', "
       + "`federationId` INT(10) UNSIGNED NULL DEFAULT NULL, "
       + "`name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci', "
       + "`sdesc` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci', "
       + "`ldesc` VARCHAR(1024) NOT NULL COLLATE 'utf8mb4_general_ci', "
       + "`tos` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', "
       + "`origin` VARCHAR(64) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', "
       + "`parent` VARCHAR(64) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', "
       + "`moderator` VARCHAR(64) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', "
       + "`bodyType` SET('html','text','markdown','json') NOT NULL DEFAULT 'html' COLLATE 'utf8mb4_general_ci', "
       + "`maxSize` INT(10) UNSIGNED NOT NULL DEFAULT '65536', "
       + "`binariesAttached` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0', "
       + "`binariesEmbedded` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0', "
       + "`binaryTypes` TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci', "
       + "`commercial` ENUM('none','individual','corporate') NOT NULL DEFAULT 'none' COLLATE 'utf8mb4_general_ci', "
       + "`admin` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0', "
       + "`advertise` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0', "
       + "`scripts` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0', "
       + "PRIMARY KEY (`id`) USING BTREE, "
       + "UNIQUE INDEX `guid` (`guid`) USING BTREE, "
       + "INDEX `name` (`name`) USING BTREE, "
       + "INDEX `origin` (`origin`) USING BTREE, "
       + "INDEX `parent` (`parent`) USING BTREE, "
       + "INDEX `moderator` (`moderator`) USING BTREE "
       + ") "
       + "COLLATE='utf8mb4_general_ci' "
       + "ENGINE=InnoDB "
       + ";";
    await mdb.exec(q);

    await mdb.exec("DROP TABLE hosts");
        var q = "CREATE TABLE IF NOT EXISTS `hosts` ( "
            + "`id` int(10) unsigned NOT NULL AUTO_INCREMENT, "
            + "`guid` varchar(64) DEFAULT NULL, "
            + "`name` varchar(64) DEFAULT NULL, "
            + "`sdesc` varchar(80) DEFAULT NULL, "
            + "`ldesc` varchar(1024) DEFAULT NULL, "
            + "`publicUrl` varchar(256) DEFAULT NULL, "
            + "`apiUrl` varchar(256) DEFAULT NULL, "
            + "`sysopName` varchar(64) DEFAULT NULL, "
            + "`sysopEmail` varchar(64) DEFAULT NULL, "
            + "`publicKey` text DEFAULT NULL, "
            + "`utcOffset` INT(10) DEFAULT NULL, "
            + "`updated` datetime DEFAULT NULL, "
            + "PRIMARY KEY (`id`), "
            + "UNIQUE KEY `guid` (`guid`), "
            + "KEY `name` (`name`) "
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
        + "`type` enum('noob','user','sysop') NOT NULL DEFAULT 'noob', "
        + "`loginToken` varchar(64) DEFAULT NULL, "
        + "`loginExpires` datetime DEFAULT NULL, "
        + "`verificationToken` varchar(64) DEFAULT NULL, "
        + "`verificationExpires` datetime DEFAULT NULL, "
        + "`resetToken` varchar(64) DEFAULT NULL, "
        + "`resetExpires` datetime DEFAULT NULL, "
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
        bbsName:              { type: "string",  val: "Your BBS Name", sdesc: "The name of your BBS." },
        bbsGuid:              { type: "string",  val: "...", sdesc: "A unique identifier for your BBS." },
        bbsSdesc:             { type: "string",  val: "A very short description.", sdesc: "Up to 80 characters." },
        bbsLdesc:             { type: "string",  val: "An arbitrarily long description.", sdesc: "TODO: What's the max length?" },
        bbsPublicUrl:         { type: "string",  val: "https://somedomain.net/bbs", sdesc: "The URL of your login page." },
        bbsApiUrl:            { type: "string",  val: "https://somedomain.net/api", sdesc: "The URL of your API." },
        bbsPrivateKey:        { type: "string",  val: "...", sdesc: "..." },
        bbsPublicKey:         { type: "string",  val: "...", sdesc: "..." },
        bbsUtcOffset:         { type: "integer", val: -6, sdesc: "Your offset from UTC." }, // TODO: timezone dropdown?
        sysopName:            { type: "string",  val: "Jane Doe", sdesc: "Your name (or pseudonym)." },
        sysopEmail:           { type: "string",  val: "jdoe@somedomain.net", sdesc: "Your email address." },
        emailAutoAddress:     { type: "string", val: "sysop@mydomain.com", sdesc: "Origin address for auto email." },
        emailHost:            { type: "string", val: "mail.mydomain.com", sdesc: "Domain name or address of email server." },
        emailPort:            { type: "integer", val: 465, sdesc: "Port for email server." },
        emailSecure:          { type: "boolean", val: "true", sdesc: "TODO: check Nodemailer docs." },
        emailUsername:        { type: "string", val: "mailsysop", sdesc: "Username for email account." },
        emailPassword:        { type: "string", val: "secret", sdesc: "Password for email account." },
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

async function testdataProcess(switches) {

    minicle.errmsg("info", "Creating test data...");
    await mdb.pool.query("USE `" + cfg.db.database + "`");

    for(var i = 0; i < testdata.length; i++)
        await mdb.exec(testdata[i]);

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


