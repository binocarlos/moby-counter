var concat = require('concat-stream')
var Router = require('routes-router')
var ecstatic = require('ecstatic')
var postgres = require('pg')

module.exports = function(opts){

  var port = opts.postgres_port || process.env.USE_POSTGRES_PORT || 5432
  var host = opts.postgres_host || process.env.USE_POSTGRES_HOST || 'postgres'
  var user = opts.postgres_user || process.env.POSTGRES_USER || 'flocker'
  var password = opts.postgres_password || process.env.POSTGRES_PASSWORD || 'flocker'

  var connectionStatus = false
  var now = new Date().getTime();

  // Wait for WeaveDNS to setup DB hostname.
  while(new Date().getTime() < now + 10000){ /* do nothing */ } 

  // XXX: Use `user` and `password` from env.
  var conString = 'postgres://' + 'postgres@' + host + '/postgres' ;
  console.log(conString)

  var client = new postgres.Client(conString);
  client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }

  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
  });

  client.query('CREATE TABLE mywhales (whale text)', function(err, result) {
    if(err) {
      console.log('Error creating whales table:', err);
    }
  });

  });

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

      var select_query = client.query('SELECT * FROM mywhales')
      var array = [];
      select_query.on('row', function(row) {
        console.log('Getting whale "%s"', row.whale);
        array.push(row.whale);
      });

      select_query.on('end', function() {
        console.log('Sending whales "%s"', JSON.stringify(array))
        res.setHeader('Content-type', 'application/json')
        res.end(JSON.stringify(array))
      });
    },

    POST: function (req, res) {
      req.pipe(concat(function(data){
        data = data.toString()

        console.log('Posting whale "%s"', data);
        insert_stmt = 'INSERT INTO mywhales (whale) VALUES ($1)';

        client.query(insert_stmt, [data], function(err, res) {
          if (err) throw err;
        })
        res.end('ok')
        
      }))
    }
  })

  router.addRoute("/*", fileServer)

  return router
}
