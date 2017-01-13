var concat = require('concat-stream')
var Router = require('routes-router')
var ecstatic = require('ecstatic')
var fs = require('fs');

module.exports = function(opts){

  var dataFile = opts.datafile

  var connectionStatus = true


  var router = Router()
  var fileServer = ecstatic({ root: __dirname + '/client' })

  router.addRoute("/*", fileServer)

  return router
}
