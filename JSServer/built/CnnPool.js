"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CnnPool = void 0;
const mysql_1 = require("mysql");
const connection_json_1 = __importDefault(require("./connection.json"));
;
// export let router = Router({ caseSensitive: true });
class CnnPool {
    constructor() {
        this.poolCfg = connection_json_1.default;
        // Conventional getConnection, drawing from the pool
        this.getConnection = (cb) => {
            this.pool.getConnection(cb);
        };
        this.poolCfg.connectionLimit = CnnPool.PoolSize;
        this.pool = mysql_1.createPool(this.poolCfg);
        console.log(this.poolCfg);
    }
} //class closing brace
exports.CnnPool = CnnPool;
// NOTE: Do *not* change this pool size.  It is required to be 1 in order
// to demonstrate you are properly freeing connections!
CnnPool.PoolSize = 1;
// The one (and probably only) CnnPool object needed for the app
CnnPool.singleton = new CnnPool();
// Router function for use in auto-creating CnnPool for a request
CnnPool.router = (req, res, next) => {
    console.log("Getting connection");
    CnnPool.singleton.getConnection(function (err, cnn) {
        if (err)
            res.status(500).json('Failed to get connection ' + err);
        else {
            console.log("Connection acquired");
            cnn.chkQry = function (qry, prms, cb) {
                // Run real qry, checking for error
                this.query(qry, prms, function (err, dbRes, fields) {
                    if (err) {
                        res.status(500).json('Failed query ' + qry);
                        console.log(err);
                    }
                    cb(err, dbRes, fields);
                });
            };
            req.cnn = cnn;
            next();
        }
    });
};
// module.exports = CnnPool;
