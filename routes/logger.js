var logs = [];

module.exports = {
  log: function(message) {
    logs.unshift({
      time: new Date(),
      message: message
    });
    console.log(message);
  },
  get: function() {
    return logs;
  }
};
