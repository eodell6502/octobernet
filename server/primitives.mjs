import GQuery from "./node_modules/gadgetry-api/GQuery.mjs";
import { sha224 } from "js-sha256";
import nodemailer from "nodemailer";


//==============================================================================
// Common type conversion routine for configGet and configLoad.

function _configConvert(type, val) { // FN: _configConvert
    if(val === null)
        return null;
    switch(type) {
        case "integer":
            val = parseInt(val);
            break;
        case "float":
            val = parseFloat(val);
            break;
        case "boolean":
            val = val == "true" ? true : false;
        case "json":
            try {
                val = JSON.parse(val);
            } catch(e) {
                val = null;
            }
            break;
        default:
            break;
    }
    return val;
}



//==============================================================================
// Loads a single named value from the config table, applying the appropriate
// type conversion.

export async function configGet(name) { // FN: configGet
    var res = await mdb.exec("SELECT type, val FROM config WHERE name = ?", [name]);
    if(res.length)
        return _configConvert(res[0].type, res[0].val);
    else
        return undefined;
}


//==============================================================================
// Takes a list of config keys and returns an object with their values.

export async function configGetMulti(...keys) { // FN: configGetMulti
    var q = "SELECT name, type, val FROM config WHERE NAME IN (\"" +
        keys.join("\", \"") + "\")";
    var res = await mdb.exec(q);
    var result = { };

    for(var i = 0; i < res.length; i++)
        result[res[i].name] = _configConvert(res[i].type, res[i].val);

    return result;
}


//==============================================================================
// Loads the key-value pairs from the config table, applying type conversions
// as it goes.

export async function configLoad() { // FN: configLoad
    var res = await mdb.exec("SELECT * FROM config");
    var result = { };

    for(var i = 0; i < res.length; i++)
        result[res[i].name] = _configConvert(res[i].type, res[i].val);

    return result;
}


//==============================================================================
// Writes a config k/v pair to the database.

export async function configUpdate(name, value) { // FN: configUpdate
    if(typeof value == "object" && value !== null)
        value = JSON.parse(value);
    else if(typeof value == "number")
        value = value.toString();
    var q = "INSERT INTO config SET name = ?, val = ? "
        + "ON DUPLICATE KEY UPDATE val = ?";
    await mdb.exec(q, [name, value, value]);

    return;
}


//==============================================================================
// Returns the first row from table where field = value, or undefined if nothing
// was found. Obviously for cases where the field is a primary key candidate.

export async function getRecord(table, field, value) { // FN: getRecord
    var q = "SELECT * FROM `" + table + "` WHERE `" + field + "` = ?";
    try {
        var res = await mdb.firstRow(q, [value]);
        return res;
    } catch(e) {
        return undefined;
    }
}


//==============================================================================
// Inserts a record in the named table using the supplied args. Returns the new
// ID or undefined if an error occurred. Of course, this presumes an auto-
// increment primary key and that all required columns are provided in args.

export async function insertRecord(table, args) { // FN: insertRecord
    var qargs = [ ];
    var assignments = [ ];
    var q = "INSERT INTO `" + table + "` SET ";

    for(var k in args) {
        qargs.push(args[k]);
        assignments.push("`" + k + "` = ?");
    }
    q += assignments.join(", ");
    try {
        var res = await mdb.exec(q, qargs);
        return res.insertId;
    } catch(e) {
        return undefined;
    }
}


//==============================================================================
// Tests a password against the current password parameters.

export async function passwordIsValid(password) { // FN: passwordIsValid
    var p = await passwordParamsGet();

    if(password.length < p.pwdMinLength)
        return false;
    if(p.pwdHasLowercase && password.match(/[a-z]/) === null)
        return false;
    if(p.pwdHasUppercase && password.match(/[A-Z]/) === null)
        return false;
    if(p.pwdHasNumbers && password.match(/[0-9]/) === null)
        return false;
    if(p.pwdHasSpecialChars && password.match(/[^A-Za-z0-9]/) === null)
        return false;

    return true;
}


//==============================================================================
// Returns text describing the requirements for a password in a form ready to be
// displayed to an end-user.

