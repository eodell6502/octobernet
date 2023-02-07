import { sha224 } from "js-sha256";
import * as $P from "./primitives.mjs";
import { prepArgs } from "./validator.mjs";


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
    var [args, user] = await prepArgs(args, { }, true);
    if(args._errcode)
        return args;
    return { loggedIn: true };
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

    var userId = await $P.userNewCreate(args.username, args.email, args.password,
        args.displayName, "noob");
    if(userId == -1)
        return { _errcode: "DUPUSER", _errmsg: "User already exists." };

    var token = await $P.userVerificationTokenCreate(userId);

    await $P.sendEmail(cfg.email.autoAddress, args.email, "New OctoberNet account",
        "<p>To verify and begin using your new OctoberNet account, "
        + "<a href=\"" + cfg.mainUrl + "?m=nu&vt=" + token + "\">click here</a>.</p>");

    return { status: "OK" };
}


//==============================================================================
// Called to reset a user's password.

export async function userResetProcess(args) { // FN: userResetProcess

    var [args, user] = await prepArgs(args, {
        verificationToken: { req: true,  type: "string", min: 1, max: 64 },
        password:          { req: true,  type: "string", min: 1, max: 64 },
    }, false);
    if(args._errcode)
        return args;

    var res = await $P.userPasswordReset(args.verificationToken, args.password);

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

    var token = await $P.userVerificationTokenCreate(res.id);

    await $P.sendEmail(cfg.email.autoAddress, args.email, "OctoberNet password reset request",
        "<p>To reset the password of your OctoberNet account, "
        + "<a href=\"" + cfg.mainUrl + "?m=pr&vt=" + token + "\">click here</a>.</p>");

    return { status: "OK" };
}


//==============================================================================
// Sends a username recovery email.

export async function userUsernameRecovery(args) { // FN: userUsernameRecovery
    var [args, user] = await prepArgs(args, {
        email:    { req: false,  type: "string", min: 1, max: 64, trim: true },
    }, false);

    var res = await $P.getRecord("users", "email", args.email);
    if(res)
        await $P.sendEmail(cfg.email.autoAddress, args.email, "OctoberNet username recovery",
            "<p>The username associated with this email address is "
            + res.username + ". "
            + "<a href=\"" + cfg.mainUrl + "\">Click here</a> to log in.</p>");

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


