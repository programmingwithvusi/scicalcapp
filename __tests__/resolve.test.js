const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(
  path.join(__dirname, '..', 'www', 'js', 'index.js'),
  'utf8',
);

describe('resolveChapterUrl', () => {
  let exports;

  beforeEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
    // Provide a fake location for relative resolution
    delete global.location;
    global.location = { href: 'https://example.com/app/index.html' };

    // Simulate non-Cordova environment
    delete global.cordova;

    // Require the browser script as a CommonJS module; it sets module.exports to helpers
    exports = require('../www/js/index.js');
  });

  afterEach(() => {
    try {
      delete module.exports;
    } catch (e) {}
    try {
      delete globalThis.__scicalc_test_helpers__;
    } catch (e) {}
  });

  test('resolves relative path against location base', () => {
    const resolved = exports.resolveChapterUrl('./chapter1/index.html');
    expect(resolved).toBe('https://example.com/app/' + 'chapter1/index.html');
  });

  test('returns input when location absent', () => {
    delete global.location;
    const resolved = exports.resolveChapterUrl('chapter1/index.html');
    expect(resolved).toBe('chapter1/index.html');
  });

  test('resolves cordova applicationDirectory when cordova present', () => {
    global.cordova = {
      file: { applicationDirectory: 'file:///android_asset/' },
    };
    const resolved = exports.resolveChapterUrl('www/chapter2/index.html');
    expect(resolved).toBe('file:///android_asset/www/chapter2/index.html');
  });
});
