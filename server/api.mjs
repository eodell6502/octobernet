import { sha224 } from "js-sha256";
import * as $P from "./primitives.mjs";
import { prepArgs } from "./validator.mjs";


//==============================================================================
// Loads the config values as an object.

export async function configLoad(args) { // FN: configLoad
    var [args, user] = await prepArgs(args, {
    }, "sysop");
    if(args._errcode)
        return args;
    var config = await $P.configLoad();
    return { config: config };
}


//==============================================================================
// Sets the config values.

export async function configSave(args) { // FN: configSave
    var [args, user] = await prepArgs(args, {
        bbsApiUrl:            { req: true, type: "string", min: 0, max: 128, trim: true },
        bbsGuid:              { req: true, type: "string", min: 1, max: 64, trim: true },
        bbsLdesc:             { req: true, type: "string", min: 0, max: 1024, trim: true },
        bbsName:              { req: true, type: "string", min: 1, max: 64, trim: true },
        bbsPrivateKey:        { req: true, type: "string", min: 1, max: 8192, trim: true },
        bbsPublicKey:         { req: true, type: "string", min: 1, max: 8192, trim: true },
        bbsPublicUrl:         { req: true, type: "string", min: 0, max: 256, trim: true },
        bbsSdesc:             { req: true, type: "string", min: 1, max: 80, trim: true },
        bbsUtcOffset:         { req: true, type: "int", min: -12, max: 12 },
        emailAutoAddress:     { req: true, type: "string", min: 1, max: 64, trim: true },
        emailHost:            { req: true, type: "string", min: 1, max: 64, trim: true },
        emailPassword:        { req: true, type: "string", min: 1, max: 64, trim: true },
        emailPort:            { req: true, type: "uint", min: 0, max: 65535 },
        emailSecure:          { req: true, type: "boolean" },
        emailUsername:        { req: true, type: "string", min: 1, max: 64, trim: true },
        mainUrl:              { req: true, type: "string",  min: 0, max: 256, trim: true },
        maxFieldCount:        { req: true, type: "uint", min: 1, max: Infinity },
        maxFieldSize:         { req: true, type: "uint", min: 1, max: Infinity },
        maxFileCount:         { req: true, type: "uint", min: 1, max: Infinity },
        maxFileSize:          { req: true, type: "uint", min: 1, max: Infinity },
        maxMessageAge:        { req: true, type: "uint", min: 1, max: Infinity },
        maxMessagebaseSize:   { req: true, type: "uint", min: 1, max: Infinity },
        port:                 { req: true, type: "uint", min: 0, max: 65535 },
        pwdHasLowercase:      { req: true, type: "boolean" },
        pwdHasNumbers:        { req: true, type: "boolean" },
        pwdHasSpecialChars:   { req: true, type: "boolean" },
        pwdHasUppercase:      { req: true, type: "boolean" },
        pwdMinLength:         { req: true, type: "uint", min: 1, max: 64 },
        sessionLifetime:      { req: true, type: "uint", min: 1, max: Infinity },
        sysopEmail:           { req: true, type: "string", min: 1, max: 64, trim: true },
        sysopName:            { req: true, type: "string", min: 1, max: 64, trim: true },
        verificationLifetime: { req: true, type: "uint", min: 1, max: Infinity },
    }, "sysop");
    if(args._errcode)
        return args;

    // TODO: considerably more validation.
    // TODO: bulk configUpdate variant

    for(var k in args)
        await $P.configUpdate(k, args[k]);

    return { status: "OK" };
}


//==============================================================================
// Retrieves a list of federations.

export async function federationsGet(args) { // FN: federationsGet
    var [args, user] = await prepArgs(args, {
    }, "user");
    if(args._errcode)
        return args;

    var federations = await $P.federationsGet();

    return { federations: federations };
}


//==============================================================================
// Deletes the specified forum. In the future, it will delete all associated
// records as well.

export async function forumDelete(args) { // FN: forumDelete
    var [args, user] = await prepArgs(args, {
        forumId: { req: true, type: "uint", min: 1, max: Infinity },
    }, "sysop");
    if(args._errcode)
        return args;

    await $P.forumDelete(args.forumId);

    return { status: "OK" };
}


