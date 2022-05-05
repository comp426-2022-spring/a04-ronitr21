const express = require('express');
const app = express();
const { argv } = require('process');
const db = require('./database.js')
const morgan = require('morgan')
const fs = require('fs')
app.use(express.urlencoded({extended: true}))
app.use(express.json())

// Get Port
const args = require("minimist")(process.argv.slice(2));
var port = args.port || 5555;

// Start an app server
const server = app.listen(port, () => {
  console.log('App listening on port %PORT%'.replace('%PORT%',port));
});


args["debug"] || false
var debug = args.debug
args["log"] || true
var log = args.log
args["help"]

if (args.help === true) {
  console.log(`server.js [options]
  --port	Set the port number for the server to listen on. Must be an integer
              between 1 and 65535.
  --debug	If set to \`true\`, creates endlpoints /app/log/access/ which returns
              a JSON access log from the database and /app/error which throws 
              an error with the message "Error test successful." Defaults to 
              \`false\`.
  --log		If set to false, no log files are written. Defaults to true.
              Logs are always written to database.
  --help	Return this message and exit.`)
  process.exit(0)
}

// Logging to database
if (log === true) {
  // Use morgan for logging to files
  // Create a write stream to append (flags: 'a') to a file
  const accesslog = fs.createWriteStream('access.log', { flags: 'a' })
  // Set up the access logging middleware
  app.use(morgan('accesslog', { stream: accesslog }))
}

// Middleware function
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
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)

  next();
});

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