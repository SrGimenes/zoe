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

  const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });

  connection.connect();

  const intentName = req.body.queryResult.intent.displayName;

  function formatarCPF(cpf) {
    return cpf
      .replace(/\D/g, "") // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, "$1.$2") // Coloca ponto entre o terceiro e o quarto dígitos
      .replace(/(\d{3})(\d)/, "$1.$2") // Coloca ponto entre o sexto e o sétimo dígitos
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca hífen entre o nono e o décimo primeiro dígitos
  }

  if (intentName === "Usuario") {
    const NomeContato = connection.escape(
      req.body.queryResult.parameters["Nome"]
    );
    let CPFContato = connection.escape(
      req.body.queryResult.parameters["CPF"]
    );

    const CPFFormatado = formatarCPF(CPFContato);

    const queryVerificarCPF = `SELECT CPF FROM Cadastro WHERE CPF = ${CPFFormatado}`;

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
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
