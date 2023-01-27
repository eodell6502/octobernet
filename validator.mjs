import * as $P from "./primitives.mjs";



//==============================================================================

async function prepArgs(args, spec, loginRequired = true) {
    var user = false;
    if(loginRequired) {
        if(args._loginToken === undefined)
            return { _errcode: "NOTLOGGEDIN", _errmsg: "User is not logged in." };
        user = loadUser(args._loginToken);
        if(user._errcode)
            return user;
    }
    var args = validate(args, spec);
    if(args._errcode)
        return args;
   return [ args, user ];
}




//==============================================================================

async function loadUser(loginToken) {
    var session = { };
    var q = "SELECT users.*, sessions.session "
        + "FROM users "
        + "LEFT JOIN sessions ON sessions.userId = users.id "
        + "WHERE loginToken = ? AND loginExpires > NOW()";
    var user = await mdb.firstRow(q, [loginToken]);
    if(user === undefined)
        return { _errcode: "NOTLOGGEDIN", _errmsg: "User is not logged in." };
    if(user.session === null) {
        user.session = { };
    } else {
        try {
            user.session = JSON.parse(user.session);
            user.session._dirty = false;
        } catch(e) {
            user.session = { };
        }   user.session._dirty = true;
    }

    var q = "UPDATE users SET loginExpires = DATE_ADD(NOW(), 'INTERVAL ? MINUTE') "
        + "WHERE id = ?";
    await mdb.exec(q, [cfg.sessionLength, user.id]);

    return user;
}



//==============================================================================
// Receives args as an object, and spec, another object specifying how the args
// should be validated and/or modified. It follows the form:
//
//     {
//         argname: { req: true, type: "int", min: -128, max: 127 },
//     }
//

function validate(rawArgs, spec) {
    var args = { };

    // Check to see that all required arguments are present.

    for(var k in spec)
        if(spec[k].req && rawArgs[g] === undefined)
            return { _errcode: "MISSINGARG", _errmsg: "The " + k + " argument is required." };

    for(var k in rawArgs) {

        // Silently skip any arguments that do not appear in the spec. The main
        // purpose of this is to filter out fuzzing tests by bad actors.

        if(spec[k] === undefined)
            continue;
        else
            args[k] = rawArgs[k];

        // Abort with an error if a null is received in a non-nullable argument.

        if(args[k] === null) {
            if(spec[k].nullable)
                continue;
            else
                return { _errcode: "BADARG", _errmsg: k + " must not be null." };
        }

        // Now, going by type, validate each remaining arguments. This may involve
        // type conversions, as when a numeric string is passed where a number is
        // expected.

        switch(spec[k].type) {

            case "int":
                args[k] == parseInt(args[k]);
                if(isNaN(args[k]))
                    return { _errcode: "BADARG", _errmsg: k + " must be an integer." };
                if(spec[k].min !== undefined && args[k] < spec[k].min)
                    return { _errcode: "BADARG", _errmsg: k + " must be at least " + spec[k].min + "." };
                if(spec[k].max !== undefined && args[k] > spec[k].max)
                    return { _errcode: "BADARG", _errmsg: k + " must be no more than " + spec[k].max + "." };
                break;

            case "uint":
                args[k] == parseInt(args[k]);
                if(isNaN(args[k]) || args[k] < 0)
                    return { _errcode: "BADARG", _errmsg: k + " must be an unsigned integer." };
                if(spec[k].min !== undefined && args[k] < spec[k].min)
                    return { _errcode: "BADARG", _errmsg: k + " must be at least " + spec[k].min + "." };
                if(spec[k].max !== undefined && args[k] > spec[k].max)
                    return { _errcode: "BADARG", _errmsg: k + " must be no more than " + spec[k].max + "." };
                break;

            case "float":
                args[k] == parseFloat(args[k]);
                if(isNaN(args[k]))
                    return { _errcode: "BADARG", _errmsg: k + " must be a float." };
                if(spec[k].min !== undefined && args[k] < spec[k].min)
                    return { _errcode: "BADARG", _errmsg: k + " must be at least " + spec[k].min + "." };
                if(spec[k].max !== undefined && args[k] > spec[k].max)
                    return { _errcode: "BADARG", _errmsg: k + " must be no more than " + spec[k].max + "." };
                break;

            case "string":
                args[k] = args[k].toString();
                if(spec[k].min !== undefined && args[k].length < spec[k].min)
                    return { _errcode: "BADARG", _errmsg: k + " must be at least " + spec[k].min + " characters long." };
                if(spec[k].max !== undefined && args[k].length > spec[k].max)
                    return { _errcode: "BADARG", _errmsg: k + " must be no more than " + spec[k].max + " characters long." };
                break;
        }
    }

}


export {
    inject,
    prepArgs,
    saveSession,
};

