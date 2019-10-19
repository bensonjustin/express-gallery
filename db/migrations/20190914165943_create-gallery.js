exports.up = function(knex, Promise) {
  return knex.schema.createTable('gallery', table => {
    table.increments();
    table
      .integer('user_id')
      .references('id')
      .inTable('users');
    table.string('author').notNullable();
    table.string('link').notNullable();
    table.text('description').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('gallery');
};
