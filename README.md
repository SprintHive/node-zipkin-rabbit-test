# Node, Zipkin and Rabbit

The purpose of this project is to find a way to add tracing to a request that 
goes through node express a rabbit queue to another 2 services and then back.


     
     
     -----------------         -----------------       -------------------       -------------------
    |                 |       |                 |     |                   |     |                   |
    |    Service A    |       |    RabbitMQ     |     |  FirstNameService |     |  LastNameService  |
    |                 |       |                 |     |                   |     |                   |
     -----------------         -----------------       -------------------       -------------------
         
## Run the app

    # install the deps
    yarn

    # start the app with node
    node index.js
         
## Zipkin meets Express         
         
 Getting the node express endpoints to send traces to zipkin is pretty straight forward.

```javascript
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
``` 

Here is our helloworld endpoint if you browse to http://localhost:3701/step1 
and then open up the zipkin ui http://localhost:9411, hit the "Find traces" button and you should see some traces 

    # server1.js
    ....
    app.get('/step1', (req, res) => {
      res.send("Hello world!!!")
    });
    ....


[logo]: ./docs/step1.png "Screen shot of step1"

## 
 
 
 ## References 
 
https://www.linkedin.com/pulse/distributed-tracing-nodejs-zipkin-kevin-greene/
https://github.com/openzipkin/zipkin-js
 