//==============================================================================
// Retrieves a list of forums to display in the forum editor.

export async function forumsGet(args) { // FN: forumsGet
    var [args, user] = await prepArgs(args, {
    }, "user");
    if(args._errcode)
        return args;

    var forums = await $P.forumsGet();

    return { forums: forums };
}


//==============================================================================
// Retrieves an individual forum record for editing in the forum editor.

export async function forumGet(args) { // FN: forumGet
    var [args, user] = await prepArgs(args, {
        forumId: { req: true, type: "uint", min: 1, max: Infinity },
    }, "sysop");
    if(args._errcode)
        return args;

    var forum = await $P.getRecord("forums", "id", args.forumId);
    if(forum === undefined)
        return { _errcode: "NOTFOUND", _errmsg: "Forum not found." };

    return { forum: forum };
}


//==============================================================================

export async function forumUpsert(args) { // FN: forumUpsert
    var [args, user] = await prepArgs(args, {
        id:                 { req: true, type: "uint",   min: 0, max: Infinity },
        guid:               { req: true, type: "string", min: 1, max: 64, trim: true },
        federationId:       { req: true, type: "uint",   min: 1, max: Infinity, nullable: true },
        name:               { req: true, type: "string", min: 1, max: 64, trim: true },
        sdesc:              { req: true, type: "string", min: 1, max: 64, trim: true },
        ldesc:              { req: true, type: "string", min: 1, max: 1024, trim: true },
        tos:                { req: true, type: "string", min: 1, max: 65535, trim: true, nullable: true },
        origin:             { req: true, type: "string", min: 1, max: 64, trim: true, nullable: true },
        parent:             { req: true, type: "string", min: 1, max: 64, trim: true, nullable: true },
        moderator:          { req: true, type: "string", min: 1, max: 64, trim: true, nullable: true },
        bodyType:           { req: true, type: "string", min: 1, max: 64, trim: true, nullable: true },
        maxMessageSize:     { req: true, type: "uint",   min: 0, max: Infinity },
        maxMessageAge:      { req: true, type: "uint",   min: 0, max: Infinity },
        maxMessagebaseSize: { req: true, type: "uint",   min: 0, max: Infinity },
        binariesAttached:   { req: true, type: "uint",   min: 0, max: 1 },
        binariesEmbedded:   { req: true, type: "uint",   min: 0, max: 1 },
        binaryTypes:        { req: true, type: "string", trim: true },
        commercial:         { req: true, type: "string", legal: ["none", "individual", "corporate" ] },
        admin:              { req: true, type: "uint",   min: 0, max: 1 },
        advertise:          { req: true, type: "uint",   min: 0, max: 1 },
        scripts:            { req: true, type: "uint",   min: 0, max: 1 },
        newForum:           { req: true, type: "uint",   min: 0, max: 1 },
    }, "sysop");
    if(args._errcode)
        return args;

    if(args.newForum) {
        args.id = 0;
        delete args.newForum;
    }

    if(await $P.forumIdentifierExists("guid", args.guid, args.id))
        return { _errcode: "DUPGUID", _errmsg: "GUID \"" + args.guid + "\" is already in use." };

    if(args.federationId !== null && await $P.federationExists(args.federationId) === false)
        return { _errcode: "BADFEDID", _errmsg: "The supplied federation ID is not valid." };

    if(args.id == 0) { // new forum
        var forumId = await $P.forumNewCreate(args);
        if(forumId === undefined)
            return { _errcode: "SYSERR", _errmsg: "A database error has occurred." };
        return { forumId: forumId };
    } else {           // existing forum
        var res = await $P.forumUpdate(args);
        if(res === undefined)
            return { _errcode: "SYSERR", _errmsg: "A database error has occurred." };
        return { status: "OK" };
    }

}


//==============================================================================
// Returns a random SHA-224 hash.

export async function guidGet() { // FN: guidGet
     return { guid: $P.randomHash() };
}



//==============================================================================
// Retrieves the full details of a host.

