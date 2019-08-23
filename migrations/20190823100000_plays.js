exports.up = function(knex) {
  return Promise.all([
    // create table
    knex.schema.createTable('plays', (table) => {
      table.string('scoreID').primary().unique()
      table.string('date')
      table.string('description')
      table.string('type')
      table.string('team')
      table.string('teamSymbol')
      table.string('logo')
      table.string('players')
      table.string('published')
    })
  ])  
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('plays')
  ])
};