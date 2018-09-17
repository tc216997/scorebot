const request = require('request');
const nflGamesUrl = 'http://www.nfl.com/liveupdate/scores/scores.json';
const teams = require('./teams.json');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
const gameCenter = {}

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS scores (scoreID INTEGER PRIMARY KEY UNIQUE, description STRING, type STRING, team STRING, logo STRING, players STRING, displayed STRING)'
  );
});

// one time to get game ids for the week, preferably weds
gameCenter.getScores = () => {

  request(nflGamesUrl, (err, response, json) => {
    if (err) console.log(`Error at getScores function \n${err}`)
    if (response.statusCode === 200 && checkString(json)) {
      let games = JSON.parse(json);
      let timer = 0;
      gameNumbers = Object.keys(games);
      gameNumbers.map(id => {
        if (games[id].clock !== null && games[id].qtr !== "Pregame") {
          getPlays(id);
        }
      });
    }
  });

}

function getPlays(gameId) {
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
        let displayed = 'false'
        db.run('INSERT INTO scores VALUES (?, ?, ?, ?, ?, ?, ?)', [gameId+id, description, type, team, logo, players, displayed], (err) => {
          if (err && err.code !== 'SQLITE_CONSTRAINT') { console.log(err)} 
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