export async function hostGet(args) { // FN: hostGet
    var [args, user] = await prepArgs(args, {
        hostId: { req: true, type: "uint", min: 1, max: Infinity },
    }, "user");
    if(args._errcode)
        return args;

    var host = await $P.getRecord("hosts", "id", args.hostId);
    if(host === undefined)
        return { _errcode: "NOTFOUND", _errmsg: "Host not found." };

    return { host: host };
}


//==============================================================================
// Retrieves a list of hosts to display in the hosts viewer.

export async function hostsGet(args) { // FN: hostsGet
    var [args, user] = await prepArgs(args, {
    }, "user");
    if(args._errcode)
        return args;

    var hosts = await $P.hostsGet(["id", "name", "sdesc", "updated"], "name");

    return { hosts: hosts };
}


//==============================================================================
// Marks the specified user deleted.

export async function userDelete(args) { // FN: userDelete
    var [args, user] = await prepArgs(args, {
        userId: { req: true, type: "uint", min: 1, max: Infinity },
    }, "sysop");
    if(args._errcode)
        return args;

    if(args.userId == user.id)
        return { _errcode: "SELFHARM", _errmsg: "You cannot delete yourself." };

    await $P.userDelete(args.userId);

    return { status: "OK" };
}


//==============================================================================
// Retrieves a single user record for display in the user editor.

export async function userGet(args) { // FN: userGet
    var [args, user] = await prepArgs(args, {
        userId: { req: true, type: "uint", min: 1, max: Infinity },
    }, "sysop");
    if(args._errcode)
        return args;

    var user = await $P.getRecord("users", "id", args.userId);
    if(user === undefined)
        return { _errcode: "NOTFOUND", _errmsg: "User not found." };

    return { user: user };
}


//==============================================================================
// Given an identifier and its value, deterimines whether it already exists in
// the database. If userId is supplied, it will be excluded from consideration.

export async function userIdentifierExists(args) { // FN: userExists
    var [args, user] = await prepArgs(args, {
        identifier: { req: true,  type: "string", legal: [ "username", "email", "displayName"], trim: true },
        value:      { req: true,  type: "string", min: 1, max: 64 },
        userId:     { req: false, type: "uint",   min: 1, max: Infinity },
    }, false);
    if(args._errcode)
        return args;

    if(args.userId === undefined)
        args.userId = 0;

    var res = await $P.userIdentifierExists(args.identifier, args.value, args.userId);
    return { exists: res };
}


//==============================================================================

export async function userLogin(args) { // FN: userLogin
    var [args, user] = await prepArgs(args, {
        username: { req: true, type: "string", min: 1, max: 64, trim: true },
        password: { req: true, type: "string", min: 1, max: 64 },
    }, false);
    if(args._errcode)
        return args;

    user = await $P.getRecord("users", "username", args.username);
    if(user === undefined)
        return { _errcode: "BADLOGIN" };
    if(user.banned)
        return { _errcode: "BANNED" };
    var res = await $P.userSuspensionCheck(user.id);
    if(!res)
        return { _errcode: "SUSPENDED", until: user.suspendedUntil };
    else
        user.supendedUntil = null;
    if(sha224(args.password) == user.password) {
        await $P.userActivityUpdate(user.id);
        user.loginToken = await $P.userLoginToken(user.id);
        return {
            id:          user.id,
            username:    user.username,
            email:       user.email,
            type:        user.type,
            loginToken:  user.loginToken,
            displayName: user.displayName,
        }
    } else
        return { _errcode: "BADLOGIN" };
}


//==============================================================================
// Tests whether the current user is logged in, i.e., has a valid login token.

export async function userLoginCheck(args) { // FN: userLoginCheck
    var [args, user] = await prepArgs(args, { }, false);
    if(args._errcode)
        return args;
    return { type: user.type };
}


//==============================================================================

export async function userLogout(args) { // FN: userLogout
    if(args._loginToken) {
        await $P.userLogout(args._loginToken);
        return { status: "OK" };
    } else {
        return { _errcode: "MISSINGARG", errmsg: "_loginToken must be supplied." };
    }
}


//==============================================================================
// Creates a new noob user and sends the verification email.

