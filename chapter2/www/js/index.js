/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SciCalcApp — Chapter 2: Developing, Installing         ║
 * ║               and Testing the First App                 ║
 * ║  index.js — build info, self-test suite, console log    ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Chapter 2 teaches:
 *  - Reading runtime build information (platform, version, app ID).
 *  - Verifying the app works correctly through automated self-tests.
 *  - On-screen logging — critical for debugging on physical devices
 *    where you cannot open browser DevTools.
 *  - The full build-run-test cycle:
 *      cordova create → cordova platform add → cordova build → cordova run
 */

'use strict';

/* ── App namespace ───────────────────────────────────────────────────────── */
// All state and helpers live under `app` to avoid polluting global scope.
var app = {

    // ── Chapter 2: On-screen logger ──────────────────────────────────────
    // Mirrors console.log but writes to #console-log so it's visible on
    // a physical device without DevTools open.
    log: function (msg, level) {
        level = level || 'info';

        // Always write to the real console too
        var fn = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[fn]('[SciCalcApp] ' + msg);

        // Write to on-screen panel
        var panel = document.getElementById('console-log');
        if (!panel) return;

        var now = new Date();
        var ts  = now.getHours().toString().padStart(2, '0') + ':' +
                  now.getMinutes().toString().padStart(2, '0') + ':' +
                  now.getSeconds().toString().padStart(2, '0');

        var line = document.createElement('div');
        line.className = 'log-line log-' + level;
        line.innerHTML =
            '<span class="log-ts">' + ts + '</span>' +
            '<span class="log-msg">' + msg + '</span>';

        panel.appendChild(line);
        panel.scrollTop = panel.scrollHeight;
    },

    clearLog: function () {
        var panel = document.getElementById('console-log');
        if (panel) panel.innerHTML = '';
        app.log('Log cleared.');
    },

    // ── Chapter 2: Build information ─────────────────────────────────────
    // Populates the Build Information panel. These are the values you
    // check manually after `cordova build` to confirm the config.xml
    // was picked up correctly.
    populateBuildInfo: function () {
        function set(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        }

        // App ID and name come from config.xml (Cordova exposes them at runtime
        // via the device plugin; we fall back to package constants here).
        set('info-app-id',    'com.example.scicalcapp');
        set('info-app-name',  'SciCalcApp');
        set('info-version',   '1.0.0');

        // Runtime values — available after deviceready
        set('info-platform',  cordova.platformId + ' (' +
                              (cordova.platformId === 'android' ? 'APK build' : 'browser build') + ')');
        set('info-cordova',   cordova.version);
        set('info-screen',    window.screen.width + ' × ' + window.screen.height +
                              ' (ratio ' + (window.devicePixelRatio || 1).toFixed(1) + ')');
        set('info-ua',        navigator.userAgent);

        app.log('Build info populated — platform: ' + cordova.platformId +
                ', cordova: ' + cordova.version);
    },

    // ── Chapter 2: Splash → App transition (from Ch 1) ───────────────────
    showApp: function () {
        var splash = document.getElementById('splash-screen');
        var container = document.getElementById('app-container');

        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(function () { splash.style.display = 'none'; }, 400);
        }
        if (container) {
            container.classList.remove('hidden');
            container.classList.add('fade-in');
        }
    }
};

/* ── Chapter 2: Self-test suite ──────────────────────────────────────────── */
// Each test is an object: { name, run }
// run() returns { pass: bool, detail: string }
//
// These replace the manual verification checklist from Chapter 2:
//   "Verify UI renders, verify calculations correct,
//    verify consistent across platforms"

