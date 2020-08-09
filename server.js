const http = require("http");
const path = require("path");
const url = require("url");
const { parse } = require("querystring");
const fs = require("fs");
const readline = require("readline");
const static = require("node-static")
let fileServer = new static.Server("./error")

let port = 3002;

let rootDir = "./Notes";

let reqListener = (req, res) => {
  if (req.method == "POST" && req.url == "/") {
    // check if the root directory does not exist
    if (!fs.existsSync(rootDir)) {
      // if it doesnt make a new one
      fs.mkdirSync(rootDir);
    }
    // initialize a variable to hold the paramenter that will be passed while making the request
    let body = "";
    req.on("data", chunk => {
      // listen for a data event on the request
      body += chunk; // concatenate the chunck returned to the body variable
    });
    req.on("end", () => {
      // listen for an end event on the request
      let { category, note, title } = parse(body); // parse the body and get the deconstruct the object
      let categoryDir = `./Notes/${category.toLowerCase()}`; // create a variable to hold the category directory
      let filePath = `./Notes/${category.toLowerCase()}/${title}.txt`; // create a variable to hold the file path
      if (!fs.existsSync(categoryDir)) {
        // check if the category directory does not exist
        fs.mkdirSync(categoryDir); // if it doesnt create one
      }
      fs.writeFile(filePath, note, err => {
        // create a file and populate it with the note
        if (err) console.log(err);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `File created with <br>name:<b> ${title.toLowerCase()}.txt</b></br>content:<b> ${note}</b>  `
        ); // send the string back to the client.
      });
    });
  } else if (req.method == "GET" && req.url == "/summary") {
    fs.readdir("./Notes", (err, folders) => {
      let data = [];
      if (err) {
        console.log(err);
      } else {
        let notes = {};
        folders.forEach(folder => {
          let folderPath = path.join(__dirname, "Notes", folder);
          notes.folder = folder;

          fs.readdir(folderPath, (err, files) => {
            if (err) {
              console.log(err);
            } else {
              files.forEach(file => {
                let filepath = path.join(__dirname, "Notes", folder, file);
                notes.file = file;
                let lines = [];
                let rl = readline.createInterface({
                  input: fs.createReadStream(filepath)
                });
                rl.on("line", line => {
                  lines.push(line);
                });
                rl.on("close", () => {
                  lines.splice(2).join(",");
                  notes.summary = lines;
                });
              });
            }
          });
          data.push(notes);
        });
        res.end(JSON.stringify({ data }));
      }
    });
  } else if (req.method == "GET") {
    let path = url.parse(req.url, true);
    let filePath = `./Notes${path.pathname}`;
    fs.readFile(filePath, (err, contents) => {
      if (err) console.error(err);
      res.end(contents);
    });
  } else if (req.method == "PUT") {
    let path = url.parse(req.url);
    let pathname = `./Notes${path.pathname}`;
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      let { note } = parse(body);
      fs.readFile(pathname, (err, contents) => {
        if (err) console.error(err);
        let content = `${contents} <br>${note}`;
        fs.writeFile(pathname, content, err => {
          if (err) console.error(err);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content);
        });
      });
    });
  } else if (req.method == "DELETE") {
    let path = url.parse(req.url);
    let pathname = `./Notes${path.pathname}`;
    let pathArr = pathname.split("/");
    let categoryPath = `./Notes/${pathArr[2]}`;

    fs.unlink(pathname, err => {
      if (err) console.error(err);
      fs.readdir(categoryPath, (err, files) => {
        if (files.length == 0) {
          fs.rmdir(categoryPath, err => {
            if (err) console.log(err);
          });
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`${pathArr[3]} successful deleted`);
      });
    });
  }else{
    fileServer.serve(req, res, (e,response)=>{
      fileServer.serveFile("/404.html",404,{},req,res)
    })
  }
};

let server = http.createServer(reqListener); // create server

server.listen(port, "localhost", () => {
  console.log(`Server running on port: ${port}`);
}); // let server listen on specified port of localhost
