/**
 * Copyright (c) 2018 SprintHive (Pty) Ltd (buzz@sprinthive.com)
 *
 * This source code is licensed under the Apache License, Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const {Observable} = require("rxjs");
const {Annotation, Request} = require("zipkin");

const publishOptions = {
  contentType: "application/json"
};

const exchangeName = "zipkin-test-exchange";
const routingKey = "";

const sendMessageToRabbit = (action$, {rabbitConnection$, tracer}) => {
  return action$
    .filter(action => action.type === "SEND_MESSAGE_TO_RABBIT")
    .combineLatest(rabbitConnection$, (action, rabbitConnection) => ({action, rabbitConnection}))
    .do(({action, rabbitConnection}) => {

      tracer.scoped(() => {
        tracer.setId(tracer.createChildId());
        const traceId = tracer.id;
        tracer.recordServiceName("zipkin-rabbit-test");
        tracer.recordBinary('exchange', exchangeName);
        tracer.recordAnnotation(new Annotation.ServerSend());

        const opts = {};
        const zipkinOpts = Request.addZipkinHeaders(opts, traceId);
        console.log("zipkinOpts", zipkinOpts);

        const {payload} = action;
        console.log("Sending message to rabbit", payload);
        const options = {...publishOptions, ...zipkinOpts};
        rabbitConnection.ch.publish(exchangeName, routingKey, new Buffer(JSON.stringify(payload)), options);
      });
    })
    .mergeMap(() => Observable.empty());
};

module.exports = {sendMessageToRabbit};
