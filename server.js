const http = require("http");
const { parse } = require("querystring");
const fs = require("fs");

let port = 3002;

let rootDir = "./Notes";

let reqListener = (req, res) => {
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir);
  }
  let body = "";
  req.on("data", chunk => {
    body += chunk;
  });
  req.on("end", () => {
    let { category, note, title } = parse(body);
    let categoryDir = `./Notes/${category.toLowerCase()}`;
    let filePath = `./Notes/${category.toLowerCase()}/${title}.txt`;
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir);
      fs.writeFile(filePath, note, err => {
        if (err) console.log(err);
        console.log(
          `File created with name: ${title.toLowerCase()} and content: ${note} `
        );
      });
    }
    fs.writeFile(filePath, note, err => {
      if (err) console.log(err);
      console.log(
        `File created with name: ${title.toLowerCase()}.txt and content: ${note} `
      );
    });
  });
};
let server = http.createServer(reqListener);

server.listen(port, "localhost", () => {
  console.log(`Server running on port: ${port}`);
});
