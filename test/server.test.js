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

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const u = new URL(url);
    options.hostname = u.hostname;
    options.port = u.port;
    options.path = u.pathname;
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('GET /api/glossary', () => {
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

  it('returns term data for order=1', async () => {
    const { status, body } = await getJSON(`http://localhost:${port}/api/glossary?order=1`);
    assert.equal(status, 200);
    assert.ok(body.term, 'body should have term');
    assert.equal(body.pedagogical_order, 1);
  });

  it('returns 404 for out-of-range order', async () => {
    const { status } = await getJSON(`http://localhost:${port}/api/glossary?order=999`);
    assert.equal(status, 404);
  });

  it('returns all required fields', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/glossary?order=25`);
    assert.ok('term' in body);
    assert.ok('english_name' in body);
    assert.ok('abbreviation' in body);
    assert.ok('definition' in body);
    assert.ok('coloquial' in body);
    assert.ok('example' in body);
    assert.ok('layer_id' in body);
    assert.ok('layer_name' in body);
  });
});

describe('GET /api/glossary/layers', () => {
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

  it('returns 16 layers', async () => {
    const { status, body } = await getJSON(`http://localhost:${port}/api/glossary/layers`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 16);
  });

  it('layers have required fields', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/glossary/layers`);
    body.forEach(layer => {
      assert.ok('layer_id' in layer);
      assert.ok('layer_name' in layer);
      assert.ok('first_order' in layer);
    });
  });

  it('layers are ordered by first_order', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/glossary/layers`);
    assert.ok(body[0].first_order < body[1].first_order);
  });
});

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

  it('each cell has lesson_required field', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/state`);
    Object.entries(body.state).forEach(([key, cell]) => {
      assert.ok('lesson_required' in cell, `${key} should have lesson_required`);
    });
  });
});

describe('GET /api/lessons', () => {
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

  it('returns 200 with array of 7 lessons', async () => {
    const { status, body } = await getJSON(`http://localhost:${port}/api/lessons`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 7);
  });

  it('each lesson has required fields', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/lessons`);
    body.forEach(lesson => {
      assert.ok('lesson_id' in lesson);
      assert.ok('title' in lesson);
      assert.ok('control' in lesson);
      assert.ok('nivel' in lesson);
      assert.ok('completed' in lesson);
    });
  });

  it('completed field is boolean', async () => {
    const { body } = await getJSON(`http://localhost:${port}/api/lessons`);
    body.forEach(lesson => {
      assert.equal(typeof lesson.completed, 'boolean');
    });
  });
});

describe('POST /api/lesson/:id/complete', () => {
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

  it('returns 200 on first call', async () => {
    const { status } = await postJSON(`http://localhost:${port}/api/lesson/planicidad/complete`, {});
    assert.equal(status, 200);
  });

  it('returns 200 on second call (idempotent)', async () => {
    const { status } = await postJSON(`http://localhost:${port}/api/lesson/planicidad/complete`, {});
    assert.equal(status, 200);
  });

  it('returns 404 for unknown lesson_id', async () => {
    const { status } = await postJSON(`http://localhost:${port}/api/lesson/inexistente/complete`, {});
    assert.equal(status, 404);
  });
});
