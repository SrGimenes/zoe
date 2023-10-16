const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const mysql = require("mysql");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

function validarCPF(agent) {
  const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const userInput = agent.parameters.CPF;

  if (cpfPattern.test(userInput)) {
    agent.add("CPF válido. O que mais posso fazer por você?");
  } else {
    agent.add("Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.");
  }
}

app.post("/webhook", function (request, response) {
  const agent = new WebhookClient({ request, response }); // Crie o objeto WebhookClient

  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });

  connection.connect();

  var intentMap = new Map();
  intentMap.set("Usuario", (agent) => {
    // Validação do CPF
    validarCPF(agent);

    var NomeContato = connection.escape(agent.parameters.Nome);
    var CPFContato = connection.escape(agent.parameters.CPF);

    var query =
      "INSERT INTO Cadastro (Nome, CPF) VALUES (" +
      NomeContato +
      ", " +
      CPFContato +
      ")";

    connection.query(query, function (error, results, fields) {
      if (error) {
        console.error("Erro ao inserir no banco de dados:", error);
        agent.add("Erro ao cadastrar o usuário, por favor entre em contato com os desenvolvedores.");
      } else {
        console.log("Usuário cadastrado com sucesso.");
        agent.add("Usuário cadastrado com sucesso!");
      }

      connection.end(); // Feche a conexão após a execução da consulta.
      agent.handleRequest(intentMap); // Manipule a solicitação com base no intentMap
    });
  });

  // Lide com solicitações que não correspondem a nenhum intent aqui

  agent.handleRequest(intentMap); // Manipule a solicitação com base no intentMap
  
intentMap.set("CapturarCPF", validarCPF);
  
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});


