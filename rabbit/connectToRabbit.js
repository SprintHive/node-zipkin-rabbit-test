/**
 * Copyright (c) 2018 SprintHive (Pty) Ltd (buzz@sprinthive.com)
 *
 * This source code is licensed under the Apache License, Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

require('dotenv').config();
const {Observable} = require("rxjs");
const amqp = require('amqplib');

const rabbitUrl = process.env.RABBIT_URL || 'amqp://user:guest@localhost/';
console.info("Connecting to Rabbit using ", rabbitUrl);

const createChannel = (conn) =>
  Observable.fromPromise(conn.createChannel())
    .mergeMap(ch => Observable.of({conn, ch}));

const rabbitConnection = Observable.fromPromise(amqp.connect(rabbitUrl))
  .mergeMap(createChannel)
  .shareReplay(1);

module.exports = rabbitConnection;
