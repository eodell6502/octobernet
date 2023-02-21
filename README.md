# OctoberNet v0.0.1

## What is OctoberNet?

OctoberNet -- so named because it comes after Eternal September -- is a
UseNet-like distributed messaging system operating over HTTPS. It is also the
name of the reference implementation you are looking at right now. This README
file serves both as a description of OctoberNet networks work as well as being
a manual for the OctoberNet software.


## How OctoberNet Works

### Protocol and API

OctoberNet uses [Gadgetry](https://www.npmjs.com/package/gadgetry-api) as the
basis of communication between servers. Those communications take the form of
API calls and their responses, the bulk of which consists of JSON objects,
though there is also support for binary file attachments.

### Federations

A federation is a collection of hosts with a set of shared forums, typically
managed by some sort of participatory democracy among sysops under a governing
set of bylaws. It is identified by a name, i.e., a short string like
"OctoberNet". From a purely technical standpoint, joining a federation amounts
to arranging feeds from one or more existing members.


### Hosts

An OctoberNet host is a server running the OctoberNet software. Such hosts may
or may not run the OctoberNet UI for regular users. Each host has a standard
definition object which all of the hosts in a federation will have a copy of.
More detailed information can be obtained by querying the host directly.

```javascript
{
    guid:      "c69821bcb6a8839396f965ab6ff72a70",
    name:      "Some Domain BBS",
    sdesc:     "A gathering place for anonymous lepidopterists.",
    ldesc:     "Yada, yada, yada.",
    publicUrl: "http://octnet.somedomain.net",
    apiUrl:    "http://octnet.somedomain.net/on",
    sysop: {
        name:  "Sylvia Brown",
        email: "sysop@somedomain.net",
    },
    publicKey: "....",
    timeZone: "UTC-6",
    federations: {
        OctoberNet: {
            origin: {
                "alt.sci.zoo.butterflies": { .... },
                "alt.sci.zoo.moths": { .... },
                "talk.caterpillars": { .... },
            },
            carried: {
                "rec.arts.surrealism": "c69821bcb6a8839396f965ab6ff72a70", // source guid
                "rec.arts.embroidery": "c69821bcb6a8839396f965ab6ff72a70",
            },
        }
    },
    localForums: [
        "local.newusers": { .... }
    ]

}
```

**`guid`:** A 32-character hexadecimal string uniquely identifying the host.

**`name`:** The human-readable name of the host. This must be 1-64 characters.

**`sdesc`:** A short description of the host, 1-64 characters.

**`ldesc`:** A longer description of the host, up to 256 characters.

**`port`:** The port at which the OctoberNet software listens.

**`url`:** The URL of a public web page for the host.

**`sysop`:** An object containing the `name` and `email` of the person
responsible for the host.

**`publicKey`:** The public key of the host.

**`timeZone`:** The time zone of the host, stated as an offset from UTC.

**`federations`:** This is an object whose keys are the name/IDs of the
federations to which the host belongs. Each value is an object with two keys,
`origin` and `carried`, each of which is either `null` or an object containing
forums. The `origin` object contains forums which originate at the host. It is
keyed by forum names; the values are complete forum objects (see below). In the
case of `carried` forums, the keys are forum names and the values are the guids
of their immediate sources. Both are advertised to make it easier for sysops to
find forum sources.

**`localForums`:** This element contains records of every local forum that the
host wants to advertise.

### Forums

Forums are collections of messages. Every forum has a host that acts as its
owner/manager and central distribution point.

```javascript
{
    guid:      "c69821bcb6a8839396f965ab6ff72a70",
    name:      "local.talk.policy",
    sdesc:     "This is where users discuss BBS policy.",
    ldesc:     "Yada, yada, yada.",
    tos:       "Rules and legalese.",
    origin:    host_guid or null for local
    parent:    host_guid or null for local,
    children:  [ host_guid, host_guid, ... ],
    moderator: null,
    binaries:  null or {
        types: [ ...mimetypes... ],
        embedded: true,
        attached: true,
    },
    maxSize:    "1M",                 // inclusive of body and attachments
    commercial: false,                // or "individual" or "corporate"
    admin:      false,                // if true, for admin users only
    bodyType:   "html",               // "text" and "html" are currently supported
    advertise:  true,                 // if true, is visible to queries.
}
```

### Messages

The basic message in OctoberNet is modeled loosely after the Usenet message
format. The biggest difference between the two is that OctoberNet messages in
transit are represented as JSON objects with UTF-8 encoding.

```javascript
{
    guid:    "79054025255fb1a26e4bc422aef54eb4",          // required
    from: {                                               // required
        username: "absmith",                              // required
        host:     "somehost.com",                         // required
        email:    "alison.b.smith@somedomain.com",        // optional
        name:     "Alison B. Smith",                      // optional
    },
    date:    "2023-10-01 12:56:42",                       // required
    forum:   "comp.lang.javascript",                      // required
    subject: "Using Canvas for animations"                // required
    path:    [ "somedomain.com", "anotherdomain.com" ],   // required
    parent:  "c69821bcb6a8839396f965ab6ff72a70",          // optional
    expires: "2023-11-01 12:56:42",                       // optional
    approved: false,                                      // optional
    timezone: "UTC+3",                                    // required
    attachments: [                                        // optional
        {
            filename: "foo.png",
            size: 127672,
            hash: "c69821bcb6a8839396f965ab6ff72a70"
        }
    ],
    body:     "...."                                     // required
}
```

**`from`:** The `from` element contains an object with two required elements and
two optional element. The required elements are `username` and `host`, where
`host` is the domain name of the originating OctoberNet server, and `username`
is the username of the author on that host. (Note that `admin` is reserved for
the admin account on OctoberNet hosts.) Users can send direct mail to each other
using OctoberNet direct mail addresses, which follow the form `username%host`,
i.e., like a regular email address, but with a percent sign instead of an
ampersand.

The two optional elements are `email` and `name`, and the inclusion of either is
at the discretion of the message author. The `email` element is
self-explanatory; `name` is the display name of the user.

**`date`:** The `date` element contains the date and time in UTC using the
format `YYYY-MM-DD HH:MM:SS`.

**`forum`:** The `forums` element contains the name of the forum being posted
to. (OctoberNet does not support cross-posting.)

**`subject`:** The subject of the message appears in the `subject` element as a
string of up to 128 characters. By convention, if the message is a reply to
another, the default subject will be `"re: "` prepended to the original subject.

**`guid`:** The `guid` element is a globally-unique identifier for the message
in the form of a hexadecimal string of up to 64 characters. Beyond that, there
are no further requirements for this GUID, and no standard is specified. The
OctoberNet software constructs its GUIDs by concatenating the name of the host,
the name of the forum, the username of the author, and the local message ID, and
generating an MD5 hash from the result.

**`path`:** The `path` element consists of an array of strings identifying, in
order, the OctoberNet domains through which the message has passed.

**`parent`:** If the message is a reply, the `parent` element will contain the
GUID of the message to which it is a reply.

**`expires`:** Messages expire on any given host based on that host's
configuration. The optional `expires` element provides an explicit expiration
time in the `YYYY-MM-DD HH:MM:SS` format. Like `date`, it is given in UTC.

**`approved`:** In moderated groups, this field will contain a boolean
indicating whether the message has been approved by the moderating host.

**`timezone`**: The time zone of the source host. (Note that all dates/times are
still listed in UTC.)

**`attachments`:** In groups that support binaries, arbitrary files may be
attached to messages. These may or may not be displayed inline. For each file,
there will be an object in the `attachments` array with three elements,
`filename`, `size` (in bytes), and `hash`, which is an MD5 hash of the file.

**body`:** The actual body of the message appears in this element as a literal
HTML file, the size and exact contents of which will be governed by the forum
definition.