export async function passwordParamsDescribe() { // FN: passwordParamsDescribe
    var params = await passwordParamsGet();
    var result = [ "Passwords must:<ul>" ];
    result.push("<li>Be at least " + params.pwdMinLength + " characters long.</li>");
    if(params.pwdHasLowercase)
        result.push("<li>Contain a lower case letter.</li>");
    if(params.pwdHasUppercase)
        result.push("<li>Contain an upper case letter.</li>");
    if(params.pwdHasNumbers)
        result.push("<li>Contain a number.</li>");
    if(params.pwdHasSpecialChars)
        result.push("<li>Contain punctuation or symbols.</li>");
    result.push("</ul>");

    return result.join("\n");
}



//==============================================================================
// Returns an object containing the password-specific configuration values.

export async function passwordParamsGet() { // FN: passwordParamsGet
    var q = "SELECT name, type, val FROM config "
        + "WHERE name IN ('pwdMinLength', 'pwdHasLowercase', 'pwdHasUppercase', "
        + "'pwdHasNumbers', 'pwdHasSpecialChars')";
    var res = await mdb.exec(q);
    var result = { };
    for(var i = 0; i < res.length; i++) {
        if(res[i].type == "boolean")
            result[res[i].name] = res[i].val == "true" ? true : false;
        else
            result[res[i].name] = res[i].val;
    }

    return result;
}


//==============================================================================
// Returns a random SHA-224 hash.

export function randomHash() { // FN: randomHash
    return sha224(process.hrtime.bigint().toString()
        + process.pid
        + process.hrtime.bigint().toString());
}


//==============================================================================
// Sends an HTML-only email.

