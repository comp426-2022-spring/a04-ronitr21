//require express.js
var express = require("express")
var app = express()

// Require minimist
const args = require('minimist')(process.argv.slice(2))

// Require fs
const fs = require('fs')

// Require morgan 
const morgan = require('morgan')

// Require db script file
const db = require('./database.js')

app.use(express.urlencoded({extended:true}));
app.use(express.json());

//creating and starting port
const port = args.port || args.p || 5000
const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
});

// test if its working
app.get("/app/", (req, res, next) => {
    res.json({"message":"The API is working(200)"});
	res.status(200);
});


if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

// the stored help text
const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)

//echos the text
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

//loging the database
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
    next();
})

if (debug === true) {
    // Access log endpoint
    app.get('/app/log/access', (req,res) => {
      const stmt = db.prepare('SELECT * FROM accesslog').all()
      res.status(200).json(stmt)
    })
  
    // Error endpoint
    app.get('/app/error', (req,res) => {
      throw new Error('Error test successful')
    })
  }
  
  app.get('/app/', (req,res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead(res.statusCode, {'Content-Type' : 'text/plain'});
        res.end(res.statusCode+ ' ' +res.statusMessage);
  });
  
  // Endpoint definitions
  app.get('/app/flip', (req,res) => {
    res.contentType('text/json');
    res.status(200).json({'flip' : coinFlip()});
  });
  
  app.get('/app/flips/:number', (req, res) => {
    res.contentType('text/json');
    const flips = coinFlips(req.params.number);
    const count = countFlips(flips);
    res.status(200).json({'raw':flips,'summary' : count});
  });
  
  app.get('/app/flip/call/heads', (req,res) => {
    res.contentType('text/json');
    res.status(200).json(flipACoin('heads'));
  });
  
  app.get('/app/flip/call/tails', (req,res) => {
    res.contentType('text/json');
    res.status(200).json(flipACoin('tails'));
  });
  
  app.use(function(req,res) {
    res.status(404).end('Endpoint does not exist');
    res.type('text/plain');
  });
  
  // Default response for any other request
  app.use(function(req,res){
      res.status(404).send('404 NOT FOUND');
  });

  function coinFlip() {
    let num = Math.random();
  
    if (num < 0.5)
    {
      return "heads";
    }
    else
    {
      return "tails";
    }
  }

function coinFlips(flips) {
let results = new Array(flips);
for (let i = 0; i < flips; i++)
{
    results[i] = coinFlip();
}
return results;
}

function countFlips(array) {
    let headscount = 0;
    let tailscount = 0;
  
    for (let i = 0; i < array.length; i++)
    {
      if (array[i] == "heads")
      {
        headscount++;
      }
      else
      {
        tailscount++;
      }
    }
    
    if (tailscount == 0)
    {
      return {heads: headscount};
    }
    else if (headscount == 0)
    {
      return {tails: tailscount};
    }
    return {heads: headscount, tails: tailscount};
  }

function flipACoin(call) {
const flip = coinFlip();
if (flip == call)
{
    return {call: call, flip: flip, result: "win"};
}
return {call: call, flip: flip, result: "lose"};
}  