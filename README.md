stockfighter-api
---

REST client. websockets maybe later, maybe as its own separate thing. will decide based on what I need ingame. overall design dictated by my personal needs/whims, fair warning.

usage
---

```javascript
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

client.heartbeat.api().then(res => console.log(res));

client.order.bid(body).then(res => client.order.cancel(res.id));
```

defaults are all optional. account/venue/stock passed as args or in POST body override defaults if set. all functions return promises that resolve to the server response or reject with an object of the form `{ type: "type", body: "friendly message" }` or `{ type: 451, body: { server: "response", as: "object" } }`.

api
---

*client.heartbeat.api()*
GET /heartbeat

*client.heartbeat.venue(?venue)*
GET /venues/:venue/heartbeat

*client.stock.list(?venue)*
GET /venues/:venue/stocks

*client.stock.book(?stock, ?venue)*
GET /venues/:venue/stocks/:stock

*client.stock.quote(?stock, ?venue)*
GET /venues/:venue/stocks/:stock/quote

*client.stock.orders(?stock, ?venue, ?account)*
GET /venues/:venue/accounts/:account/stocks/:stock/orders

*client.order.list(?venue, ?account)*
GET /venues/:venue/accounts/:account/orders

*client.order.bid(body)*
POST /venues/:venue/stocks/:stock/orders

*client.order.ask(body)*
POST /venues/:venue/stocks/:stock/orders

*client.order.status(id, ?stock, ?venue)*
GET /venues/:venue/stocks/:stock/orders/:id

*client.order.cancel(id, ?stock, ?venue)*
DELETE /venues/:venue/stocks/:stock/orders/:order

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
