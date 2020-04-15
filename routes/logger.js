var logs = [];
var contactMessages = [];

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
  },
  getContactMessages: function() {
    return contactMessages;
  },
  setContactMessage: function(message) {
    contactMessages.push(message);
    return 'OK';
  }
};
