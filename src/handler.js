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
    try {
        if (GCP_CLOUD_TASKS_QUEUE == undefined) {
            console.error('application initialization error: Missing GCP_CLOUD_TASKS_QUEUE environment variable');
            res.status(500).send({ "retval": -1, "retmsg": "application intialization failure" });
            return;
        }
        //console.debug(`GCP_CLOUD_TASKS_QUEUE: ${GCP_CLOUD_TASKS_QUEUE}`);
    
        if (WXCXT_TASK_HANDLER_URL == undefined) {
            console.error('application initialization error: Missing WXCXT_TASK_HANDLER_URL environment variable');
            res.status(500).send({ "retval": -1, "retmsg": "application intialization failure" });
            return;
        }
        //console.debug(`WXCXT_TASK_HANDLER_URL: ${WXCXT_TASK_HANDLER_URL}`);
    
        // handle preflight requests here
        if (req.method === "OPTIONS") {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
            res.status(204).send({ "retval": 0, "retmsg": "OPTIONS processed." });
            return;
        }
      
        // Check for missing parameters.
        if (req.body.scheduledTime == '') {
            console.error('Missing body parameter: scheduledTime is missing.');
            res.status(400).send({ "retval": 1, "retmsg": "Invalid parameters" });
            return;
        }
        if (req.body.interaction.callProcessingDetails.QueueId == '') {
            console.error('Missing body parameter: interaction.callProcessingDetails.QueueId is missing.');
            res.status(400).send({ "retval": 1, "retmsg": "Invalid parameters" });
            return;
        }
        if (req.body.interaction.callProcessingDetails.ani == '') {
            console.error('Missing body parameter: interaction.callProcessingDetails.ani is missing.');
            res.status(400).send({ "retval": 1, "retmsg": "Invalid parameters" });
            return;
        }
      
        // Introduce a fake error for testing.

        if (req.body.scheduledTime.includes('2022-12-08')) {
            console.error('Bad date value: 2022-12-08 is forbidden.');
            res.status(400).send({ "retval": 1, "retmsg": "Forbidden date" });
            return;
        }

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
        console.log('req.body:', JSON.stringify(req.body));
        task.httpRequest.body = Buffer.from(JSON.stringify(payload)).toString("base64");
      
        // Set execution time for task in epoch seconds
        task.scheduleTime = {seconds: scheduledTimeEpoch / 1000};
      
        // Submit create cloud task request
        const request = {parent: GCP_CLOUD_TASKS_QUEUE, task: task};
        const result = await client.createTask(request);
      
        console.log('createTask: '+JSON.stringify(result));

        if (result == undefined || result.length === 0) {
            console.error('Failed to create task.');
            res.status(500).send({ "retval": 2, "retmsg": "Failed to create task." });
            return;
        }
      
        // Return html status and message
        res.status(200).send({ "retval": 0, "retmsg": "Task created successfully." });
        return;
    } catch (err) {
        console.error('Unhandled error: '+err.stack);
        res.status(500).send({ "retval": -1, "retmsg": "Unhandled error: "+err.message });
        return;
    }
    
}

module.exports = {handleFulfillment};
