import * as $P from "./primitives.mjs";


//==============================================================================

export async function prepArgs(args, spec, loginRequired = true) {
    var user = false;
    if(loginRequired) {
        if(args._loginToken === undefined)
            return [{ _errcode: "NOTLOGGEDIN", _errmsg: "User is not logged in." }, null];
        user = await $P.userLoad(args._loginToken);
        if(user._errcode)
            return [{ _errcode: "NOTLOGGEDIN", _errmsg: "User is not logged in." }, null];
    }
    var args = validate(args, spec);
    if(args._errcode)
        return [ args, null ];
   return [ args, user ];
}



//==============================================================================
// Receives args as an object, and spec, another object specifying how the args
// should be validated and/or modified. It follows the form:
//
//     {
//         argname: { req: true, type: "int", min: -128, max: 127 },
//     }
//

export function validate(rawArgs, spec) {
    var args = { };

    // Check to see that all required arguments are present.

    for(var k in spec)
        if(spec[k].req && rawArgs[k] === undefined)
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

            case "boolean":
                if(typeof args[k] != "boolean") {
                    if(args[k] == "true" || args[k] == 1)
                        args[k] = true;
                    else
                        args[k] = false;
                }
                break;

            case "integer":
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
                if(spec[k].trim)
                    args[k] = args[k].trim();
                if(spec[k].min !== undefined && args[k].length < spec[k].min)
                    return { _errcode: "BADARG", _errmsg: k + " must be at least " + spec[k].min + " characters long." };
                if(spec[k].max !== undefined && args[k].length > spec[k].max)
                    return { _errcode: "BADARG", _errmsg: k + " must be no more than " + spec[k].max + " characters long." };
                if(spec[k].legal !== undefined && spec[k].legal.indexOf(args[k]) == -1)
                    return { _errcode: "BADARG", _errmsg: k + " must be one of: \"" + spec[k].legal.join("\", \"") + "\"." };
                break;

            case "datetime":
                args[k] = args[k].toString().trim();
                if(args[k].match(/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9](:[0-9][0-9])?/) === null)
                    return { _errcode: "BADARG", _errmsg: k + " must follow the form `YYYY-MM-DD HH:MM(:SS)'." };
                break;
        }
    }
    return args;
}




