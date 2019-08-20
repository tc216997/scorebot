'use strict';

const { Model } = require('objection');

class Plays extends Model {
  static get tableName() {
    return 'plays'
  }
}

module.exports = Plays;