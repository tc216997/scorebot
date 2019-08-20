require('dotenv').config({path: './.env'});

const Discord = require('discord.js');;
const bot = new Discord.Client();
const gameCenter = require('./gamecenter.js')
const moment = require('moment');
const knexConfig = require('./knexfile.js')
const Knex = require('knex');

//initial knex
const knex = Knex(knexConfig);


let on = true;
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


bot.login(process.env.BOT_TOKEN);


function readDB () {
  let todayDate = moment().utcOffset(-480).format('YYYYMMDD');

  knex('plays')
    .where({published:'false'})
    .then(rows => {
      rows.map(row => {
        console.log(row)
        if (todayDate === row.date) {
          updateDB(row.scoreID)
          queue.push(JSON.stringify(row))
        }
      })
    })
    .catch(e => {
      console.log('problem at readDB query')
      console.log(e)
    })

  if (queue.length > 0) {
    let timer = 0;
    queue = uniq(queue);
    queue.map(item => {
      setTimeout(() => {
        bot.channels.find(val => val.name === process.env.CHANNEL).send(createEmbed(JSON.parse(item)));
      }, timer);
      timer += 1000;
    });
    queue = [];   
  }
}

// if the score were posted, update the value to true
function updateDB(item) {
  knex('plays')
    //find id = item.scoreID
    .where({id:item.scoreID})
    // change published to true
    .update({published:'true'})
    .then( () => {
      console.log('updated published: to true')
    })
    .catch(e => {
      console.log('problem at updateDB')
      console.log(e)
    })
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