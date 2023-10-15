const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const mysql = require('mysql');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/Dialogflow", function (request, response) {
  
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB 
  }); 
  connection.connect(); 

  var intentName = request.body.queryResult.intent.displayName;

  if (intentName == 'AddContatos') {
    var NomeContato = request.body.queryResult.parameters['Nome'];
    var CPFContato = request.body.queryResult.parameters['CPF'];
    var query =
      'insert into cadastro values ("'+NomeContato+'","'+CPFContato+'")';

    connection.query(query, function (error, results, fields) {
      if (error) throw error;
      connection.end();
      response.json({ "fulfillmentText": "Cadastro realizado com sucesso" });
    });
  }

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
