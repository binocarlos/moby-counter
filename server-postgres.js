var concat = require('concat-stream')
var Router = require('routes-router')
var ecstatic = require('ecstatic')
var postgres = require('postgres')

module.exports = function(opts){

  var port = opts.postgres_port || process.env.USE_POSTGRES_PORT || 6379
  var host = opts.postgres_host || process.env.USE_POSTGRES_HOST || 'postgres'

  var connectionStatus = false

  var client = postgres.createClient(port, host, {})
  client.on('error', function(err){
    connectionStatus = false
    console.log('Error from the postgres connection:')
    console.log(err)
  })
  client.on('end', function(err){
    connectionStatus = false
    console.log('Lost connection to postgres server')
  })
  client.on('ready', function(err){
    connectionStatus = true
    console.log('Connection made to the postgres server')
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
