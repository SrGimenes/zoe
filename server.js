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

// Importe a função de validação
function validarCPF(agent) {
  const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const userInput = agent.parameters.CPF;

  if (cpfPattern.test(userInput)) {
    return true;
  }
  return false;
}

app.post("/webhook", function (request, response) {
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });

  connection.connect();

  var intentName = request.body.queryResult.intent.displayName;

  if (intentName == "Usuario") {
    console.log("Adicionar Contato");

    // Validação do CPF
    var isCPFValid = validarCPF(request.body.queryResult);

    if (!isCPFValid) {
      response.json({
        fulfillmentText:
          "Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.",
      });
      connection.end(); // Feche a conexão após a resposta.
      return;
    }

    var NomeContato = connection.escape(request.body.queryResult.parameters["Nome"]);
    var CPFContato = connection.escape(request.body.queryResult.parameters["CPF"]);

    var query =
      "INSERT INTO Cadastro (Nome, CPF) VALUES (" + NomeContato + ", " + CPFContato + ")";

    connection.query(query, function (error, results, fields) {
      if (error) {
        console.error("Erro ao inserir no banco de dados:", error);
        response.json({
          fulfillmentText:
            "Erro ao cadastrar o usuário, por favor entre em contato com os desenvolvedores.",
        });
      } else {
        console.log("Usuário cadastrado com sucesso.");
        response.json({ fulfillmentText: "Usuário cadastrado com sucesso!" });
      }
      connection.end(); // Feche a conexão após a execução da consulta.
    });
  }
});


const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
