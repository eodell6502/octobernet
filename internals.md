# Internals

This file documents the internals of the OctoberNet server, chiefly the
externally-facing web API and the internal, low-level primitives library.


## Web API

The web API is implemented using Gadgetry; see the gadgetry-api docs for more
details. The short version is that each API function takes an object containing
named, unordered arguments. The object also usually contains a member named
`_loginToken`, which is exactly what it sounds like.

--------------------------------------------------------------------------------

### `configLoad`

Returns the site config as an object. Only available to sysops.

**Arguments:** none

**Returns:**

```javascript
{
    bbsApiUrl:            "https://somedomain.net/api",
    bbsGuid:              "...",
    bbsLdesc:             "An arbitrarily long description.",
    bbsName:              "Your BBS Name",
    bbsPrivateKey:        "... private ...",
    bbsPublicKey:         "...",
    bbsPublicUrl:         "https://somedomain.net/bbs",
    bbsSdesc:             "A very short description.",
    bbsUtcOffset:         -5,
    emailAutoAddress:     "octobernet@kyrillia.com",
    emailHost:            "mailbox.kyrillia.com",
    emailPassword:        "SquonkVoofBell",
    emailPort:            465,
    emailSecure":         true,
    emailUsername:        "octobernet@kyrillia.com",
    mainUrl:              "http://192.168.1.140/",
    maxFieldCount:        32,
    maxFieldSize:         128000000,
    maxFileCount:         64,
    maxFileSize:          128000000,
    port:                 8080,
    pwdHasLowercase:      true,
    pwdHasNumbers:        true,
    pwdHasSpecialChars:   true,
    pwdHasUppercase:      false,
    pwdMinLength:         8,
    sessionLifetime:      1440,
    sysopEmail:           "jdoe@somedomain.net",
    sysopName:            "Jane Doe",
    verificationLifetime: 1440
}
```

--------------------------------------------------------------------------------

### `configSave`

Writes the config object back to the database. Sysops only.

**Arguments:** An object with all of the config k/v pairs.

**Returns:** { status: "OK" }


--------------------------------------------------------------------------------

### `federationsGet`

Returns a list of federations.

**Arguments:** none

**Returns:**

```javascript
{
    federations: [
        { id: 1, name: "OctoberNet" },
        // ...
    ]
}
```

--------------------------------------------------------------------------------

### `forumDelete`

Deletes the specified forum along with all associated records.

**Arguments:**

| name    | status   | description                                                   |
|---------|----------|---------------------------------------------------------------|
| forumId | required | Integer

**Returns:** `{status: "OK" }`

--------------------------------------------------------------------------------

### `forumGet`

Retrieves an individual forum record.

**Arguments:**

| name    | status   | description                                                   |
|---------|----------|---------------------------------------------------------------|
| forumId | required | Integer

**Returns:**

```javascript
{
    forum: {
        id: 1,
        guid: "forumguid1",
        federationId: null,
        name: "local.talk.generic",
        sdesc: "This is a generic talk forum",
        ldesc: "This could be up to 1024 characters.",
        tos: "This could go on forever.",
        origin: null,
        parent: null,
        moderator: null,
        bodyType: "html,text,markdown",
        maxMessageSize: 128000,
        maxMessageAge: 25,
        maxMessagebaseSize: 0,
        binariesAttached: 1,
        binariesEmbedded: 1,
        binaryTypes: "TBD",
        commercial: "none",
        admin: 0,
        advertise: 0,
        scripts: 0
    }
}
```

--------------------------------------------------------------------------------

### `forumsGet`

Retrieves a list of forums to display in the forum editor.

**Arguments:** none

**Returns:**

```javascript
{
    forums: [
        {
            id: 232,
            federation: "OctoberNet",
            name: "talk.music.disco",
            sdesc: "Discussion of disco music",
            admin: 0
        },
        // ...
    ]
}
```

--------------------------------------------------------------------------------

### `forumUpsert`

Updates or inserts a forum record. If `newForum == 1`, then `id` is ignored and
a new record is created. Otherwise, an update is performed.

