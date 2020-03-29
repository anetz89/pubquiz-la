var express = require('express');
var router = express.Router();

var logger = require('./logger');
var storage = require('./storage');

router.get('/', function(req, res, next) {
  res.send(storage.get());
});

router.get('/:id', function(req, res, next) {
  res.send(storage.get(req.params.id));
});

router.post('/', function(req, res, next) {
  res.send(storage.push(req.body));
});

router.post('/:id/round/:roundid/updateAnswer/:answerid/:releaseKey', function(req, res, next) {
  res.send(storage.updateRoundAnswer({id: req.params.id }, {
    roundId: parseInt(req.params.roundid),
    answerId: parseInt(req.params.answerid),
    releaseKey: req.params.releaseKey,
    value: req.body.value
  }));
});

router.post('/:id/round/:roundid/blockAnswer/:answerid', function(req, res, next) {
  res.send(storage.blockRoundAnswer({id: req.params.id }, {
    roundId: parseInt(req.params.roundid),
    answerId: parseInt(req.params.answerid)
  }));
});

router.post('/:id/submitRound/:index', function(req, res, next) {
  res.send(storage.submitRound({id: req.params.id }, {
    index: parseInt(req.params.index)
  }));
});

router.post('/:id/validatePassword/', function(req, res, next) {
  res.send(storage.validatePassword({id: req.params.id }, req.body.password));
});

router.post('/:id/setRoundPoints/:index', function(req, res, next) {
  res.send(storage.setRoundPoints({id: req.params.id }, {
    index: parseInt(req.params.index),
    points: req.body.points
  }));
});

router.delete('/:id', function(req, res, next) {
  res.send(storage.deleteTeam({id: req.params.id }));
});

module.exports = router;
