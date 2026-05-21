require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/server');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    }).on('error', reject);
  });
}

describe('GET /api/state', () => {
  let server;
  let port;

  before(() => new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  }));

  after(() => new Promise((resolve) => {
    server.close(resolve);
  }));

  it('returns 200 with state object', async () => {
    const { status, body } = await getJSON(`http://localhost:${port}/api/state`);
    assert.equal(status, 200);
    assert.ok(body.state, 'body should have state key');
    assert.equal(typeof body.state, 'object');
  });

  it('state has Fundamentos:1 and Fundamentos:2 keys', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/state`);
    const state = body.state;
    assert.ok('Fundamentos:1' in state, 'state should have Fundamentos:1');
    assert.ok('Fundamentos:2' in state, 'state should have Fundamentos:2');
  });

  it('each value has unlocked, mastered, correct_streak fields', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/state`);
    const state = body.state;
    Object.entries(state).forEach(([key, cell]) => {
      assert.ok('unlocked' in cell, `${key} should have unlocked`);
      assert.ok('mastered' in cell, `${key} should have mastered`);
      assert.ok('correct_streak' in cell, `${key} should have correct_streak`);
    });
  });

  it('state has exactly 17 entries', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/state`);
    const keys = Object.keys(body.state);
    assert.equal(keys.length, 17);
  });
});
