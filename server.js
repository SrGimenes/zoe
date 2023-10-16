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

app.post("/webhook", function (req, res) {
  res.setTimeout(500000, function () {
    console.log("Request has timed out.");
    res.send(408);
  });

  const agent = new WebhookClient({ request: req, response: res });
  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });

  connection.connect();

  const intentName = req.body.queryResult.intent.displayName;

  function validarCPF(CPFContato) {
    const cpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const userInput = agent.parameters.CPF;
    if (cpf.test(userInput)) {
      return true;
    } else {
      return false;
    }
  }

  module.exports = {
    validarCPF: validarCPF,
  };

  if (intentName === "Usuario") {
    const NomeContato = connection.escape(
      req.body.queryResult.parameters["Nome"]
    );
    const CPFContato = connection.escape(
      req.body.queryResult.parameters["CPF"]
    );

    if (!validarCPF(CPFContato)) {
      agent.add("Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.");
      return res.json({
        fulfillmentText:
          "Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.",
      });
    }

    const queryVerificarCPF = `SELECT CPF FROM Cadastro WHERE CPF = ${CPFContato}`;

    connection.query(queryVerificarCPF, function (error, results, fields) {
      if (error) {
        console.error("Erro ao verificar o CPF no banco de dados:", error);
        return res.json({
          fulfillmentText:
            "Erro ao verificar o CPF, por favor entre em contato com os desenvolvedores.",
        });
      } else {
        if (results.length > 0) {
          return res.json({
            fulfillmentText: "CPF já cadastrado na base de dados.",
          });
        } else {
          const query = `INSERT INTO Cadastro (Nome, CPF) VALUES (${NomeContato}, ${CPFContato})`;

          connection.query(query, function (error, results, fields) {
            if (error) {
              console.error("Erro ao inserir no banco de dados:", error);
              return res.json({
                fulfillmentText:
                  "Erro ao cadastrar o usuário, por favor entre em contato com os desenvolvedores.",
              });
            } else {
              console.log("Usuário cadastrado com sucesso.");
              return res.json({
                fulfillmentText: "Usuário cadastrado com sucesso!",
              });
            }
          });
        }
      }
      connection.end(); // Feche a conexão após a execução da consulta.
    });
  }
  
  let intentMap = new Map();
  intentMap.set('Usuario', validarCPF);
  agent.handleRequest(intentMap);
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
