/*
    subject to change (lol, some understatement)

    Base
    ----
    https://api.stockfighter.io/ob/api/
    
    REST Endpoints
    --------------
    GET     heartbeat                                               (heartbeat.api)
    GET	    venues/:venue/heartbeat                                 (heartbeat.venue)
    GET	    venues/:venue/stocks                                    (stock.list)
    GET	    venues/:venue/stocks/:stock                             (stock.book)
    POST    venues/:venue/stocks/:stock/orders                      (order.bid / order.ask)
    GET     venues/:venue/stocks/:stock/quote                       (stock.quote)
    GET     venues/:venue/stocks/:stock/orders/:id                  (order.status)
    DELETE  venues/:venue/stocks/:stock/orders/:order               (order.cancel)
    GET     venues/:venue/accounts/:account/orders                  (order.list)
    GET     venues/:venue/accounts/:account/stocks/:stock/orders    (stock.orders)

    Socket Endpoints (not implemented. perhaps in this, perhaps separate module)
    ----------------
    ws/:trading_account/venues/:venue/tickertape
    ws/:trading_account/venues/:venue/tickertape/stocks/:stock
    ws/:trading_account/venues/:venue/executions
    ws/:trading_account/venues/:venue/executions/stocks/:symbol
*/
"use strict";

const Promise = require("bluebird");

const apiBase = "https://api.stockfighter.io/ob/api/";
const gmBase = "https://www.stockfighter.io/gm/";

//TODO fill this out once I know what they are
const levels = [
    "first_steps",
    "chock_a_block",
    "sell_side"
];

let api = {
    get: require("request").defaults({
        baseUrl: apiBase,
        headers: { Accept: "application/json" },
        json: true
    }).get,
    //these are filled in upon instantiation
    //not ideal but better than throwing header objects around
    auth: null,
    post: null,
    del: null,
    gm: null
};

const callback = (err, res, body, Y, N) => {
    if(err)
        N({type: "request", body: err});
    else if(res.statusCode != 200)
        N({type: res.statusCode, body: res});
    else
        Y(body);
};

