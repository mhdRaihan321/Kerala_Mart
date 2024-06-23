const mongoose = require('mongoose');

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const dbname = 'Shopping';
  const url = `mongodb+srv://mhdraihan383:KTif7xvCBa3FM2G9@keralamart.pw7bdim.mongodb.net/${dbname}?retryWrites=true&w=majority`;

  mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true,})
    .then((connection) => {
      state.db = connection;
      done();
    })
    .catch((err) => {
      done(err);
    });
};

module.exports.get = function () {
  return state.db;

};
