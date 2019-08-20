
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('scores').del()
    .then(() => {
      return Promise.all([
        knex('scores').insert(
          {
            scoreID: '1',
            date: '091684',
            description: 'td san diego',
            type: 'touchdown',
            team: 'team',
            logo: 'logo',
            players: 'player',
            published: 'false',
          },
          {
            scoreID: '2',
            date: '091684',
            description: 'td san diego',
            type: 'touchdown',
            team: 'team',
            logo: 'logo',
            players: 'player',
            published: 'false',
          }          
        )
      ])
    })
};


        /*
          table.integer('scoreID')
          table.string('date')
          table.string('description')
          table.string('type')
          table.string('team')
          table.string('logo')
          table.string('players')
          table.string('published')
        */