
import mdb from "mysql2/promise";


class MDBWrapper {

    //==========================================================================

    constructor(host, user, pwd, db, port = 3306) { // FN: MDBWrapper.constructor
        this.host = host;
        this.user = user;
        this.pwd  = pwd;
        this.db   = db;
        this.port = port;
    }

    //==========================================================================

    async connect() { // FN: MDBWrapper.connect
        try {
            this.pool = await mdb.createPool({
                host:     this.host,
                user:     this.user,
                password: this.pwd,
                database: this.db,
                port:     this.port
            });
        } catch(e) {
            console.log(e);
            return false;
        }
        return true;
    }

    //==========================================================================

    async exec(query, args = [ ]) { // FN: MDBWrapper.exec
        var result                  = await this.pool.execute(query, args);
        result[0].insertId     = result.insertId;
        result[0].affectedRows = result.affectedRows;
        result[0].changedRows  = result.changedRows;
        return result[0];
    }

    //==========================================================================

    async firstRow(query, args = [ ]) { // FN: MDBWrapper.firstRow
        var res = await this.exec(query, args);
        if(res.length)
            return res[0];
        else
            return undefined;
    }

    //==========================================================================

    async firstField(query, args = [ ]) { // FN: MDBWrapper.firstField
        var res = await this.exec(query, args);
        if(res.length) {
            for(var k in res[0])
                return res[0][k];
        } else {
            return undefined;
        }
    }

    //==========================================================================

    destructor() { // FN: MDBWrapper.destructor
        this.pool.end();
    }

}


export default MDBWrapper;
