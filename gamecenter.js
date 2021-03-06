const request = require('request');
const nflGamesUrl = 'http://www.nfl.com/liveupdate/scores/scores.json';
const teams = require('./teams.json');
const sqlite3 = require('sqlite3').verbose();
// initialize db
const db = new sqlite3.Database('./data.db');
const moment = require('moment');
const gameCenter = {}

// create table
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS scores (scoreID INTEGER PRIMARY KEY UNIQUE, date STRING, description STRING, type STRING, team STRING, logo STRING, players STRING, displayed STRING)'
  );
});

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
        let description = scoring[id].desc;
        let type = scoring[id].type;
        let team = ''
        let logo = ''
        if (scoring[id].team === 'LA') {
          team = teams['LAR'].name
          logo = teams['LAR'].logo
        } else {
          team = teams[scoring[id].team].name;
          logo = teams[scoring[id].team].logo;
        }
  
        let players = JSON.stringify(scoring[id].players);
        let displayed = 'false';

        // insert into db
        db.run('INSERT INTO scores VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [gameId+id, gameDate, description, type, team, logo, players, displayed], (err) => {
          if (err && err.code !== 'SQLITE_CONSTRAINT') { console.log(`Error occured in getPlays function ${err}`)} 
        });
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
