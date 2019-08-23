require('dotenv').config();

const request = require('request');
const nflGamesUrl = 'http://www.nfl.com/liveupdate/scores/scores.json';
const teams = require('./teams.json');
const moment = require('moment');
const { Model } = require('objection');
const gameCenter = {}
const knexConfig = require('./knexfile.js')
const Knex = require('knex');
//initial knex
const knex = Knex(knexConfig);
Model.knex(knex)

// one time to get game ids for the week, preferably weds
gameCenter.getScores = () => {

  request(nflGamesUrl, (err, response, json) => {
    if (err) console.log(`Error at getScores function \n${err}`)
    if (response.statusCode === 200 && checkString(json)) {
      let games = JSON.parse(json);
      gameNumbers = Object.keys(games);
      gameNumbers.map(id => {
        let gameDate = id.slice(0, id.length-2);
        let date = moment().utcOffset(-480).format('YYYYMMDD');
        // this ensures only fetch games that are on the same date
        if (gameDate === date) {
          if (games[id].clock !== null && games[id].qtr !== "Pregame") {
            getPlays(id, date);
          }
        }
      });
    }
  });
}

function getPlays(gameId, gameDate) {
  let url = `http://www.nfl.com/liveupdate/game-center/${gameId}/${gameId}_gtd.json`;

  request(url, (err, response, json) => {;
    if (err) console.log(`Error at getPlays function \n${err}`)
    if (response.statusCode === 200 && checkString(json)) {
      let game = JSON.parse(json);
      let scoringIds = Object.keys(game[gameId].scrsummary);
      //scoring id 
      let scoring = game[gameId].scrsummary;
      scoringIds.map(id => {
        let scoreID = gameId + id;
        let obj = {};
        let team = '';
        let teamSymbol = '';
        let logo = '';
        if (scoring[id].team === 'LA') {
          team = teams['LAR'].name
          teamSymbol = 'LAR'
          logo = teams['LAR'].logo
        } else {
          team = teams[scoring[id].team].name;
          teamSymbol = scoring[id].team
          logo = teams[scoring[id].team].logo;
        }
        obj.scoreID = gameId + id;
        obj.date = gameDate;
        obj.description = scoring[id].desc;
        obj.type = scoring[id].type;
        obj.team = team
        obj.teamSymbol = teamSymbol;
        obj.logo = logo
        obj.players = JSON.stringify(scoring[id].players);
        obj.published = 'false';
        
        knex('plays')
          .select()
          .where('scoreID', scoreID)
          .then(rows => {
            if (rows.length === 0) {
              knex('plays')
                .insert(obj)
                .then(() => {
                  //console.log('data inserted!')
                })
            }
          })
          .catch(e => {
            console.log('problem at getPlays insert')
            console.log(e)
          })

      });      
    }
  });

}

function checkString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

module.exports = gameCenter;
