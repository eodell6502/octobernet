
Phase I - Login Module/Account Self-Management

    * Terms of Service  (defer)

Phase II - Sysop Tools

    * User management       (core done)
    * Configuration         (core done)
    * Host viewer
    * Forum management
    * Tidying

Phase III - User Tools

    * Account management
    * Newsreader
    * Proper graphic design

    Once the basic BBS is functioning, we have a public beta release.

Phase IV - Federations


Phase V - 2.0

    * More automation
    * PostgreSQL backend option
    * ZeroMQ option


Goals:

    * Store-and-forward message network similar to Usenet, but over HTTPS.
    * Defined more in the fashion of an API than of a protocol.
    * Decentralized
    * Includes a newsreader-like UI for users.
    * Support for inlineable binary attachments.
    * DMail

When a message is created, it is sent upstream until it reaches the newsgroup
origin. At each node, it is also sent downstream to all of the node's children
except for its origin path. This may be done immediately or at intervals defined
in the newsgroup manifesto.

In contrast, manifesto updates only go downward from the newsgroup origin.

Metagroups automatically covering the important tree relationships for admin
purposes.

Extensive, highly automated networking and federation support.

Admin polls.
