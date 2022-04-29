var concat = require('concat-stream')
var Router = require('routes-router')
var ecstatic = require('ecstatic')
const { Pool, Query } = require('pg')

module.exports = function(opts){

  console.log('using postgres server')
  var port = opts.postgres_port || process.env.USE_POSTGRES_PORT || 5432
  var host = opts.postgres_host || process.env.USE_POSTGRES_HOST || 'postgres'
  var user = opts.postgres_user || process.env.POSTGRES_USER || 'postgres'
  var password = opts.postgres_password || process.env.POSTGRES_PASSWORD || 'password'

  var connectionStatus = false
  var now = new Date().getTime();
  var connectionAttempts = 0
  var conString = 'postgres://' + user + ':' + password + '@' + host + '/postgres' ;
  console.log(conString)
  var pool

  if(process.env.DELAY_CONNECTION){
    // Wait for WeaveDNS to setup DB hostname.
    while(new Date().getTime() < now + 10000){ /* do nothing */ }   
  }

  function connectToDatabase(){

    pool = new Pool({
      host: host,
      port: port,
      user: user,
      password: password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    if(connectionAttempts>=10){
      console.error('attempted to connect to Postgres 10 times and failed - giving up')
      process.exit(1)
      return
    }

    console.log('connection to Postgres attempt: ' + connectionAttempts)
    pool.connect((err, client, release) => {
      if (err) {
        console.error('connection error', err.stack)
        console.log('waiting 5 seconds before reconnect')
        setTimeout(connectToDatabase, 5000)
        return
      }
      // lets check we can do a basic query
      console.log('checking we can do a basic query on the database')
      client.query('SELECT NOW() AS "theTime"', function(err, result) {
        if(err) {
          return console.error('error running query', err.stack);
        }
        console.log('basic query success: ' + result.rows[0].theTime);
        client.query('CREATE TABLE IF NOT EXISTS mywhales (whale text)', function(err, result) {
          release()
          if(err) {
            console.log('Error creating whales table:', err);
          }
          else{
            console.log('success creating whales table - setting connectionStatus to true')
            connectionStatus = true
          }
        });
      });
     })
  }

  connectToDatabase()

  pool.on('error', err => {
  console.error('something bad has happened! Loggin it', err.stack)
})

  console.log('-------------------------------------------');
  console.log('have host: ' + host)
  console.log('have port: ' + port)

  var router = Router()
  var fileServer = ecstatic({ root: __dirname + '/client' })

  router.addRoute("/v1/ping", {
    GET: function(req, res){
      res.setHeader('Content-type', 'application/json')
      res.end(JSON.stringify({
        connected:connectionStatus
      }))
    }
  })

  router.addRoute("/v1/whales", {
    GET: function (req, res) {
      
      console.log('Getting whales');
      var array = [];

      pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }
        client.query('SELECT * FROM mywhales', (err, result) => {
          release()
          if (err) {
            return console.error('Error executing query', err.stack)
          }
          console.log(result.rows)
          result.rows.forEach(function(row) {
            console.log('Getting whale "%s"', row.whale);
            array.push(row.whale);
          })
          console.log('query done')
          console.log('Sending whales "%s"', JSON.stringify(array))
          res.setHeader('Content-type', 'application/json')
          res.end(JSON.stringify(array))
        })
      })
    },

    POST: function (req, res) {
      req.pipe(concat(function(data){
        data = data.toString()

        console.log('Posting whale "%s"', data);
        insert_stmt = 'INSERT INTO mywhales (whale) VALUES ($1)';

        pool.connect((err, client, release) => {
          if (err) {
            return console.error('Error acquiring client', err.stack)
          }
          client.query(insert_stmt, [data], (err, result) => {
            release()
            if (err) {
              return console.error('Error executing query', err.stack)
            }
            res.end('ok')
          })
        })
      }))
    }
  })

  router.addRoute("/*", fileServer)

  return router
}