//optional defaults are: account, venue, stock
//apiKey is kinda optional if you don't try to hit those endpoints
let obj = (apiKey, defaults) => {

    api.auth = require("request").defaults({
        baseUrl: apiBase,
        headers: {
            Accept: "application/json",
            "X-Starfighter-Authorization": apiKey
        },
        json: true
    }).get;

    api.post = require("request").defaults({
        baseUrl: apiBase,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Starfighter-Authorization": apiKey
        },
        json: true
    }).post;

    api.del = require("request").defaults({
        baseUrl: apiBase,
        headers: {
            Accept: "application/json",
            "X-Starfighter-Authorization": apiKey
        },
        json: true
    }).del;

    api.gm = require("request").defaults({
        baseUrl: gmBase,
        headers: {
            Accept: "application/json",
            Cookie: `api_key=${apiKey}`
        },
        json: true
    });

    const bidOrAsk = (body, dir) => {
        return new Promise((Y,N) => {
            let tb;

            try {
                tb = JSON.parse(JSON.stringify(body));
            } catch(err) {
                N({type: "parse", body: err});
            }

            tb.account = body.account || defaults.account;
            tb.venue = body.venue || defaults.venue;
            tb.stock = body.stock || defaults.stock;
            tb.direction = dir;

            if(!tb.stock) {
                N({type: "client", body: "missing stock"});
                return;
            } else if(!tb.venue) {
                N({type: "client", body: "missing venue"});
                return;
            } else if(!tb.account) {
                N({type: "client", body: "missing account"});
                return;
            }

            api.post({
                uri: `/venues/${tb.venue}/stocks/${tb.stock}/orders`,
                body: tb
            }, (err, res, body) =>
                callback(err, res, body, Y, N));
        });
    };

    return {
        heartbeat: {
            api: () => new Promise((Y,N) => {
                api.get("/heartbeat", (err, res, body) =>
                    callback(err, res, body, Y, N))
            }),
            venue: venue => new Promise((Y,N) => {
                venue = venue || defaults.venue;

                if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.get(`/venues/${venue}/heartbeat`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
        },
        stock: {
            list: venue => new Promise((Y,N) => {
                venue = venue || defaults.venue;

                if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.get(`/venues/${venue}/stocks`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            book: (stock, venue) => new Promise((Y,N) => {
                stock = stock || defaults.stock;
                venue = venue || defaults.venue;

                if(!stock) {
                    N({type: "client", body: "missing stock"});
                    return;
                } else if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.get(`/venues/${venue}/stocks/${stock}`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            quote: (stock, venue) => new Promise((Y,N) => {
                stock = stock || defaults.stock;
                venue = venue || defaults.venue;

                if(!stock) {
                    N({type: "client", body: "missing stock"});
                    return;
                } else if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.get(`/venues/${venue}/stocks/${stock}/quote`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            orders: (stock, venue, account) => new Promise((Y,N) => {
                stock = stock || defaults.stock;
                venue = venue || defaults.venue;
                account = account || defaults.account;

                if(!stock) {
                    N({type: "client", body: "missing stock"});
                    return;
                } else if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                } else if(!account) {
                    N({type: "client", body: "missing account"});
                    return;
                }

                api.auth(`/venues/${venue}/accounts/${account}/stocks/${stock}/orders`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
        },
        order: {
            list: (venue, account) => new Promise((Y,N) => {
                venue = venue || defaults.venue;
                account = account || defaults.account;

                if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                } else if(!account) {
                    N({type: "client", body: "missing account"});
                    return;
                }

                api.auth(`/venues/${venue}/accounts/${account}/orders`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            bid: body => {
                return bidOrAsk(body, "buy");
            },
            ask: body => {
                return bidOrAsk(body, "sell");
            },
            status: (id, stock, venue) => new Promise((Y,N) => {
                stock = stock || defaults.stock;
                venue = venue || defaults.venue;

                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } else if(!stock) {
                    N({type: "client", body: "missing stock"});
                    return;
                } else if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.auth(`/venues/${venue}/stocks/${stock}/orders/${id}`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            cancel: (id, stock, venue) => new Promise((Y,N) => {
                stock = stock || defaults.stock;
                venue = venue || defaults.venue;

                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } else if(!stock) {
                    N({type: "client", body: "missing stock"});
                    return;
                } else if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                api.del(`/venues/${venue}/stocks/${stock}/orders/${id}`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
        },
        level: {
            //start takes a "level_name" or an array index
            //eg 0 == "first_steps"
            //TODO fill out the array lol
            start: level => new Promise((Y,N) => {
                if(typeof level == "number") {
                    if(level >= levels.length || level < 0) {
                        N({type: "client", body: "invalid level number "
                            + "(maybe my fault, I don't have them all yet)"});
                        return;
                    } else {
                        level = levels[level];
                    }
                }

                if(!level) {
                    N({type: "client", body: "missing level"});
                    return;
                }

                api.gm.post(`/levels/${level}`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            //FIXME restart/start/resume could easily be made wrappers on one fn
            restart: id => new Promise((Y,N) => {
                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } 

                api.gm.post(`/instances/${id}/restart`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            stop: id => new Promise((Y,N) => {
                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } 

                api.gm.post(`/instances/${id}/stop`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            resume: id => new Promise((Y,N) => {
                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } 

                api.gm.post(`/instances/${id}/resume`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
            status: id => new Promise((Y,N) => {
                if(!id) {
                    N({type: "client", body: "missing id"});
                    return;
                } 

                api.gm.get(`/instances/${id}`, (err, res, body) =>
                    callback(err, res, body, Y, N));
            })
        },
        //TODO maybe expose request itself here? 
        //designated "oh damn I need to do this weird thing this level" space
        misc: {
        }
    };
};

module.exports = obj;
