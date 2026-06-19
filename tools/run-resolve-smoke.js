// Simple smoke tests for resolveChapterUrl reproduced from www/js/index.js
'use strict';

function resolveChapterUrl(url) {
  try {
    if (
      typeof global.cordova !== 'undefined' &&
      global.cordova.file &&
      global.cordova.file.applicationDirectory
    ) {
      var cleaned = url.replace(/^(\.+\/)*/, '');
      cleaned = cleaned.replace(/^\//, '');
      if (cleaned.indexOf('www/') === 0) cleaned = cleaned.substring(4);
      return global.cordova.file.applicationDirectory + 'www/' + cleaned;
    }
  } catch (e) {
    // ignore
  }
  try {
    // Accessing global.location.href directly mirrors browser behavior;
    // when location is undefined this will throw and be caught below, returning the input URL.
    var base = global.location.href.replace(/\/[^/]*$/, '/');
    return base + url.replace(/^\.\//, '');
  } catch (e) {
    return url;
  }
}

function assertEqual(a, b, msg) {
  if (a !== b) {
    console.error('FAIL:', msg, '\n  expected:', b, '\n  got:     ', a);
    process.exitCode = 1;
  } else {
    console.log('OK:', msg);
  }
}

// Test 1: relative resolution
global.location = { href: 'https://example.com/app/index.html' };
var r1 = resolveChapterUrl('./chapter1/index.html');
assertEqual(
  r1,
  'https://example.com/app/chapter1/index.html',
  'relative path resolves against location',
);

// Test 2: when location absent, return input
delete global.location;
var r2 = resolveChapterUrl('chapter1/index.html');
assertEqual(r2, 'chapter1/index.html', 'returns input when location absent');

// Test 3: cordova resolution
global.cordova = { file: { applicationDirectory: 'file:///android_asset/' } };
var r3 = resolveChapterUrl('www/chapter2/index.html');
assertEqual(
  r3,
  'file:///android_asset/www/chapter2/index.html',
  'cordova applicationDirectory resolution',
);

if (!process.exitCode) console.log('All smoke tests passed');
