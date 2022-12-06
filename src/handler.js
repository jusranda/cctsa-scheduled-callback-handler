/**
 * Copyright 2022 David Finnegan, Justin Randall, Cisco Systems Inc. All Rights Reserved.
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
'use strict';

////////////////////////////////
// Imports and Initialization //
////////////////////////////////

const { CloudTasksClient } = require("@google-cloud/tasks");
const client = new CloudTasksClient();

const GCP_CLOUD_TASKS_QUEUE = process.env.GCP_CLOUD_TASKS_QUEUE;
const WXCXT_TASK_HANDLER_URL = process.env.WXCXT_TASK_HANDLER_URL;
 
/**
 * Entry point for WxCC Agent Desktop Voice Trigger Action Handler.
 * 
 * @param {Object} req  The HTTP request.
 * @param {Object} res  The HTTP response.
 */
async function handleFulfillment (req, res) {
    if (GCP_CLOUD_TASKS_QUEUE == undefined) {
        console.log('application initialization error: Missing GCP_CLOUD_TASKS_QUEUE environment variable');
        res.status(500).send('application intialization failure');
        return;
    }
    console.log(`GCP_CLOUD_TASKS_QUEUE: ${GCP_CLOUD_TASKS_QUEUE}`);

    if (WXCXT_TASK_HANDLER_URL == undefined) {
        console.log('application initialization error: Missing WXCXT_TASK_HANDLER_URL environment variable');
        res.status(500).send('application intialization failure');
        return;
    }
    console.log(`WXCXT_TASK_HANDLER_URL: ${WXCXT_TASK_HANDLER_URL}`);

    res.set('Access-Control-Allow-Origin', "*")

    // handle preflight requests here
    if (req.method === "OPTIONS") {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
        res.status(204).send('');
        return;
    }
  
    // Check if scheduledTime and timeZone exist in the body of the post
    if (req.body.scheduledTime == '') {
        res.status(400).send('Request missing scheduled time');
        return;
    }
    
    // if (!req.body.timeZone == '') {
    //   res.status(400).send('Request missing time zone');
    // }
  
    // Create an ISO 8601 formated time string
    const ISOtimeString = `${req.body.scheduledTime}:00.000-05:00`;
    const scheduledTimeEpoch = Date.parse(ISOtimeString);
  
    // Create a Cloud Task object
    const task = {
        httpRequest: {
            httpMethod: "POST",
            url: WXCXT_TASK_HANDLER_URL,
            headers: { "Content-Type": "application/json" }
        },
    };
  
    // Add a payload to the task
    const payload = {
        queueId: req.body.interaction.callProcessingDetails.QueueId,
        callbackNumber: req.body.interaction.callProcessingDetails.ani
    };
    console.log('payload:', payload);
    console.log('res.body:', res.body);
    task.httpRequest.body = Buffer.from(JSON.stringify(payload)).toString("base64");
  
    // Set execution time for task in epoch seconds
    task.scheduleTime = {seconds: scheduledTimeEpoch / 1000};
  
    // Submit create cloud task request
    const request = {parent: GCP_CLOUD_TASKS_QUEUE, task: task};
    const result = await client.createTask(request);
  
    // Probably good idea to do some error checking/validation here
  
    // Return html status and message
    res.status(200).send('task created');
    return;
}

module.exports = {handleFulfillment};