export async function userNoobCreate(args) { // FN: userNoobCreate
    var [args, user] = await prepArgs(args, {
        username:    { req: true,  type: "string", min: 1, max: 64, trim: true },
        email:       { req: true,  type: "string", min: 1, max: 64, trim: true },
        password:    { req: true,  type: "string", min: 1, max: 64 },
        displayName: { req: true,  type: "string", min: 1, max: 64, trim: true },
    }, false);
    if(args._errcode)
        return args;

    var res = await $P.userIdentifierExists("username", args.username);
    if(res)
        return { _errcode: "DUPUSERNAME", _errmsg: "Username \"" + args.username + "\" is already taken." }

    var res = await $P.userIdentifierExists("email", args.email);
    if(res)
        return { _errcode: "DUPEMAIL", _errmsg: "Email \"" + args.email + "\" is already taken." }

    var res = await $P.userIdentifierExists("displayName", args.displayName);
    if(res)
        return { _errcode: "DUPDISPLAYNAME", _errmsg: "Display name \"" + args.displayName + "\" is already taken." }

    var valid = await $P.passwordIsValid(args.password);
    if(!valid) {
        var errmsg = await $P.passwordParamsDescribe();
        return { _errcode: "BADPASSWORD", _errmsg: errmsg };
    }

    var userId = await $P.userNewCreate(args.username, args.email, args.password,
        args.displayName, "noob");
    if(userId == -1)
        return { _errcode: "DUPUSER", _errmsg: "User already exists." };

    var token = await $P.userVerificationTokenCreate(userId);
    var k = await $P.configGetMulti("mainUrl", "bbsName", "emailAutoAddress");
    await $P.sendEmail(k.emailAutoAddress, args.email, "New " + k.bbsName + " account",
        "<p>To verify and begin using your new " + k.bbsName + " account, "
        + "<a href=\"" + k.mainUrl + "?m=nu&vt=" + token + "\">click here</a>.</p>");

    return { status: "OK" };
}


//==============================================================================
// Called to reset a user's password.

export async function userResetProcess(args) { // FN: userResetProcess
console.log(args);
    var [args, user] = await prepArgs(args, {
        resetToken: { req: true,  type: "string", min: 1, max: 64 },
        password:   { req: true,  type: "string", min: 1, max: 64 },
    }, false);
    if(args._errcode)
        return args;

    var valid = await $P.passwordIsValid(args.password);
    if(!valid) {
        var errmsg = await $P.passwordParamsDescribe();
        return { _errcode: "BADPASSWORD", _errmsg: errmsg };
    }

    var res = await $P.userPasswordReset(args.resetToken, args.password);

    return { status: res ? "OK" : "FAILED" };
}


//==============================================================================
// Given either a username or an email, sets a verification token for a password
// reset request and sends an email with a reset link.

export async function userResetRequest(args) { // FN: userResetRequest
    var [args, user] = await prepArgs(args, {
        username: { req: false,  type: "string", min: 1, max: 64, trim: true },
        email:    { req: false,  type: "string", min: 1, max: 64, trim: true },
    }, false);
    if(args._errcode)
        return args;

    if(!args.username && !args.email)
        return { _errcode: "MISSINGARG", _errmsg: "Either username or email is required." }

    var res;
    if(args.username)
        res = await $P.getRecord("users", "username", args.username);
    else
        res = await $P.getRecord("users", "email", args.email);
    if(res === undefined)
        return { status: "OK" }

    var token = await $P.userResetTokenCreate(res.id);
    var k = await $P.configGetMulti("mainUrl", "bbsName");
    await $P.sendEmail(cfg.email.autoAddress, args.email, k.bbsName + " password reset request",
        "<p>To reset the password of your " + k.bbsName + " account, "
        + "<a href=\"" + k.mainUrl + "?m=pr&rt=" + token + "\">click here</a>.</p>");

    return { status: "OK" };
}


//==============================================================================
// Retrieves users for display in the sysop module.

