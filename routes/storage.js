const { v4: uuidv4 } = require('uuid');

var logger = require('./logger');
var teams = { };

// forPublic: if true, only public teams are checked
function doesTeamExist(team) {
  if (team.id && teams.hasOwnProperty(team.id)) {
    return {
      exists: true,
      method: 'id',
      isPublic: teams[team.id].isPublic,
      id: team.id
    };
  }
  if (team.id && team.id.indexOf('private') === 0) {
    // private link
    var doesExist = false;
    Object.keys(teams).forEach(function (key) {
      if (teams[key].privateId === team.id) {
        doesExist = {
          exists: true,
          method: 'privateId',
          isPublic: teams[key].isPublic,
          id: key
        };
      }
    });
    if (doesExist) {
      return doesExist;
    }
  }
  if (team.name) {
    var doesExist = false;
    Object.keys(teams).forEach(function (key) {
      if (teams[key].name === team.name) {
        doesExist = {
          exists: true,
          method: 'name',
          isPublic: teams[key].isPublic,
          id: key
        };
      }
    });
    if (doesExist) {
      return doesExist;
    }
  }
  return {
    exists: false
  };
}

function getClearTeam(team, isDetail, isInternal) {
  var result = {
    id: team.id,
    name: team.name,
    points: team.points || 0,
    currentRoundIndex: team.rounds? team.rounds.length - 1 : 0
  };
  if (isDetail) {
    result.rounds = team.rounds;
    if (isInternal) {
      result.currentRound = team.currentRound;
    }
  }
  return result;
}

function getTeamPoints(team) {
  if (!team.rounds || !team.rounds.length) {
    return 0;
  }
  var points = 0;
  team.rounds.forEach(function(round) {
    if (round.points) {  // no need to check 0 here, as it has no effect on overall points
      points += round.points;
    }
  });
  return points;
}

function createRound(index) {
  return {
  	index: index,
    status: 'OPEN',
    // answers: [{value: ''},{value: ''},{value: ''},{value: ''},{value: ''},
    //   {value: ''},{value: ''},{value: ''},{value: ''},{value: ''}]
    answers: [{value: ''},{value: ''}]
  };
}

module.exports = {
  get: function(id) {
    if (id) {
      var existence = doesTeamExist({id: id});
      if (existence.exists) {
        var id = existence.method === 'privateId'? existence.id : id;
        return getClearTeam(teams[id], true, existence.method === 'privateId');
      }
      return 'no team for id ' + id;
    }
    var result = [];
    Object.keys(teams).forEach(function (key) {
      console.log(teams[key]);
      if (!teams[key].isPublic) {
        return;
      }
      result.push(getClearTeam(teams[key]));
    });
    return result;
  },
  push: function(team) {
    var existence = doesTeamExist(team);
    if (existence.exists && existence.isPublic) {
      logger.log('team ' + team.id + ' already exists');
      return 'team already exists';
    }

    var uuid = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    team.id = uuid;
    team.privateId = 'private-' + uuidv4();
    team.rounds = [];

    team.currentRound = createRound(0);
    team.currentRoundIndex = 0;

    teams[uuid] = team;

    return {
      id: uuid,
      privateId: team.privateId
    };
  },
  deleteTeam: function(team) {
    var existence = doesTeamExist(team);
    if (existence.exists) {
      logger.log('delete team ' + team.id);
      delete teams[team.id];
      return 'OK';
    }
    return 'unknown team';
  },
  updateRoundAnswer: function(team, answer) {
    var existence = doesTeamExist(team);
    if (!existence.exists) {
      logger.log('invalid team id to update round ' + team.id);
      return 'invalid team id';
    }

    var team = teams[team.id];
    if (!team.currentRound) {
      return 'invalid round';
    }

    if (team.currentRound.index !== answer.roundId) {
      return 'invalid round';
    }

    var roundAnswer = team.currentRound.answers[answer.answerId];
    if (roundAnswer.blocked && roundAnswer.blocked !== answer.releaseKey) {
      logger.log('answer ' + answer.answerId + ' for round ' + answer.roundId + ' already blocked by anotherone from team ' + team.id);
      return 'answer blocked';
    }
    roundAnswer.value = answer.value;
    roundAnswer.blocked = null;
    return team.currentRound;
  },
  blockRoundAnswer: function(team, answer) {
    var existence = doesTeamExist(team);
    if (!existence.exists) {
      logger.log('invalid team id to update round ' + team.id);
      return {
        status: 'ERROR',
        msg: 'invalid team id'
      };
    }

    var team = teams[team.id];
    if (!team.currentRound) {
      return {
        status: 'ERROR',
        msg: 'invalid round'
      };
    }

    if (team.currentRound.index !== answer.roundId) {
      return {
        status: 'ERROR',
        msg: 'invalid round, got ' + answer.roundId + ', expected ' + team.currentRound.index
      };
    }

    var roundAnswer = team.currentRound.answers[answer.answerId];
    if (roundAnswer.blocked) {
      return {
        status: 'ERROR',
        msg: 'answer already blocked'
      };
    }
    roundAnswer.blocked = uuidv4();
    return {
      status: 'OK',
      blockedId: roundAnswer.blocked
    };
  },
  submitRound: function(team, round) {
    var existence = doesTeamExist(team);
    if (!existence.exists) {
      logger.log('invalid team id to submit round ' + team.id);
      return 'invalid team id';
    }
    var team = teams[team.id];

    if (team.currentRoundIndex !== round.index) {
      logger.log('invalid round index (' + round.index + ') for team ' + team.id + ', expected ' + team.currentRoundIndex);
      return 'invalid round index';
    }
    team.currentRound.status = 'SUBMITTED';

    return team.currentRound;
  },
  setRoundPoints: function(team, round) {
    if (!round.points && round.points !== 0) {
      logger.log('no round points for team ' + team.id);
      return 'no round points';
    }
    var existence = doesTeamExist(team);
    if (!existence.exists) {
      logger.log('invalid team id to set round points ' + team.id);
      return 'invalid team id';
    }
    var team = teams[team.id];

    if (team.currentRoundIndex !== round.index) {
      logger.log('invalid round index (' + round.index + ') for team ' + team.id);
      return 'invalid round index';
    }

    team.currentRound.points = round.points;
    team.currentRound.status = 'FINISHED';
    team.rounds.push(team.currentRound);
    team.currentRound = createRound(team.rounds.length);
    team.currentRoundIndex = team.rounds.length;

    team.points = getTeamPoints(team);

    return 'OK';
  },
  validatePassword: function(team, password) {
    logger.log(team);
    if (!password) {
      logger.log('no password value to test');
      return false;
    }
    var existence = doesTeamExist(team);
    if (!existence.exists) {
      logger.log('invalid team id to validate password: ' + team.id);
      return 'invalid team id';
    }
    return teams[existence.id].password === password;
  }
};