**Arguments:**

| name                 | status   | description                                                   |
|----------------------|----------|---------------------------------------------------------------|
| `id`                 | required | Integer
| `guid`               | required | String, 1-64 chars
| `federationId`       | required | String, or `null`
| `name`               | required | String, 1-64 chars
| `sdesc`              | required | String, 1-64 chars
| `ldesc`              | required | String, 1-1024 chars
| `tos`                | required | String, 1-64 chars, or `null`
| `origin`             | required | String, 1-64 chars, or `null`
| `parent`             | required | String, 1-64 chars, or `null`
| `moderator`          | required | String, 1-64 chars, or `null`
| `bodyType`           | required | SET with values `"text"`, `"html"`, `"markdown"`, and `"json"`
| `maxMessageSize`     | required | Integer, max individual message size in bytes
| `maxMessageAge`      | required | Integer, max message age in days, `0` to disable
| `maxMessagebaseSize` | required | Integer, max size of total forum messages, `0` to disable
| `binariesAttached`   | required | Integer, 0-1
| `binariesEmbedded`   | required | Integer, 0-1
| `binaryTypes`        | required | ...
| `commercial`         | required | One of `"none"`, `"individual"`, `"corporate"`
| `admin`              | required | Integer, 0-1
| `advertise`          | required | Integer, 0-1
| `scripts`            | required | Integer, 0-1
| `newForum`           | required | Integer, 0-1

**Returns:**

```javascript
{ forumId: 174 }  // if insert
{ status: "OK" }  // if update
```

--------------------------------------------------------------------------------

### `guidGet`

Returns a new random SHA-224 hash.

**Arguments:** none

**Returns:** `{ guid: "89121b18c9801a8d90f0ad" }`


--------------------------------------------------------------------------------

### `hostGet`

Returns the full details of a host.

**Arguments:**

| name         | status   | description                                                   |
|--------------|----------|---------------------------------------------------------------|
| `hostId`     | required | Integer

**Returns:**

```javascript
{
    host: {
        id: 1,
        guid: "BLAHBLAHBLAH",
        name: "The Other Host",
        sdesc: "This is the other host",
        ldesc: "This is a longer description of the other host.",
        publicUrl: "https://theotherhost.com",
        apiUrl: "https://theotherhost.com:8080",
        sysopName: "Other Sysop",
        sysopEmail: "sysop@theotherhost.com",
        publicKey: "HNARFHNARF",
        utcOffset: -4,
        updated: "2023-03-01T02:53:26.000Z"
    }
}
```

--------------------------------------------------------------------------------

### `hostsGet`

Retrieves a list of hosts to display in the hosts viewer.

**Arguments:** none

**Returns:**

```javascript
{
    hosts: [
        {
            id: 1,
            name: "The Other Host",
            sdesc: "This is the other host",
            updated: "2023-03-01T02:53:26.000Z"
        },
        // ...
    ]
}
```

--------------------------------------------------------------------------------

### `userDelete`

Marks the specified user deleted. This will not allow the current user to delete
themself.

**Arguments:**

| name         | status   | description                                                   |
|--------------|----------|---------------------------------------------------------------|
| userId       | required | Integer

**Returns:** ``{ status: "OK" }``


--------------------------------------------------------------------------------

### `userGet`

**Arguments:**

| name         | status   | description                                                   |
|--------------|----------|---------------------------------------------------------------|
| `identifier` | required | Must be one of `"username"`, `"email"`, or `"displayName"`.   |
| `value`      | required | A string containing the value to be matched.                  |
| `userId`     | optional | The integer value of a user ID to exclude from consideration. |

**Returns:**

```javascript
{
    user: {
        // complete user record
    }
}
```

--------------------------------------------------------------------------------

### `userIdentifierExists`

Tests whether a user already exists with the specified username, email, or
display name. If a `userId` is supplied, it will be excluded from consideration.
This function is mainly used in new account creation to test for identifier
collisions.

**Arguments:**