export async function usersGet(args) { // FN: usersGet
    var [args, user] = await prepArgs(args, {
        type: { req: false,  type: "string", legal: ["noob", "user", "sysop"] },
    }, true);

    if(args._errcode)
        return args;

    if(user.type != "sysop")
        return { _errcode: "UNAUTHORIZED", _errmsg: "Current user is not authorized to perform this action." };

    var users = await $P.usersGet(args.type === undefined ? false : args.type);
    return { users: users };
}


//==============================================================================
// Updates the user record with the corresponding id or, if id == 0 or newUser
// is true, creates a new user.

export async function userUpsert(args) { // FN: userUpsert
    var [args, user] = await prepArgs(args, {
        id:             { req: true,  type: "uint",   min: 0, max: Infinity },
        username:       { req: true,  type: "string", min: 1, max: 64, trim: true },
        displayName:    { req: true,  type: "string", min: 1, max: 64, trim: true },
        email:          { req: true,  type: "string", min: 1, max: 64, trim: true },
        password:       { req: true,  type: "string", min: 1, max: 64, nullable: true },
        type:           { req: true,  type: "string", legal: ["noob", "user", "sysop"] },
        suspendedUntil: { req: true,  type: "datetime", nullable: true },
        newUser:        { req: false, type: "boolean" },
    }, "sysop");
    if(args._errcode)
        return args;

    if(args.newUser) {
        args.id = 0;
        delete args.newUser;
    }


    // Check for collisions on username, displayName, and email. If id, exclude id.

    if(await $P.userIdentifierExists("username", args.username, args.id))
        return { _errcode: "DUPUSERNAME", _errmsg: "Username \"" + args.username + "\" is already in use." };
    if(await $P.userIdentifierExists("displayName", args.displayName, args.id))
        return { _errcode: "DUPDISPLAYNAME", _errmsg: "Display name \"" + args.displayName + "\" is already in use." };
    if(await $P.userIdentifierExists("email", args.email, args.id))
        return { _errcode: "DUPEMAIL", _errmsg: "Email \"" + args.email + "\" is already in use." };

    // validate password rules

    if(args.password !== null && !await $P.passwordIsValid(args.password)) {
        var errmsg = await $P.passwordParamsDescribe();
        return { _errcode: "BADPASSWORD", _errmsg: errmsg };
    }

    // Insert or update as needed

    if(args.id == 0) { // new user
        if(args.password === null)
            return { _errcode: "BADPASSWORD", _errmsg: "Password must be specified." };
        var userId = await $P.userNewCreate(args.username, args.email, sha224(args.password),
            args.displayName, args.type);
        if(userId == -1)
            return { _errcode: "DUPUSER", _errmsg: "User already exists." };
        else
            return { userId: userId};
    } else {           // existing user
        var userId = args.id;
        delete args.id;
        if(args.password === null) {
            delete args.password;
        } else {
            args.password = sha224(args.password);
        }
        var changed = await $P.updateRecordById("users", userId, args);
        if(changed === undefined)
            return { _errcode: "SYSERR", _errmsg: "Operation failed." };
        else
            return { changed: changed };
    }


}


//==============================================================================
// Sends a username recovery email.

export async function userUsernameRecovery(args) { // FN: userUsernameRecovery
    var [args, user] = await prepArgs(args, {
        email:    { req: false,  type: "string", min: 1, max: 64, trim: true },
    }, false);

    var res = await $P.getRecord("users", "email", args.email);
    if(res) {
        var k = await $P.configGetMulti("mainUrl", "bbsName", "emailAutoAddress");
        await $P.sendEmail(k.emailAutoAddress, args.email, k.bbName + " username recovery",
            "<p>The username associated with this email address is "
            + res.username + ". "
            + "<a href=\"" + k.mainUrl + "\">Click here</a> to log in.</p>");
    }

    return { status: "OK" }
}


//==============================================================================
// Given a verification token, attempts to verify the associated noob.

export async function userVerify(args) { // FN: userVerify
    var [args, user] = await prepArgs(args, {
        verificationToken: { req: true,  type: "string", min: 1, max: 64 },
    }, false);
    if(args._errcode)
        return args;

    var res = await $P.userNewVerify(args.verificationToken);
    if(!res)
        return { _errcode: "NOTFOUND", _errmsg: "Verification token not found." };
    else
        return { status: "OK" };
}