var TESTS = [

    {
        name: 'deviceready fired',
        run: function () {
            // If we're running tests, deviceready already fired (index.js gated on it).
            return { pass: true, detail: 'cordova.platformId = ' + cordova.platformId };
        }
    },

    {
        name: 'Cordova object accessible',
        run: function () {
            var ok = typeof cordova !== 'undefined' &&
                     typeof cordova.version === 'string' &&
                     cordova.version.length > 0;
            return { pass: ok, detail: ok ? 'version ' + cordova.version : 'cordova undefined' };
        }
    },

    {
        name: 'DOM elements present',
        run: function () {
            var ids = ['splash-screen', 'app-container', 'app-main',
                       'build-info', 'test-results', 'console-log'];
            // Only check ids that actually exist in this chapter's HTML
            var ids2 = ['splash-screen', 'app-container', 'app-main',
                        'info-platform', 'test-results', 'console-log'];
            var missing = ids2.filter(function (id) {
                return !document.getElementById(id);
            });
            return {
                pass: missing.length === 0,
                detail: missing.length === 0
                    ? 'all ' + ids2.length + ' elements found'
                    : 'missing: ' + missing.join(', ')
            };
        }
    },

    {
        name: 'localStorage read/write',
        run: function () {
            try {
                var key = '__ch2_test__';
                localStorage.setItem(key, 'ok');
                var val = localStorage.getItem(key);
                localStorage.removeItem(key);
                return { pass: val === 'ok', detail: val === 'ok' ? 'read/write OK' : 'value mismatch' };
            } catch (e) {
                return { pass: false, detail: e.message };
            }
        }
    },

    {
        name: 'Basic arithmetic accuracy',
        // Chapter 4 will depend on this — confirm JS floating-point is
        // behaving before we trust it for physics calculations.
        run: function () {
            var c  = 299792458;           // speed of light m/s
            var m  = 1;                   // 1 kg
            var e  = m * c * c;           // E = mc²
            var expected = 8.987551787368176e+16;
            var diff = Math.abs(e - expected) / expected;
            var ok = diff < 1e-10;
            return {
                pass: ok,
                detail: 'E(1kg) = ' + e.toExponential(6) + ' J' +
                        (ok ? ' ✓' : ' — diff ' + diff.toExponential(2))
            };
        }
    },

    {
        name: 'CSS custom properties (theme)',
        run: function () {
            var val = getComputedStyle(document.documentElement)
                          .getPropertyValue('--accent').trim();
            return {
                pass: val.length > 0,
                detail: val.length > 0 ? '--accent = ' + val : 'CSS vars not supported'
            };
        }
    },

    {
        name: 'Viewport meta present',
        run: function () {
            var meta = document.querySelector('meta[name="viewport"]');
            return {
                pass: !!meta,
                detail: meta ? meta.getAttribute('content') : 'missing'
            };
        }
    }
];

/**
 * runTests — executes every test and renders results into #test-results.
 * Called on startup and by the Re-run button.
 */
function runTests() {
    var panel = document.getElementById('test-results');
    if (!panel) return;

    panel.innerHTML = '';
    var passed = 0;
    var failed = 0;

    TESTS.forEach(function (test) {
        var result;
        try {
            result = test.run();
        } catch (e) {
            result = { pass: false, detail: 'Exception: ' + e.message };
        }

        if (result.pass) { passed++; } else { failed++; }

        var row = document.createElement('div');
        row.className = 'test-row ' + (result.pass ? 'test-pass' : 'test-fail');
        row.innerHTML =
            '<span class="test-icon">' + (result.pass ? '✓' : '✗') + '</span>' +
            '<span class="test-name">' + test.name + '</span>' +
            '<span class="test-detail">' + result.detail + '</span>';
        panel.appendChild(row);

        app.log((result.pass ? 'PASS' : 'FAIL') + ' — ' + test.name +
                ' — ' + result.detail,
                result.pass ? 'info' : 'error');
    });

    // Summary row
    var summary = document.createElement('div');
    summary.className = 'test-summary ' + (failed === 0 ? 'all-pass' : 'has-fail');
    summary.textContent = passed + ' passed, ' + failed + ' failed';
    panel.appendChild(summary);
}

/* ── Entry point (Chapter 1: deviceready) ────────────────────────────────── */
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Ch 1: flip indicator
    document.getElementById('deviceready').classList.add('ready');

    app.log('deviceready fired — ' + cordova.platformId + ' @ Cordova ' + cordova.version);

    // Ch 2: populate build info, run tests, then reveal app
    app.populateBuildInfo();
    runTests();

    setTimeout(app.showApp, 900);
}
