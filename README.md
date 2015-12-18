stockfighter-api
---

REST client. websockets maybe later, maybe as its own separate thing. will decide based on what I need ingame. overall design dictated by my personal needs/whims, fair warning.

[npm](https://www.npmjs.com/package/stockfighter-api)

[api](https://starfighter.readme.io/docs/heartbeat)

[gm api](https://discuss.starfighters.io/t/the-gm-api-how-to-start-stop-restart-resume-trading-levels-automagically)

usage
---

`npm install stockfighter-api`

```javascript
"use strict";

const stockfighter = require("stockfighter-api");
const apiKey = process.env.STOCKFIGHTER_API_KEY;

const body = {
    qty: 100,
    price: 8000,
    orderType: "market" 
};

const defaults = {
    account: "EXB123456",
    venue: "TESTEX",
    stock: "FOOBAR"
};

const client = stockfighter(apiKey, defaults);

client.heartbeat.api()
    .then(res => console.log(res));

client.order.bid(body)
    .then(res => client.order.cancel(res.id));

client.level.start(0)
    .then(res => client.stock.quote(res.tickers[0], res.venues[0]))
    .then(res => console.log(res));
```

defaults are all optional. account/venue/stock passed as args or in POST body override defaults if set. all functions return promises that resolve to the server response or reject with an object of the form `{ type: "type", body: "friendly message" }` or `{ type: 451, body: { server: "response", as: "object" } }`.

`level.start` is meant to take either a string or a number, the number corresponding to an array index, eg `level.start("first_steps")` and `level.start(0)` are equivalent. at the moment I only have the first three level names though. will update with the rest when I have them.

`mocha test` is a reasonably convenient way to see what all the api responses look like. couple things truncated for brevity, but everything important is there. note this requires a `STOCKFIGHTER_API_KEY` env (it will also try `dotenv.load()`, failing gracefully if the module isn't there, but it occurs to me just now that function likely only checks the pwd). level tests will probably (haven't actually checked) kill any levels you have. `mocha test --grep foo` and `mocha test --fgrep bar` may be useful.

api
---

### client.heartbeat.api()
GET /heartbeat

### client.heartbeat.venue(?venue)
GET /venues/:venue/heartbeat

### client.stock.list(?venue)
GET /venues/:venue/stocks

### client.stock.book(?stock, ?venue)
GET /venues/:venue/stocks/:stock

### client.stock.quote(?stock, ?venue)
GET /venues/:venue/stocks/:stock/quote

### client.stock.orders(?stock, ?venue, ?account)
GET /venues/:venue/accounts/:account/stocks/:stock/orders

### client.order.list(?venue, ?account)
GET /venues/:venue/accounts/:account/orders

### client.order.bid(body)
POST /venues/:venue/stocks/:stock/orders

### client.order.ask(body)
POST /venues/:venue/stocks/:stock/orders

### client.order.status(id, ?stock, ?venue)
GET /venues/:venue/stocks/:stock/orders/:id

### client.order.cancel(id, ?stock, ?venue)
DELETE /venues/:venue/stocks/:stock/orders/:order

### client.level.start(level)
POST /levels/:level

### client.level.resume(id)
POST /instances/:id/resume

### client.level.restart(id)
POST /instances/:id/restart

### client.level.stop(id)
POST /instances/:id/stop

### client.level.status(id)
GET /instances/:id

style notes
---

es6's const seems to be a common source of confusion, often due to misunderstanding what constitutes "an object". `var obj = {};`, `{}` is an object, but `obj` is merely a _reference_. thus:

```javascript
    const foo = { x: 1 };

    foo.x++;
    assert.equal(foo.x, 2);

    const bar = foo;
    bar.x++;
    assert.equal(foo.x, 3);
```

anyway I declare objects as const just to communicate that I treat them as if they were immutable.

also I assign null a lot. I never assign undefined. I do this to signal intent: null "I did this on purpose" vs undefined "whoa something's not right". 

the client should never ever mutate any object you pass to it. if it does by accident, this is a bug, not a feature.