export async function sendEmail(sender, recipient, subject, body) { // FN: sendEmail

    var transporter = nodemailer.createTransport({
        host:   cfg.email.host,
        port:   cfg.email.port,
        secure: cfg.email.secure,
        auth: {
            user: cfg.email.username,
            pass: cfg.email.password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var res = await transporter.sendMail({
        from:     sender,
        to:       recipient,
        subject:  subject,
        html:     body,
    });

    // console.log(res); // TODO: do something with the response
}


//==============================================================================
// Takes a user object returned by userLoad and updates the DB record of its
// session if it has been modified.

export async function sessionSave(user) { // FN: sessionSave
    if(user.session._dirty == false)
        return;
    delete user.session._dirty;
    var q = "UPDATE sessions SET session = ? WHERE userId = ?";
    var sessionJSON = JSON.stringify(user.session);
    await mdb.exec(q, [sessionJSON, user.id]);
    user.session._dirty = false;
    return;
}


//==============================================================================
// Updates the record with id = id in table using the column/value pairs in args.
// Returns the number of changed rows or undefined if an error occurred.

export async function updateRecordById(table, id, args) { // FN: updateRecordById
    var qargs = [ ];
    var assignments = [ ];

    for(var k in args) {
        qargs.push(args[k]);
        assignments.push("`" + k + "` = ?");
    }
    q = "UPDATE `" + table + "` SET "
        + assignments.join(", ")
        + "WHERE id = ?";
    qargs.push(id);

    try {
        await mdb.exec(q, qargs);
        return res.changedRows;
    } catch(e) {
        return undefined;
    }
}


//==============================================================================
// Updates the lastActive field for the specified user.

export async function userActivityUpdate(userId) { // FN: userActivityUpdate
    var q = "UPDATE users SET lastActive = NOW() WHERE id = ?";
    await mdb.exec(q, [userId]);
    return;
}


//==============================================================================
// Returns a boolean indicating whether the supplied user identifier --
// "username", "email", or "displayName" -- already exists. If a user ID is
// passed, that account will be ignored.

export async function userIdentifierExists(identifier, value, userId = 0) { // FN: userIdentifierExists
    if(["username", "email", "displayName"].indexOf(identifier) == -1)
        return false;
    var qargs = [ value ];
    var q = "SELECT COUNT(*) AS cnt FROM users WHERE " + identifier + " = ?";
    if(userId) {
        q += " AND id != ?";
        qargs.push(userId);
    }
    var cnt = await mdb.firstField(q, qargs)
    return cnt ? true : false;
}


//==============================================================================
// Loads a user and their session record based on the supplied loginToken. If no
// record matches the token, an error record is returned.

export async function userLoad(loginToken) { // FN: userLoad

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

    var sessionLifetime = await configGet("sessionLifetime");
    var q = "UPDATE users SET loginExpires = DATE_ADD(NOW(), INTERVAL ? MINUTE) "
        + "WHERE id = ?";
    await mdb.exec(q, [sessionLifetime, user.id]);

    var q = "UPDATE users SET lastActive = NOW() where id = ?";
    await mdb.exec(q, [user.id]);

    return user;
}


//==============================================================================
// Creates, stores, and returns a loginToken for the supplied user ID, using the
// configured sessionLifetime. Clears out any outstanding verification token at
// the same time.

export async function userLoginToken(userId) { // FN: userLoginToken
    var token = randomHash();
    var q = "UPDATE users SET loginToken = ?, "
        + "loginExpires = DATE_ADD(NOW(), INTERVAL ? MINUTE), "
        + "verificationToken = NULL, verificationExpires = NULL "
        + "WHERE id = ?";
    var sessionLifetime = await configGet("sessionLifetime");
    for(var i = 0; i < 5; i++) {
        var res = await mdb.exec(q, [token, sessionLifetime, userId]);
        if(res.changedRows)
            break;
    }
    return token;
}


//==============================================================================
// Given a loginToken, logs the associated user out.

export async function userLogout(token) { // FN: userLogout
    var q = "UPDATE users SET loginToken = NULL, loginExpires = NULL "
        + "WHERE loginToken = ?";
    await mdb.exec(q, [token]);
    return;
}


//==============================================================================
// Given a username, email, displayName, password, and userType, creates the
// user and returns its ID. If any of the identifiers already exist, -1 will be
// returned instead. It is assumed all inputs have already been validated.

export async function userNewCreate(username, email, password, displayName, userType) { // FN: userNewCreate
    var q = "INSERT INTO users SET username = ?, email = ?, password = ?, "
        + "type = ?, displayName = ?, created = NOW()";
    try {
        var res = await mdb.exec(q, [username, email, sha224(password), userType, displayName]);
    } catch(e) {
        return -1;
    }
    return res.insertId;
}


//==============================================================================
// Given a token, verifies the corresponding new user account, upgrading it from
// "noob" to "user" at the same time. Returns a boolean indicating success or
// failure.

export async function userNewVerify(token) { // FN: userNewVerify
    var q = "UPDATE users SET type = 'user', verificationToken = NULL, "
        + "verificationExpires = NULL WHERE verificationToken = ? "
        + "AND verificationExpires > NOW() "
        + "LIMIT 1";
    var res = await mdb.exec(q, [token]);
    return res.changedRows ? true : false;
}


//==============================================================================
// Takes a reset token and a password, and if valid, sets the user password.

export async function userPasswordReset(token, password) { // FN: userPasswordReset
    var hash = sha224(password);
    var q = "UPDATE users SET password = ?, resetToken = NULL, "
        + "resetExpires = NULL WHERE resetToken = ? "
        + "AND resetExpires > NOW() "
        + "LIMIT 1";
    var res = await mdb.exec(q, [hash, token]);
    return res.changedRows ? true : false;
}


//==============================================================================
// Generates a reset token for the supplied userId and updates the user
// record accordingly.

export async function userResetTokenCreate(userId) { // FN: userResetTokenCreate
    var token = randomHash();
    var q = "UPDATE users SET resetToken = ?, "
        + "resetExpires = DATE_ADD(NOW(), INTERVAL ? MINUTE) "
        + "WHERE id = ? LIMIT 1";
    var verificationLifetime = await configGet("verificationLifetime");
    await mdb.exec(q, [token, verificationLifetime, userId]);
    return token;
}

//==============================================================================
// Checks whether the user is suspended. If there is a suspension date, and it
// is in the past, it is removed. Returns true if the user can log in, false if
// they are still suspended, or undefined if the user is not found.

export async function userSuspensionCheck(userId) { // FN: userSuspensionCheck
    var q = "SELECT NOW() AS currentTime, suspendedUntil "
        + "FROM users WHERE id = ?";
    var res = await mdb.firstRow(q, [userId]);
    if(res === undefined)
        return undefined;
    if(res.currentTime > res.suspendedUntil) {
        q = "UPDATE users SET suspendedUntil = NULL WHERE id = ?";
        await mdb.exec(q, [userId]);
        return true;
    } else
        return false;
}


//==============================================================================
// Generates a verification token for the supplied userId and updates the user
// record accordingly.

export async function userVerificationTokenCreate(userId) { // FN: userVerificationTokenCreate
    var token = randomHash();
    var q = "UPDATE users SET verificationToken = ?, "
        + "verificationExpires = DATE_ADD(NOW(), INTERVAL ? MINUTE) "
        + "WHERE id = ? LIMIT 1";
    var verificationLifetime = await configGet("verificationLifetime");
    await mdb.exec(q, [token, verificationLifetime, userId]);
    return token;
}