| name         | status   | description                                                   |
|--------------|----------|---------------------------------------------------------------|
| `identifier` | required | Must be one of `"username"`, `"email"`, or `"displayName"`.   |
| `value`      | required | A string containing the value to be matched.                  |
| `userId`     | optional | The integer value of a user ID to exclude from consideration. |

**Returns:** `{ exists: true }`

--------------------------------------------------------------------------------

### `userLogin`

Attempts to log a user in, returning some of the details of the user record on
success.

**Arguments:**

| name       | status   | description             |
|------------|----------|-------------------------|
| `username` | required | string, 1-64 characters |
| `password` | required | string, 1-64 characters |

**Returns:**

On success, returns an object containing the user's details:

```javascript
{
    id:          203,
    username:    "joeschmoe",
    email:       "joe@schmoe.com",
    type:        "user",
    loginToken:  "47a889c57f8c70e0a529a3a06b30e2ce2e05f5595baf187198f08a6c",
    displayName: "Joe Schmoe",
}
```

One of three error codes may also be returned. If the user does not exist
or has supplied the wrong password, `BADLOGIN` will be returned. If the account
has been deleted/banned, `DELETED` will be returned. Finally, if the account
is suspended, the error code `SUSPENDED` will be returned along with the date
the suspension ends:

```javascript
{ _errcode: "SUSPENDED", until: "2023-02-01 19:41:02" }
```

--------------------------------------------------------------------------------

### `userLoginCheck`

Tests whether the current user is logged in, i.e., has a valid `loginToken`.

**Arguments:** none

**Returns:** `{ loggedIn: true }`

--------------------------------------------------------------------------------

### `userLogout`

Terminates the current user's login session.

**Arguments:** none

**Returns:** `{ status: "OK" }`

--------------------------------------------------------------------------------

### `userNoobCreate`

Creates a new user of type `noob` and sends a verification email to the provided
email address.

**Arguments:**

| name          | status   | description             |
|---------------|----------|-------------------------|
| `username`    | required | string, 1-64 characters |
| `email`       | required | string, 1-64 characters |
| `password`    | required | string, 1-64 characters |
| `displayName` | required | string, 1-64 characters |

**Returns:**

On success, `{ status: "OK" }`. If the username, email, or display name already
exists, error codes of `DUPUSERNAME`, `DUPEMAIL`, or `DUPDISPLAYNAME` will be
returned. In rare circumstances, `DUPUSER` may be returned, indicating that the
user was created after the duplicate checks but before the INSERT query was
issued.

--------------------------------------------------------------------------------

### `userResetProcess`

Sets a new password for the user when the correct verification token is
supplied.

**Arguments:**

| name                | status   | description             |
|---------------------|----------|-------------------------|
| `verificationToken` | required | string, 1-64 characters |
| `password`          | required | string, 1-64 characters |

**Returns:** `{ status: "OK" } // or "FAILED"`

--------------------------------------------------------------------------------

### `userResetRequest`

Given either a username or an email, sets a verification token for a password
reset request and sends an email with a reset link.

**Arguments:**

| name          | status   | description             |
|---------------|----------|-------------------------|
| `username`    | optional | string, 1-64 characters |
| `email`       | optional | string, 1-64 characters |

**Returns:** `{ status: "OK" }`

--------------------------------------------------------------------------------

### `usersGet`

Retrieves partial details about user accounts for display in the sysop module.
If the optional `type` argument is supplied, results will be restricted to that
type.

**Arguments:**

| name      | status   | description                   |
|-----------|----------|-------------------------------|
| `type`    | optional | `"noob"`, `"user"`, `"sysop"` |

**Returns:**

```javascript
{
    users: [
        {
            id: 5,
            type: "noob",
            displayName: "Fred Noob",
            suspendedUntil: null,
            lastActive: "2023-03-04 12:45:21"
        },
        // ...
    ]
}
```

--------------------------------------------------------------------------------

### `userUpsert`

Updates the user record with the corresponding id or, if id == 0 or newUser
is `true`, creates a new user.

