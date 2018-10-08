const Discord = require('discord.js');;
const bot = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
const gameCenter = require('./gamecenter.js')
const moment = require('moment');
const configs = require('./config.js');
let on = false;
let queue = [];

bot.on('ready', () => {
  // EST is -5 hours from UTC
  // gametime for tnf is 820 est, snf at 1 est, and monday 815
  // utc time for tnf is 1220 am utc friday, snf games are 5pm utc sunday, monday games are 1215am utc tuesday

                  // start: Friday, 00:20  end = Friday, 04:30
  let tnf = {start:'Friday, 00:20', end:'Friday, 04:30'}
                  //start: Sunday, 1700  end = Monday, 05:00
  let snf = {start:'Sunday, 17:00', end:'Monday, 04:30'}
                  // start: Tuesday, 00:15  end = Tuesday, 04:30
  let mnf = {start:'Tuesday, 00:15', end:'Tuesday, 04:30'}
     
  setInterval(() => {
    let time = moment().utc().format('dddd, HH:mm')
    let onTime = (time === tnf.start) || (time === snf.start) || (time === mnf.start);
    let offTime = (time === tnf.end) || (time === snf.end) || (time === mnf.end);
    if(onTime) {
      on = true;
    }
    if (offTime) {
      on = false;
    }
    if (on) {
      gameCenter.getScores();
    }    
  }, 1000);

  setInterval(() => {
    if (on) {
      readDB();
    }
  }, 1000);
});

//TODO: change this to use configs.token in the future
bot.login(configs.token);


function readDB () {
  let todayDate = moment().utcOffset(-480).format('YYYYMMDD');
  let query = `SELECT * FROM scores WHERE displayed = ?`;
  db.each(query, ['false'], (err, row) => {
    if (err) console.log(err);
    if (row) {   
      if (todayDate == row.date) {
        updateDB(row);
        queue.push(JSON.stringify(row));
      }
    }

  });
  if (queue.length > 0) {
    let timer = 0;
    queue = uniq(queue);
    queue.map(item => {
      setTimeout(() => {
        //TODO: change process.env.channel to configs.channel in the future
        bot.channels.find(val => val.name === configs.channel).send(createEmbed(JSON.parse(item)));
      }, timer);
      timer += 1000;
    });
    queue = [];   
  }
}

function updateDB(item) {
  db.run(`UPDATE scores SET displayed = ? WHERE scoreID = ${item.scoreID}`, ['true'], (err) => {
    if (err) console.log(`Error occured in updateDB function ${err}`)
  });
}

function createEmbed(item) {
  const embed = {
    embed: {
      author: {
        name: `${
          (item.type === 'TD') ? `Touchdown ${item.team}!` : 
          item.type === 'FG' ? `${item.team} Field Goal` : 
          `${item.team} Safety!`
        }`,
        icon_url: item.logo
      },     
      description: `${item.description}`,
      color: 3447003,
    },
  };
  return embed  
}

function uniq(arr) {
  var seen = {};
  return arr.filter((item) => {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}