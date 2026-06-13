const fs = require('fs');
const path = require('path');

// Load the index.js in a JSDOM environment
const script = fs.readFileSync(
  path.join(__dirname, '..', 'www', 'js', 'index.js'),
  'utf8',
);

describe('Theme helpers', () => {
  let exports;

  beforeEach(() => {
    // Reset DOM and localStorage
    document.documentElement.className = '';
    localStorage.clear();

    // Require the browser script as a CommonJS module; it sets module.exports to helpers
    // and uses try/catch around browser-specific APIs so this works under Jest/jsdom
    exports = require('../www/js/index.js');
  });

  afterEach(() => {
    // Unset module.exports to avoid leaking
    try {
      delete module.exports;
    } catch (e) {}
    try {
      delete globalThis.__scicalc_test_helpers__;
    } catch (e) {}
  });

  test('applyTheme adds theme-light class for light theme', () => {
    exports.applyTheme('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(
      true,
    );
  });

  test('applyTheme removes theme-light class for dark theme', () => {
    document.documentElement.classList.add('theme-light');
    exports.applyTheme('dark');
    expect(document.documentElement.classList.contains('theme-light')).toBe(
      false,
    );
  });

  test('getStoredTheme returns null when none set', () => {
    expect(exports.getStoredTheme()).toBeNull();
  });

  test('getStoredTheme returns value when set', () => {
    localStorage.setItem('scicalc_theme', 'light');
    expect(exports.getStoredTheme()).toBe('light');
  });
});
