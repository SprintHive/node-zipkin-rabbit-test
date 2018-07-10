const express = require("express");
const app = express();
const http = require('http').Server(app);
const port = 3701;

// Setup the zipkin tracer to connect to a local instance of zipkin
const {Tracer, BatchRecorder, jsonEncoder: {JSON_V2}} = require('zipkin');
const CLSContext = require('zipkin-context-cls');
const {HttpLogger} = require('zipkin-transport-http');

const tracer = new Tracer({
  ctxImpl: new CLSContext('zipkin'),
  recorder: new BatchRecorder({
    logger: new HttpLogger({
      endpoint: 'http://localhost:9411/api/v2/spans',
      jsonEncoder: JSON_V2
    })
  }),
  localServiceName: 'service-a' // name of this application
});

// Use the tracer to configure the express middleware
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
app.use(zipkinMiddleware({tracer}));

// wrap node-fetch so that all our calls to downstream services are also logged.
const fetch = require('node-fetch');
const wrapFetch = require('zipkin-instrumentation-fetch');
const zipkinFetch = wrapFetch(fetch, {
  tracer,
  serviceName: 'service-a'
});

const {Subject} = require("rxjs");
const {sendMessageToRabbit} = require("./rabbit/messageProducer");
const {listForRabbitMessages} = require("./rabbit/messageConsumer");
const rabbitConnection$ = require("./rabbit/connectToRabbit");
const state = {tracerMap: {}};
const action$ = new Subject();

listForRabbitMessages(action$, {rabbitConnection$, tracer, state})
.subscribe(
  ans => console.log(ans),
  err => console.error("Something went wrong", err),
  () => console.log("Consumer is setup and ready"));

sendMessageToRabbit(action$, {rabbitConnection$, tracer, state})
  .subscribe(
    ans => console.log(ans),
    err => console.error("Something went wrong", err),
    () => console.log("complete this should never happen"));

app.get('/step1', (req, res) => {
  res.send("Hello world!!!")
});

app.get('/step2', (req, res) => {
  action$.next({type: "SEND_MESSAGE_TO_RABBIT", payload: {message: "Jon here"}});

  Promise.all([
    zipkinFetch('http://localhost:3702'),
    zipkinFetch('http://localhost:3703')
  ])
    .then(([first, last]) => {
      return Promise.all([
        first.text(),
        last.text()
      ]);
    })
    .then(([first, last]) => {
      res.send(`${first} ${last}`);
    })
    .catch(err => res.sendStatus(500));
});


const server = http.listen(port, () => {
  const port = server.address().port;
  console.log(`Http server listening at http://localhost:${port}`);
});