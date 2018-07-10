const {Observable} = require("rxjs");
const {Annotation, TraceId, option} = require("zipkin");

const {Some} = option;

function stringToBoolean(str) {
  return str === '1' || str === 'true';
}

const listForRabbitMessages = (action$, {rabbitConnection$, tracer}) => {
  const exchangeName = "zipkin-test-exchange";
  const queueName = "zipkin-test-queue";

  return rabbitConnection$
    .mergeMap((input) => {
      const {ch} = input;
      const queueOptions = {durable: true};
      return Observable.fromPromise(ch.assertQueue(queueName, queueOptions))
        .mergeMap(() => Observable.fromPromise(ch.bindQueue(queueName, exchangeName, "")))
        .mergeMap(() => Observable.of(input))
    })
    .mergeMap(input => {
      const {ch} = input;

      ch.consume(queueName, msg => {
        const payload = JSON.parse(msg.content.toString());
        const props = msg.properties;
        console.log("Received a message from rabbit", payload);
        console.log("Message properties", props.headers);

        const traceId = props.headers['X-B3-TraceId'];
        if (traceId) {
          tracer.scoped(function () {
            const parentId = props.headers['X-B3-ParentSpanId'];
            const spanId = props.headers['X-B3-SpanId'];
            const sampled = props.headers['X-B3-Sampled'];

            const t = new TraceId({
              traceId: new Some(traceId),
              parentId: new Some(parentId),
              sampled: new Some(stringToBoolean(sampled)),
              spanId
            });

            tracer.setId(t);
            tracer.recordBinary('message', "Got message back from rabbit");
            tracer.recordAnnotation(new Annotation.ServerRecv());
          });
        }

        ch.ack(msg);
      }, {noAck: false});

      return Observable.empty();
    })
};

module.exports = {listForRabbitMessages};