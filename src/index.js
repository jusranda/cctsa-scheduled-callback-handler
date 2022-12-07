/**
 * Copyright 2022 Justin Randall, Cisco Systems Inc. All Rights Reserved.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const handler = require('./handler');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Parse HTTP request body.
app.use(bodyParser.json()); // application/json
app.use(bodyParser.urlencoded({ extended: true })); // application/x-www-form-urlencoded

// Handle CORS for all domains.
app.use(cors({
    //origin: 'https://desktop.wxcc-us1.cisco.com'
    origin: '*'
}));

// Handle HTTP POST / request.
app.post('/', async (req, res) => {
    await handler.handleFulfillment(req, res);
});

// Create server socket and listen for requests.
const listenPort = parseInt(process.env.PORT) || 8080;
app.listen(listenPort, () => {
    console.log(`cctsa-wxccdemobot-fulfillment: listening on port ${listenPort}`);
});

module.exports = app;
