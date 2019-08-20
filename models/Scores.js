'use strict';

const { Model } = require('objection');

class Scores extends Model {
  static get tableName() {
    return 'scores'
  }
}

module.exports = Scores;
