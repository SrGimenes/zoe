const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const { z } = require('zod');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true });
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

  const cpfSchema = z.string()
    .refine((cpf) => /^[0-9]{11}$/.test(cpf), {
      message: 'CPF inválido. Deve conter 11 dígitos numéricos.',
    })
    .refine((cpf) => !/[a-zA-Z]/.test(cpf), {
      message: 'CPF inválido. Não deve conter letras.',
    });

  if (intentName === "Default Welcome Intent - yes - yes - yes - yes - next") {
    const NomeContato = req.body.queryResult.parameters["Nome"];
    let CPFContato = req.body.queryResult.parameters["CPF"];

    try {
      cpfSchema.parse(CPFContato); // Valida o CPF

      const queryVerificarCPF = `SELECT CPF FROM Cadastro WHERE CPF = ?`;

      connection.query(
        queryVerificarCPF,
        [CPFContato],
        function (error, results, fields) {
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
              const query = `INSERT INTO Cadastro (Nome, CPF) VALUES (?, ?)`;

              connection.query(
                query,
                [NomeContato, CPFContato],
                function (error, results, fields) {
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
                }
              );
            }
          }
          connection.end();
        }
      );
    } catch (error) {
      console.error('CPF inválido:', error.message);
      return res.json({
        fulfillmentText: `CPF inválido: ${error.message}`,
      });
    }
  }
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});