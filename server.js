const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const { z } = require("zod");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

const maxRetries = 2;
const userRetries = new Map();

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

  if (intentName === "Default Welcome Intent - yes - yes - yes - yes - next") {
    const NomeContato = req.body.queryResult.parameters["Nome"];
    let CPFContato = req.body.queryResult.parameters["CPF"].toString();

    // Verifica se o CPF tem exatamente 11 dígitos numéricos
    if (CPFContato.length !== 11 || !/^[0-9]+$/.test(CPFContato)) {
      return res.json({
        fulfillmentText:
          "CPF inválido. Deve conter 11 dígitos numéricos. Por favor, tente novamente mais tarde.",
      });
    }

    const cpfSchema = z
      .string()
      .refine(
        (cpf) => !/[a-zA-Z]/.test(cpf),
        "CPF inválido. Não deve conter letras."
      );

    try {
      cpfSchema.parse(CPFContato); // Valida o CPF

      const queryVerificarCPF = `SELECT CPF FROM Usuario WHERE CPF = ?`;

      connection.query(
        queryVerificarCPF,
        [CPFContato],
        function (error, results, fields) {
          if (error) {
            console.error("Erro ao verificar o CPF no banco de dados:", error);
            return res.json({
              fulfillmentText:
                "Erro ao verificar o CPF no banco de dados. Por favor, tente novamente.",
            });
          } else {
            if (results.length > 0) {
              return res.json({
                fulfillmentText:
                  "Tudo certo, para prosseguir digite 3",
              });
            } else {
              const query = `INSERT INTO Usuario (Nome, CPF) VALUES (?, ?)`;

              connection.query(
                query,
                [NomeContato, CPFContato],
                function (error, results, fields) {
                  if (error) {
                    console.error("Erro ao inserir no banco de dados:", error);
                    return res.json({
                      fulfillmentText:
                        "Erro ao cadastrar o usuário. Por favor, tente novamente.",
                    });
                  } else {
                    console.log("Usuário cadastrado com sucesso.");
                    userRetries.delete(NomeContato);
                    return res.json({
                      fulfillmentText:
                        "Usuário cadastrado com sucesso! Vamos prosseguir? \n Digite 3",
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
      console.error("CPF inválido:", error.message);
      return res.json({
        fulfillmentText: `CPF inválido: ${error.message}. Por favor, tente novamente.`,
      });
    }
  }

  
if (intentName === "Visualizar horário de aula") {
  return res.json({
    fulfillmentMessages: [
      {
        text: {
          text: [
            "Segunda - Feira:\n18:50 - 19:40: EMPREENDEDORISMO E MARKETING (SIN8N-S)\n19:40 - 20:30: EMPREENDEDORISMO E MARKETING (SIN8N-S)\n20:30 - 21:20: TÓPICOS ESPECIAIS III (SIN8N-S)\n\nTerça - Feira:\n18:50 - 19:40: GERÊNCIA DE PROJETOS (SIN8N-S)\n19:40 - 20:30: GERÊNCIA DE PROJETOS (SIN8N-S)\n20:40 - 21:30: PROJETO INTEGRADOR VIII (SIN8N-S)\n21:30 - 22:20: PROJETO INTEGRADOR VIII (SIN8N-S)",
          ],
        },
      },
    ],
  });
}

});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
