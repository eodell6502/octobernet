import { GQuery } from "./node_modules/gadgetry-api/GQuery.mjs";
import { sha224 } from "js-sha256";
console.log(sha224("secret"));
main();

async function main() {
    //var g = new GQuery("http://localhost:8080");
    var g = new GQuery("http://localhost/on");
    g.benchmark(true);

    //--------------------------------------------------------------------------

    console.log("userLogin with nonexistent user...");
    var res = await g.req("userLogin", { username: "notreal", password: "notvalid" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "BADLOGIN" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userLogin with noob user and good password...");
    var res = await g.req("userLogin", { username: "joe_noob", password: "secret" });
    var noobToken = res.loginToken;
    console.log(res._exectime, "msec");
    console.log(res.username == "joe_noob" ? "OK" : "FAILED")

    //--------------------------------------------------------------------------

    console.log("userLogin with noob user and bad password...");
    var res = await g.req("userLogin", { username: "joe_noob", password: "wrong" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "BADLOGIN" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userLogin with registered user and good password...");
    var res = await g.req("userLogin", { username: "joe_user", password: "secret" });
    var userToken = res.loginToken;
    console.log(res._exectime, "msec");
    console.log(res.username == "joe_user" ? "OK" : "FAILED")

    //--------------------------------------------------------------------------

    console.log("userLogin with registered user and bad password...");
    var res = await g.req("userLogin", { username: "joe_user", password: "wrong" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "BADLOGIN" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userLogin with admin user and good password...");
    var res = await g.req("userLogin", { username: "joe_admin", password: "secret" });
    var adminToken = res.loginToken;
    console.log(res._exectime, "msec");
    console.log(res.username == "joe_admin" ? "OK" : "FAILED")

    //--------------------------------------------------------------------------

    console.log("userLogin with registered user and bad password...");
    var res = await g.req("userLogin", { username: "joe_admin", password: "wrong" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "BADLOGIN" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userLogin with deleted user...");
    var res = await g.req("userLogin", { username: "joe_deleted", password: "secret" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "DELETED" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userLogin with suspended user...");
    var res = await g.req("userLogin", { username: "joe_suspended", password: "secret" });
    console.log(res._exectime, "msec");
    console.log(res._errcode && res._errcode == "SUSPENDED" ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing username and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "username", value: "joe_user" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing username and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "username", value: "joe_user", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting username and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "username", value: "joe_fake" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting username and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "username", value: "joe_fake", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing email and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "email", value: "joe_user@kyrillia.com" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing email and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "email", value: "joe_user@kyrillia.com", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting email and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "email", value: "joe_fake@kyrillia.com" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting email and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "email", value: "joe_fake@kyrillia.com", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing displayName and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "displayName", value: "Joe User" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "OK" : "FAILED");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with existing displayName and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "displayName", value: "Joe User", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting displayName and no userId...");
    var res = await g.req("userIdentifierExists", { identifier: "displayName", value: "Joe Fake" });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------

    console.log("userIdentifierExists with nonexisting displayName and userId...");
    var res = await g.req("userIdentifierExists", { identifier: "displayName", value: "Joe Fake", userId: 2 });
    console.log(res._exectime, "msec");
    console.log(res.exists ? "FAILED" : "OK");

    //--------------------------------------------------------------------------



}
