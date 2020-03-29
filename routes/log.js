var express = require('express');
var router = express.Router();

var logger = require('./logger');

router.get('/', function(req, res, next) {
  res.send(logger.get());
});

module.exports = router;
