var concat = require('concat-stream')
var Router = require('routes-router')
var ecstatic = require('ecstatic')
var redis = require('redis')

module.exports = function(opts){

  var port = opts.redis_port || process.env.USE_REDIS_PORT || 6379
  var host = opts.redis_host || process.env.USE_REDIS_HOST || 'redis'

  var client = redis.createClient(port, host, {})
  client.on('error', function(err){
    console.log(err)
    console.log('I am stronger than that!')
  })

  console.log('-------------------------------------------');
  console.log('have host: ' + host)
  console.log('have port: ' + port)

  var router = Router()
  var fileServer = ecstatic({ root: __dirname + '/client' })

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
