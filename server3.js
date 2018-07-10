const express = require("express");
const app = express();
const http = require('http').Server(app);
const port = 3703;

const {Tracer, BatchRecorder, jsonEncoder: {JSON_V2}} = require('zipkin');
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

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
  localServiceName: 'service-last-name' // name of this application
});

// Add the Zipkin middleware
app.use(zipkinMiddleware({tracer}));

app.get('/', (req, res) => res.send("Boy"));


const server = http.listen(port, () => {
  const port = server.address().port;
  console.log(`Http server listening at http://localhost:${port}`);
});