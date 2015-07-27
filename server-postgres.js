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
  var conString = 'postgres://' + user + ":" + password + '@' + host + ':' + port + '/postgres';
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
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
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
      
      client.lrange('whales', 0, -1, function(err, data){
        res.setHeader('Content-type', 'application/json')
        res.end(JSON.stringify(data))
      })
    },
    POST: function (req, res) {
      req.pipe(concat(function(data){
        data = data.toString()

        client.rpush('whales', data, function(){
          client.save(function(){
            res.end('ok')  
          })
        })
        
      }))
    }
  })

  router.addRoute("/*", fileServer)

  return router
}
