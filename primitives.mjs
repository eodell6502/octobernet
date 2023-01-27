import GQuery from "./node_modules/gadgetry-api/GQuery.mjs";
import { sha224 } from "js-sha256";

//==============================================================================

export function randomHash() {
    return sha224(process.hrtime.bigint().toString()
        + process.pid
        + process.hrtime.bigint().toString());
}


//==============================================================================
// Returns the first row from table where field = value, or undefined if nothing
// was found. Obviously for cases where the field is a primary key candidate.

export async function getRecord(table, field, value) {
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

export async function insertRecord(table, args) {
    var qargs = [ ];
    var assignments = [ ];
    var q = "INSERT INTO `" + table + "` SET ";

    for(var k in args) {
        qargs.push(args[k]);
        assignments.push("`" + k + "` = ?");
    }
    q += assignments.join(", ");
    try {
        await mdb.exec(q, qargs);
        return mdb.insertId;
    } catch(e) {
        return undefined;
    }
}


//==============================================================================
// Updates the record with id = id in table using the column/value pairs in args.
// Returns the number of changed rows or undefined if an error occurred.

export async function updateRecordById(table, id, args) {
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
        return mdb.changedRows;
    } catch(e) {
        return undefined;
    }
}


//==============================================================================
// Loads a user and their session record based on the supplied loginToken. If no
// record matches the token, an error record is returned.

async function userLoad(loginToken) {
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
// Takes a user object returned by userLoad and updates the DB record of its
// session if it has been modified.

async function sessionSave(user) {
    if(user.session._dirty == false)
        return;
    delete user.session._dirty;
    var q = "UPDATE sessions SET session = ? WHERE userId = ?";
    var sessionJSON = JSON.stringify(user.session);
    await mdb.exec(q, [sessionJSON, user.id]);
    user.session._dirty = false;
    return;
}

