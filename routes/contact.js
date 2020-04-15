var express = require('express');
var router = express.Router();

var logger = require('./logger');

router.get('/', function(req, res, next) {
  res.send(logger.getContactMessages());
});

router.post('/', function(req, res, next) {
  res.send(logger.setContactMessage(req.body));
});
module.exports = router;