**Arguments:**

| name             | status   | description                      |
|------------------|----------|----------------------------------|
| `id`             | required | uint                             |
| `username`       | required | string, 1-64 chars               |
| `displayName`    | required | string, 1-64 chars               |
| `email`          | required | string, 1-64 chars               |
| `password`       | required | string, 1-64 chars, or null      |
| `type`           | required | `"noob"`, `"user"`, or `"sysop"` |
| `suspendedUntil` | required | datetime or null                 |
| `newUser`        | optional | boolean                          |

**Returns:**

```javascript
{ userId: 324 }  // if inserting
{ changed: 1 }   // if updating
```
--------------------------------------------------------------------------------

### `userUsernameRecovery`

When a user can't remember their username, they can enter their email address
and, if it matches an existing user record, this function will send an email
to that address containing the associated username.

**Arguments:**

| name          | status   | description             |
|---------------|----------|-------------------------|
| `email`       | optional | string, 1-64 characters |

**Returns:** `{ status: "OK" }`

--------------------------------------------------------------------------------

### `userVerify`

Takes an account verification token and, if it is valid, upgrades the associated
user from type `noob` to type `user`.

**Arguments:**

| name                | status   | description             |
|---------------------|----------|-------------------------|
| `verificationToken` | required | string, 1-64 characters |

**Returns:** On success, `{ status: "OK" }`, and error code `"NOTFOUND"` if
the token does not exist or is expired.


## Primitives

--------------------------------------------------------------------------------

### `async function configGet(name)`

Retrieves the named value from the `config` table, applying the appropriate type
conversion. Returns the resulting value or `undefined` if not found.

--------------------------------------------------------------------------------

### `async function configGetMulti(...keys)`

Takes a list of config keys and returns an object with their values.

--------------------------------------------------------------------------------

### `async function configLoad()`

Loads the key-value pairs from the `config` table, applying type conversions
as it goes. Returns the resulting object.

--------------------------------------------------------------------------------

### `async function configUpdate(name, value)`

Writes a key-value pair to the `config` table.

--------------------------------------------------------------------------------

### `async function federationExists(id)`

Returns a boolean indicating whether the specified fedeation ID is valid.

--------------------------------------------------------------------------------

### `async function federationsGet()`

Returns a list of all federations.

--------------------------------------------------------------------------------

### `async function forumDelete(forumId)`

Deletes the specified forum. At the moment, this is just the forum record,
but soon it will include messages and other data associated with it.

--------------------------------------------------------------------------------

### `async function forumsGet()`

Returns a list of all forums for display in the sysop forum manager. Fields
returned include `id`, `federation`, `name`, `sdesc`, and `admin`. Results are
sorted by federation name and then forum name.

--------------------------------------------------------------------------------

### `async function forumIdentifierExists(identifier, value, forumId = 0)`

Returns a boolean indicating whether the supplied identifier --- currently,
`"guid"` is the only option --- already exists. If a forum ID is passed, that
record will be ignored.

--------------------------------------------------------------------------------

### `async function forumNewCreate(forum)`

Creates a new forum from an object containing the forum's values.

--------------------------------------------------------------------------------

### `async function forumsGet()`

Returns a list of all forums for display in the sysop forum manager. Fields
returned include `id`, `federation`, `name`, `sdesc`, and `admin`. Results
are sorted by federation name and then forum name.

--------------------------------------------------------------------------------

### `async function forumUpdate(forum)`

Updates a forum from an object containing the forum's values.

--------------------------------------------------------------------------------

### `async function getRecord(table, field, value)`

Returns the first row from `table` where `field == value`, or `undefined` if
nothing was found. Obviously for cases where the field is contains unique
values.

--------------------------------------------------------------------------------

### `async function hostsGet(fields, orderBy)`

Retrieves the fields in the `fields` array, sorted by the field in `orderBy`.

--------------------------------------------------------------------------------

### `async function insertRecord(table, args)`

