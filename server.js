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

  
  
  function validarCPF(CPFContato){
    const cpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const userInput = agent.parameters.CPF;
  
    if(cpf.test(userInput)){
      agent.add("CPF válido. O que mais posso fazer por você?");
    }else{
      agent.add("Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.");
    }
  }
  


app.post("/webhook", function (request, response) {
  const agent = new WebhookClient({ request, response });
  
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });
  


  connection.connect();

  var intentName = request.body.queryResult.intent.displayName;

  function validarCPF(CPFContato) {
    const cpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const userInput = CPFContato.replace(/[]/g,); // remova as aspas da string

    if (cpf.test(userInput)) {
      return true;
    } else {
      return false;
    }
  }
  
  
  if (intentName == "Usuario") {
    console.log("Adicionar Contato");

    var NomeContato = connection.escape(
      request.body.queryResult.parameters["Nome"]
    );
    var CPFContato = connection.escape(
      request.body.queryResult.parameters["CPF"]
    );

    // Consultar se o CPF já existe na base de dados
    var queryVerificarCPF =
      "SELECT CPF FROM Cadastro WHERE CPF = " + CPFContato;

    connection.query(queryVerificarCPF, function (error, results, fields) {
      
      if(!validarCPF(CPFContato)){
        agent.add("Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.");
        response.json({
          fulfillmentText: "Por favor, insira um CPF válido no formato xxx.xxx.xxx-xx.",
        });
        return;
      }else if (error) {
        console.error("Erro ao verificar o CPF no banco de dados:", error);
        response.json({
          fulfillmentText:
            "Erro ao verificar o CPF, por favor entre em contato com os desenvolvedores.",
        });
      } else {
        if (results.length > 0) {
          // CPF já existe na base de dados, retornar mensagem informando que o CPF já está cadastrado
          response.json({
            fulfillmentText: "CPF já cadastrado na base de dados.",
          });
        } else {
          // CPF não existe na base de dados, continuar com a inserção
          var query =
            "INSERT INTO Cadastro (Nome, CPF) VALUES (" +
            NomeContato +
            ", " +
            CPFContato +
            ")";

          connection.query(query, function (error, results, fields) {
            if (error) {
              console.error("Erro ao inserir no banco de dados:", error);
              response.json({
                fulfillmentText:
                  "Erro ao cadastrar o usuário, por favor entre em contato com os desenvolvedores.",
              });
            } else {
              console.log("Usuário cadastrado com sucesso.");
              response.json({
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
