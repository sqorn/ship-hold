const test = require('tape');
const models = require('../../lib/model');

test('query model table', t=> {
  const model = models({table: 'users'});
  const query = model.select().build();
  const expected = 'SELECT * FROM "users"';
  t.equal(query, expected);
  t.end();
});

test('query some fields only', t=> {
  const model = models({table: 'users'});
  const query = model.select('foo', {value: 'bar', as: 'b'}).build();
  const expected = 'SELECT "foo", "bar" AS "b" FROM "users"';
  t.equal(query, expected);
  t.end();
});

test('query with where clause', t=> {
  const model = models({table: 'users'});
  const query = model.select()
    .where('foo', 'bar')
    .and('blah', '<', 'woot')
    .or('what', 'test')
    .build();
  const expected = 'SELECT * FROM "users" WHERE "foo"=\'bar\' AND "blah"<\'woot\' OR "what"=\'test\'';
  t.equal(query, expected);
  t.end();
});

test('insert values as defined by value', t=> {
  const model = models({table: 'users'});
  const query = model.insert()
    .value('foo', 'bar')
    .value('age', 4)
    .build();
  const expected = 'INSERT INTO "users" ("foo", "age") VALUES (\'bar\', \'4\')';
  t.equal(query, expected);
  t.end();
});

test('insert hash map value object', t=> {
  const model = models({table: 'users'});
  const actual = model.insert({foo: 'bar', age: 4})
    .build();
  const expected = 'INSERT INTO "users" ("foo", "age") VALUES (\'bar\', \'4\')';
  t.equal(actual, expected);
  t.end();
});

test('fill with default if not value is provided', t=> {
  const model = models({table: 'users'});
  const query = model.insert()
    .value('foo')
    .value('age', 4)
    .value('bar')
    .build();

  const expected = 'INSERT INTO "users" ("foo", "age", "bar") VALUES (DEFAULT, \'4\', DEFAULT)';
  t.equal(query, expected);
  t.end();
});

test('basic update', t=> {
  const model = models({table: 'users'});
  const actual = model.update()
    .set('foo', 'bar')
    .set('woot', 4)
    .build();

  const expected = 'UPDATE "users" SET "foo"=\'bar\', "woot"=\'4\'';
  t.equal(actual, expected);
  t.end();
});

test('update with map value', t=> {
  const model = models({table: 'users'});
  const actual = model.update()
    .set({
      foo: 'bar',
      woot: 4
    })
    .build();
  const expected = 'UPDATE "users" SET "foo"=\'bar\', "woot"=\'4\'';
  t.equal(actual, expected);
  t.end();
});

test('update with where clause', t=> {
  const model = models({table: 'users'});
  const actual = model.update()
    .set('foo', 'bar')
    .set('woot', 4)
    .where('foo', '<', 'bar')
    .and('woot', 6)
    .build();
  const expected = 'UPDATE "users" SET "foo"=\'bar\', "woot"=\'4\' WHERE "foo"<\'bar\' AND "woot"=\'6\'';
  t.equal(actual, expected);
  t.end();
});

test('basic delete', t=> {
  const model = models({table: 'users'});
  const actual = model.delete()
    .build();
  const expected = 'DELETE FROM "users"';
  t.equal(actual, expected);
  t.end();
});

test('delete with where clause', t=> {
  const model = models({table: 'users'});
  const actual = model.delete()
    .where('foo', '<', 'bar')
    .and('woot', 6)
    .build();
  const expected = 'DELETE FROM "users" WHERE "foo"<\'bar\' AND "woot"=\'6\'';
  t.equal(actual, expected);
  t.end();
});