Inserts a record in the named `table` using the supplied `args`. Returns the new
ID or `undefined` if an error occurred. Of course, this presumes an auto-
increment primary key and that all required columns are provided in `args`.

--------------------------------------------------------------------------------

### `async function passwordIsValid(password)`

Returns `true` if the supplied password meets all of the criteria specified by
the password params (see `passwordParamsGet`).

--------------------------------------------------------------------------------

### `async function passwordParamsDescribe()`

Returns text describing the requirements for a password in a form ready to be
displayed to an end-user.

--------------------------------------------------------------------------------

### `async function passwordParamsGet()`

Returns the configured password parameters in the form:

```javascript
{
    pwdMinLength:       8,
    pwdHasLowercase:    true,
    pwdHasUppercase:    true,
    pwdHasNumbers:      true,
    pwdHasSpecialChars: true
}
```

--------------------------------------------------------------------------------

### `function randomHash()`

Returns a random SHA-224 hash.

--------------------------------------------------------------------------------

### `async function sendEmail(sender, recipient, subject, body)`

Sends an email. The `body` is HTML-only.

--------------------------------------------------------------------------------

### `async function sessionSave(user)`

Takes a `user` object returned by `userLoad` and updates the DB record of its
session if it has been modified.

--------------------------------------------------------------------------------

### `async function updateRecordById(table, id, args)`

Updates the record with `id == id` in `table` using the column/value pairs in
`args`. Returns the number of changed rows or `undefined` if an error occurred.

--------------------------------------------------------------------------------

### `async function userActivityUpdate(userId)`

Updates the lastActive field for the specified user.

--------------------------------------------------------------------------------

### `async function userDelete(userId)`

Deletes the specified user. At present, this is just marking the record as
deleted.

--------------------------------------------------------------------------------

### `async function userIdentifierExists(identifier, value, userId = 0)`

Returns a boolean indicating whether the supplied user `identifier` --
`"username"`, `"email"`, or `"displayName"` -- already exists. If a user ID is
passed, that account will be ignored.

--------------------------------------------------------------------------------

### `async function userLoad(loginToken)`

Loads a user and their session record based on the supplied `loginToken`. If no
record matches the token, an error record is returned. The login token's
lifetime is extended and the user's `lastActive` field is updated.

--------------------------------------------------------------------------------

### `async function userLoginToken(userId)`

Creates, stores, and returns a `loginToken` for the supplied user ID, using the
configured `sessionLifetime`. Clears out any outstanding verification token at
the same time.

--------------------------------------------------------------------------------

### `async function userLogout(token)`

Given a `loginToken`, logs the associated user out.

--------------------------------------------------------------------------------

### `async function userNewCreate(username, email, password, displayName, userType)`

Given a `username`, `email`, `displayName`, `password`, and `userType`, creates
the user and returns its ID. If any of the identifiers already exist, `-1` will
be returned instead. It is assumed all inputs have already been validated.

--------------------------------------------------------------------------------

### `async function userNewVerify(token)`

Given a verification `token`, verifies the corresponding new user account,
upgrading it from `"noob"` to `"user"` at the same time. Returns a boolean
indicating success or failure.

--------------------------------------------------------------------------------

### `async function userPasswordReset(token, password)`

Takes a reset `token` and a `password`, and if valid, sets the user password.
Returns a boolean indicating success or failure.

--------------------------------------------------------------------------------

### `async function userResetTokenCreate(userId)`

Generates a reset token for the supplied `userId` and updates the user
record accordingly.

--------------------------------------------------------------------------------

### `async function usersGet(type = false)`

Retrieves top-level details of users for display in the sysop module. If `type`
is specified, only that type will be returned.

--------------------------------------------------------------------------------

### `async function userSuspensionCheck(userId)`

Checks whether the user is suspended. If there is a suspension date, and it is
in the past, it is removed. Returns `true` if the user can log in, `false` if
they are still suspended, or `undefined` if the user is not found.

--------------------------------------------------------------------------------

### `async function userVerificationTokenCreate(userId)`

Generates a verification token for the supplied `userId` and updates the user
record accordingly.
