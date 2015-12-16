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
    POST    venues/:venue/stocks/:stock/orders                      (stock.bid / stock.ask)
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
const request = require("request").defaults({
    baseUrl: "https://api.stockfighter.io/ob/api/",
    headers: { Accept: "application/json" },
    json: true
});

//this feels a bit silly
//TODO replace with a function or build objects in promise or something
let headers = {
    post: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Starfighter-Authorization": null
    },
    auth: {
        Accept: "application/json",
        "X-Starfighter-Authorization": null
    }
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
    headers.post["X-Starfighter-Authorization"] = apiKey;
    headers.auth["X-Starfighter-Authorization"] = apiKey;

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

            request.post({
                uri: `/venues/${tb.venue}/stocks/${tb.stock}/orders`,
                headers: headers.post,
                body: tb
            }, (err, res, body) =>
                callback(err, res, body, Y, N));
        });
    };

    return {
        heartbeat: {
            api: () => new Promise((Y,N) => {
                request.get("/heartbeat", (err, res, body) =>
                    callback(err, res, body, Y, N))
            }),
            venue: venue => new Promise((Y,N) => {
                venue = venue || defaults.venue;

                if(!venue) {
                    N({type: "client", body: "missing venue"});
                    return;
                }

                request.get(`/venues/${venue}/heartbeat`, (err, res, body) =>
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

                request.get(`/venues/${venue}/stocks`, (err, res, body) =>
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

                request.get(`/venues/${venue}/stocks/${stock}`, (err, res, body) =>
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

                request.get(`/venues/${venue}/stocks/${stock}/quote`, (err, res, body) =>
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

                request.get({
                    uri: `/venues/${venue}/accounts/${account}/stocks/${stock}/orders`,
                    headers: headers.auth
                }, (err, res, body) =>
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

                request.get({
                    uri: `/venues/${venue}/accounts/${account}/orders`,
                    headers: headers.auth
                }, (err, res, body) =>
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

                request.get({
                    uri: `/venues/${venue}/stocks/${stock}/orders/${id}`,
                    headers: headers.auth
                }, (err, res, body) =>
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

                request.del({
                    uri: `/venues/${venue}/stocks/${stock}/orders/${id}`,
                    headers: headers.auth
                }, (err, res, body) =>
                    callback(err, res, body, Y, N));
            }),
        },
        //TODO maybe expose request itself here? 
        //designated "oh damn I need to do this weird thing this level" space
        misc: {
        }
    };
};

module.exports = obj;
