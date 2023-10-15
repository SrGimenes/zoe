const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});
app.post("/WEBHOOK", function (request, response) {
  const agent = new WebhookClient({ request: request, response: response });

  let intentMap = new Map();
  intentMap.set("Teste", FUNCTION);
  agent.handleRequest(intentMap);

  function FUNCTION(agent) {
    agent.add("Isso é um teste");
  }
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
