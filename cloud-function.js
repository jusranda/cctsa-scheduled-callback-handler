const { CloudTasksClient } = require("@google-cloud/tasks");
const client = new CloudTasksClient();

const PARENT = 'projects/gcp-example/locations/us-central1/queues/scheduled-callback';
const TASK_HANDLER = 'https://hooks.us.webexconnect.io/events/FKUZBGSO2';

exports.scheduledCallbackQueue = async (req, res) => {
  res.set('Access-Control-Allow-Origin', "*")

  // handle preflight requests here
  if (req.method === "OPTIONS") {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.status(204).send('');
  }



  // Check if scheduledTime and timeZone exist in the body of the post
  if (req.body.scheduledTime == '') {
    res.status(400).send('Request missing scheduled time');
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
      url: TASK_HANDLER,
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
  const request = {parent: PARENT, task: task};
  const result = await client.createTask(request);

  // Probably good idea to do some error checking/validation here

  // Return html status and message
  res.status(200).send('task created');
};
