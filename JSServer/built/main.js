"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const Validator_1 = require("./Validator");
const CnnPool_1 = require("./CnnPool");
const async_1 = require("async");
const Prss_1 = require("./Account/Prss");
const Cnvs_1 = require("./Conversation/Cnvs");
const Ssns_1 = require("./Account/Ssns");
const Msgs_1 = require("./Conversation/Msgs");
const Session_1 = require("./Session");
var app = express_1.default();
// Static paths to be served like index.html and all client side js
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Partially complete handler for CORS.
app.use(function (req, res, next) {
    if (req.method === 'OPTIONS')
        console.log("-------\n", req.headers, "-------\n");
    console.log("Handling " + req.path + "/" + req.method);
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    // res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length " + 
    //  "Cookie, Host, Origin, Referer, User-Agent, Access-Control-Request-Method"); 
    res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length, " +
        "Cookie, Host, Origin, Referer, User-Agent");
    // res.header("Access-Control-Allow-Headers", "Content-Type"); 
    res.header("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS, " +
        "POST, GET");
    res.header("Access-Control-Expose-Headers", "Location, Set-Cookie, " +
        "Date, Keep-Alive, Content-Length, Connection");
    next();
});
// No further processing needed for options calls.
app.options("/*", function (req, res) {
    res.status(200).end();
});
// Parse all request bodies using JSON, yielding a req.body property
app.use(body_parser_1.default.json());
// No messing w/db ids
app.use(function (req, res, next) {
    delete req.body.id;
    next();
});
// Parse cookie header, and attach cookies to req as req.cookies.<cookieName>
app.use(cookie_parser_1.default());
app.use(Session_1.router);
// Check general login.  If OK, add Validator to |req| and continue processing,
// otherwise respond immediately with 401 and noLogin error tag.
app.use(function (req, res, next) {
    console.log(req.path);
    console.log(req.method, req.path);
    if (req.session || (req.method === "POST" && (req.path === "/Prss" ||
        req.path === "/Ssns"))) {
        req.validator = new Validator_1.Validator(req, res);
        next();
    }
    else
        res.status(401).end();
});
// Add DB connection, as req.cnn, with smart chkQry method, to |req|
app.use(CnnPool_1.CnnPool.router);
// Load all subroutes
app.use("/Prss", Prss_1.router);
app.use("/Ssns", Ssns_1.SsnRouter);
app.use("/Cnvs", Cnvs_1.router);
app.use("/Msgs", Msgs_1.router);
// Special debugging route for /DB DELETE.  Clears all table contents,
//resets all auto_increment keys to start at 1, and reinserts one admin user.
app.delete("/DB", function (req, res) {
    const ssn = req.session;
    if (!ssn.isAdmin()) {
        req.cnn.release();
        res.status(403).end();
    }
    else {
        Session_1.Session.logoutAll();
        // Callbacks to clear tables
        var cbs = ["Message", "Conversation", "Person", "Likes"].map((table) => function (cb) {
            req.cnn.query("delete from " + table, cb);
        });
        // Callbacks to reset increment bases
        cbs = cbs.concat(["Conversation", "Message", "Person", "Likes"].map((table) => (cb) => {
            req.cnn.query("alter table " + table + " auto_increment = 1", cb);
        }));
        // Callback to reinsert admin user
        cbs.push((cb) => {
            req.cnn.query("INSERT INTO Person (firstName, lastName, email," +
                " password, whenRegistered, role) VALUES " +
                '("Joe", "Admin", "adm@11.com","password", NOW(), 1);', cb);
        });
        // Callback to clear sessions, release connection and return result
        cbs.push((cb) => {
            Session_1.Session.getAllIds().forEach((id) => {
                Session_1.Session.findById(id).logOut(id);
            });
            cb(null);
        });
        async_1.series(cbs, (err) => {
            req.cnn.release();
            if (err)
                res.status(400).json(err);
            else
                res.status(200).end();
        });
    }
});
// Anchor handler for general 404 cases.
app.use(function (req, res) {
    res.status(404).end();
    res.cnn.release();
});
// Handler of last resort.  Send a 500 response with stacktrace as the body.
app.use(function (err, req, res, next) {
    res.status(500).json(err.stack);
    req.cnn && req.cnn.release();
});
const PORT = (() => {
    var p;
    process.argv.forEach((arg, i) => {
        if (arg === "-p")
            p = parseInt(process.argv[i + 1]);
    });
    return p;
})();
app.listen(PORT, function () {
    console.log(`App Listening on port ${PORT}`);
});
