const express = require("express");
const app = express();
const { WebhookClient } = require("dialogflow-fulfillment");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const { z } = require("zod");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
};

const pool = mysql.createPool(dbConfig);

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

const maxRetries = 2;
const userRetries = new Map();

app.post("/webhook", async function (req, res) {
  try {
    const connection = await getConnectionFromPool(pool);
    res.setTimeout(500000, function () {
      console.log("Request has timed out.");
      res.send(408);
    });

    const intentName = req.body.queryResult.intent.displayName;

    if (
      intentName === "Default Welcome Intent - yes - yes - yes - yes - next"
    ) {
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
        cpfSchema.parse(CPFContato); // Validando o CPF

        const queryVerificarCPF = `SELECT CPF FROM Usuario WHERE CPF = ?`;

        const [results] = await connection.execute(queryVerificarCPF, [
          CPFContato,
        ]);

        if (results.length > 0) {
          return res.json({
            fulfillmentText: "Tudo certo, para prosseguir digite 3",
          });
        } else {
          // Evitar SQL Injection, foi desenvolvido para fundamentos academicos
          const query = `INSERT INTO Usuario (Nome, CPF) VALUES (?, ?)`;

          const [insertResult] = await connection.execute(query, [
            NomeContato,
            CPFContato,
          ]);

          console.log("Usuário cadastrado com sucesso.");
          userRetries.delete(NomeContato);
          return res.json({
            fulfillmentText:
              "Usuário cadastrado com sucesso! Vamos prosseguir? \n Digite 3",
          });
        }
      } catch (error) {
        console.error("CPF inválido:", error.message);
        return res.json({
          fulfillmentText: `CPF inválido: ${error.message}. Por favor, tente novamente.`,
        });
      }
    } else if (intentName === "Visualizar horário de aula") {
      const alunoAutenticado = alunoAutenticado;
      // Adicione sua lógica para verificar se o aluno está autenticado de acordo com suas regras, use seu parametro;

      if (alunoAutenticado) {
        const horariosAula = await getHorariosAulaFromDB(connection);
        return res.json({
          fulfillmentText: `Horários de aula:\n${horariosAula}`,
        });
      } else {
        return res.json({
          fulfillmentText:
            "Você precisa estar autenticado para visualizar os horários de aula.",
        });
      }
    }
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    res.json({
      fulfillmentText:
        "Erro ao conectar ao banco de dados. Por favor, tente novamente.",
    });
  }
});

async function getHorariosAulaFromDB(connection) {
  // Evitar SQL Injection, foi desenvolvido para fundamentos academicos
  return new Promise((resolve, reject) => {
    const queryHorariosAula = `
      SELECT DiaSemana, HoraInicio, HoraFim, Disciplina
      FROM HorariosAula
      WHERE AlunoID = ?;
    `;

    // Supondo que você tenha um identificador único para o aluno
    const alunoID = // Obtém o ID do aluno autenticado, use seu parametro;
      connection.query(
        queryHorariosAula,
        [alunoID],
        function (error, results, fields) {
          if (error) {
            reject(error);
          } else {
            const horariosFormatados = results
              .map((row) => {
                return `${row.DiaSemana}:\n${row.HoraInicio} - ${row.HoraFim}: ${row.Disciplina}`;
              })
              .join("\n");

            resolve(horariosFormatados);
          }
        }
      );
  });
}

function getConnectionFromPool(pool) {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
      } else {
        resolve(connection);
      }
    });
  });
}
