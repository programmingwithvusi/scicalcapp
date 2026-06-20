/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SciCalcApp — Chapter 5: A Menu-Driven App to Monitor   ║
 * ║               Important Indicators                      ║
 * ║  index.js — main menu, system monitor, experiment log   ║
 * ║             viewer, about, Cordova plugin integration   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Chapter 5 teaches:
 *  - Menu-driven architecture: main menu → section → sub-menu → indicator.
 *  - Cordova plugin integration: battery-status, network-information.
 *  - Reading and rendering persisted data (experiment log from Ch 4).
 *  - Dynamic header with back navigation.
 *  - Structuring a multi-screen app without a framework.
 */

'use strict';

/* ── Constants (Ch 4, unchanged) ────────────────────────────────────────── */
var C         = 299792458;
var J_PER_CAL = 4.184;
var J_PER_KWH = 3600000;
var J_PER_WH  = 3600;

/* ── Storage keys ────────────────────────────────────────────────────────── */
var STORE   = 'scicalc_ch3_';
var LOG_KEY = 'scicalc_log';

/* ══════════════════════════════════════════════════════════════════════════
   Ch 4: Physics algorithms (pure functions, unchanged)
   ══════════════════════════════════════════════════════════════════════════ */
var physics = {
    massEnergy: function (mass) {
        var j = mass * C * C;
        return { joules: j, calories: j / J_PER_CAL, kwh: j / J_PER_KWH };
    },
    kineticEnergy: function (mass, velocity) {
        var j = 0.5 * mass * velocity * velocity;
        return { joules: j, kj: j / 1000, wh: j / J_PER_WH };
    },
    heatEnergy: function (mass, cp, dt) {
        var j = mass * cp * dt;
        return {
            joules: j, calories: j / J_PER_CAL, kj: j / 1000,
            direction: j > 0 ? '🔺 Heating (energy absorbed)'
                              : '🔻 Cooling (energy released)'
        };
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   Ch 4: Number formatter (unchanged)
   ══════════════════════════════════════════════════════════════════════════ */
var fmt = {
    energy: function (value) {
        if (value === 0) return '0';
        var abs  = Math.abs(value);
        var sign = value < 0 ? '−' : '';
        if (abs < 0.001 || abs >= 1e6) {
            return sign + abs.toExponential(4)
                .replace('e+', ' × 10^').replace('e-', ' × 10^−');
        }
        return sign + abs.toFixed(4).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },
    summary: function (value, unit) {
        if (value === 0) return '0 ' + unit;
        return value.toExponential(3) + ' ' + unit;
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   Ch 4: Experiment log (read + write, unchanged)
   ══════════════════════════════════════════════════════════════════════════ */
var expLog = {
    load: function () {
        try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
        catch (e) { return []; }
    },
    save: function (entries) {
        localStorage.setItem(LOG_KEY, JSON.stringify(entries));
    },
    add: function (formula, inputs, result, full) {
        var entries = expLog.load();
        entries.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            formula: formula, inputs: inputs,
            result: result, full: full
        });
        if (entries.length > 50) entries = entries.slice(0, 50);
        expLog.save(entries);
    }
};

/* ══════════════════════════════════════════════════════════════════════════
   APP NAMESPACE
   ══════════════════════════════════════════════════════════════════════════ */
var app = {

    /* ── Ch 1 & 2 ───────────────────────────────────────────────────────── */
    log: function (msg, level) {
        level = level || 'info';
        console[level === 'error' ? 'error' : 'log']('[SciCalcApp] ' + msg);
    },

    showApp: function () {
        var splash    = document.getElementById('splash-screen');
        var container = document.getElementById('app-container');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(function () { splash.style.display = 'none'; }, 400);
        }
        if (container) {
            container.classList.remove('hidden');
            container.classList.add('fade-in');
        }
    },

    populateBuildInfo: function () { /* retained for dev-info panel */ },

    /* ══════════════════════════════════════════════════════════════════════
       CHAPTER 5 — Screen / menu navigation
       Architecture: one active "screen" at a time.
       screen-menu is the root; all others are children.
       goBack() always returns to menu (flat navigation suits mobile).
       ══════════════════════════════════════════════════════════════════════ */
    currentScreen: 'menu',

    // Screen metadata: icon and title shown in the app header
    screenMeta: {
        menu:    { icon: '⚗️',  title: 'SciCalcApp',      back: false },
        calc:    { icon: '🔬',  title: 'Calculator',       back: true  },
        monitor: { icon: '📊',  title: 'System Monitor',   back: true  },
        log:     { icon: '📋',  title: 'Experiment Log',   back: true  },
        about:   { icon: 'ℹ️',  title: 'About',            back: true  }
    },

    showScreen: function (id) {
        // Hide all screens
        var screens = document.querySelectorAll('.screen');
        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.add('hidden');
        }

        // Show target screen
        var target = document.getElementById('screen-' + id);
        if (target) {
            target.classList.remove('hidden');
            target.classList.remove('screen-slide');
            void target.offsetWidth;
            target.classList.add('screen-slide');
        }

        // Update header
        var meta  = app.screenMeta[id] || app.screenMeta.menu;
        var back  = document.getElementById('header-back');
        var icon  = document.getElementById('header-icon');
        var title = document.getElementById('header-title');

        if (back)  { meta.back ? back.classList.remove('hidden')
                               : back.classList.add('hidden'); }
        if (icon)  icon.textContent  = meta.icon;
        if (title) title.textContent = meta.title;

        app.currentScreen = id;
        app.log('Screen: ' + id);

        // Run screen-specific init
        if (id === 'monitor') app.initMonitor();
        if (id === 'log')     app.renderLog();
        if (id === 'calc')    app.restoreActiveTab();
    },

    goBack: function () {
        app.showScreen('menu');
    },

    /* ══════════════════════════════════════════════════════════════════════
       CHAPTER 5 — System Monitor
       Sub-screens: battery, network, device
       ══════════════════════════════════════════════════════════════════════ */
    currentMonitor: 'battery',

    switchMonitor: function (id) {
        ['battery', 'network', 'device'].forEach(function (m) {
            var panel = document.getElementById('monitor-' + m);
            var tab   = document.getElementById('mon-tab-' + m);
            if (panel) panel.classList.add('hidden');
            if (tab)   tab.classList.remove('active');
        });
        var panel = document.getElementById('monitor-' + id);
        var tab   = document.getElementById('mon-tab-' + id);
        if (panel) panel.classList.remove('hidden');
        if (tab)   tab.classList.add('active');
        app.currentMonitor = id;

        if (id === 'battery') app.refreshBattery();
        if (id === 'network') app.refreshNetwork();
        if (id === 'device')  app.refreshDevice();
    },

    initMonitor: function () {
        app.switchMonitor(app.currentMonitor);
    },

    // ── Battery indicator ─────────────────────────────────────────────────
    // Uses cordova-plugin-battery-status if available.
    // Falls back to graceful "not available" message in browser.
    refreshBattery: function () {
        app.log('Refreshing battery…');

        // Plugin available (on device after cordova plugin add)
        if (navigator.getBattery) {
            navigator.getBattery().then(function (battery) {
                app._renderBattery(
                    Math.round(battery.level * 100),
                    battery.charging
                );
            }).catch(function () {
                app._renderBatteryUnavailable();
            });
            return;
        }

        // Cordova battery-status plugin fires events — listen once
        // (event was registered in onDeviceReady)
        app._renderBatteryUnavailable();
    },

    _renderBattery: function (level, charging) {
        var bar      = document.getElementById('battery-bar');
        var levelEl  = document.getElementById('bat-level');
        var chargEl  = document.getElementById('bat-charging');
        var statusEl = document.getElementById('bat-status');

        if (bar)      bar.style.width = level + '%';
        if (levelEl)  levelEl.textContent  = level + '%';
        if (chargEl)  chargEl.textContent  = charging ? '⚡ Yes' : 'No';

        var status = level >= 80 ? '🟢 Good'
                   : level >= 30 ? '🟡 Moderate'
                   : '🔴 Low — charge soon';
        if (statusEl) statusEl.textContent = status;

        // Colour the bar based on level
        if (bar) {
            bar.className = 'battery-bar';
            bar.classList.add(level >= 50 ? 'bar-good'
                            : level >= 20 ? 'bar-warn' : 'bar-crit');
        }
        app.log('Battery: ' + level + '%, charging: ' + charging);
    },

    _renderBatteryUnavailable: function () {
        var levelEl  = document.getElementById('bat-level');
        var chargEl  = document.getElementById('bat-charging');
        var statusEl = document.getElementById('bat-status');
        if (levelEl)  levelEl.textContent  = 'N/A (browser)';
        if (chargEl)  chargEl.textContent  = 'N/A (browser)';
        if (statusEl) statusEl.textContent = 'Run on device for live data';
    },

    // ── Network indicator ─────────────────────────────────────────────────
    refreshNetwork: function () {
        var typeEl   = document.getElementById('net-type');
        var onlineEl = document.getElementById('net-online');
        var navEl    = document.getElementById('net-navigator');

        // cordova-plugin-network-information exposes Connection object
        var connType = (typeof Connection !== 'undefined' && navigator.connection)
            ? navigator.connection.type : null;

        var typeStr = connType ? connType : 'N/A (browser — run on device)';

        if (typeEl)   typeEl.textContent   = typeStr;
        if (onlineEl) onlineEl.textContent =
            navigator.onLine ? '🟢 Online' : '🔴 Offline';
        if (navEl)    navEl.textContent    =
            navigator.onLine ? 'true' : 'false';

        app.log('Network: ' + typeStr + ', online: ' + navigator.onLine);
    },

    // ── Device indicator ──────────────────────────────────────────────────
    refreshDevice: function () {
        function set(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        }
        set('dev-platform', cordova.platformId + ' @ Cordova ' + cordova.version);
        set('dev-cordova',  cordova.version);
        set('dev-screen',   window.screen.width + ' × ' + window.screen.height + ' px');
        set('dev-dpr',      (window.devicePixelRatio || 1).toFixed(2) + '×');
        set('dev-lang',     navigator.language || navigator.userLanguage);
        set('dev-ua',       navigator.userAgent);
    },

    /* ══════════════════════════════════════════════════════════════════════
       CHAPTER 5 — Experiment Log Viewer
       Reads the JSON array written by Ch 4's expLog.add().
       Renders each entry as a card with timestamp, formula, inputs, result.
       ══════════════════════════════════════════════════════════════════════ */
    renderLog: function () {
        var container = document.getElementById('log-entries');
        var countEl   = document.getElementById('log-count');
        var entries   = expLog.load();

        if (countEl) {
            countEl.textContent = entries.length + ' entr' +
                                  (entries.length === 1 ? 'y' : 'ies');
        }

        if (!container) return;

        if (entries.length === 0) {
            container.innerHTML =
                '<div class="empty-note">No saved calculations yet.<br>' +
                'Run a calculation and tap 💾 Save to Log.</div>';
            return;
        }

        container.innerHTML = '';
        entries.forEach(function (entry, i) {
            var card = document.createElement('div');
            card.className = 'log-card';
            card.style.animationDelay = (i * 0.04) + 's';
            card.innerHTML =
                '<div class="log-card-header">' +
                    '<span class="log-formula">' + entry.formula + '</span>' +
                    '<span class="log-ts">'      + entry.timestamp + '</span>' +
                '</div>' +
                '<div class="log-card-body">' +
                    '<div class="log-row">' +
                        '<span class="log-label">Inputs</span>' +
                        '<span class="log-val">'  + entry.inputs + '</span>' +
                    '</div>' +
                    '<div class="log-row">' +
                        '<span class="log-label">Result</span>' +
                        '<span class="log-val result-val">' + entry.result + '</span>' +
                    '</div>' +
                '</div>';
            container.appendChild(card);
        });

        app.log('Rendered ' + entries.length + ' log entries');
    },

    clearLog: function () {
        if (!confirm('Clear all experiment log entries?')) return;
        localStorage.removeItem(LOG_KEY);
        app.renderLog();
        app.log('Experiment log cleared');
    },

    /* ── Ch 3: Tab navigation (calculator sub-menu) ─────────────────────── */
    activeTab: 'me',

    switchTab: function (id) {
        ['me', 'ke', 'ht'].forEach(function (t) {
            var panel = document.getElementById('panel-' + t);
            var tab   = document.getElementById('tab-' + t);
            if (panel) panel.classList.add('hidden');
            if (tab)   tab.classList.remove('active');
        });
        var panel = document.getElementById('panel-' + id);
        var tab   = document.getElementById('tab-' + id);
        if (panel) panel.classList.remove('hidden');
        if (tab)   tab.classList.add('active');
        app.activeTab = id;
        localStorage.setItem(STORE + 'activeTab', id);
    },

    restoreActiveTab: function () {
        app.switchTab(localStorage.getItem(STORE + 'activeTab') || 'me');
    },

    /* ── Ch 3: localStorage persistence ─────────────────────────────────── */
    saveInput: function (formId) {
        localStorage.setItem(STORE + formId,
            JSON.stringify(app.readRawInputs(formId)));
    },

    restoreInputs: function (formId) {
        var raw = localStorage.getItem(STORE + formId);
        if (!raw) return;
        try {
            var data = JSON.parse(raw);
            Object.keys(data).forEach(function (key) {
                var el = document.getElementById(key);
                if (el) el.value = data[key];
            });
            if (formId === 'ke') app.syncSliderFromInput();
            if (formId === 'ht' && data['ht-material']) {
                var sel = document.getElementById('ht-material');
                if (sel) sel.value = data['ht-material'];
            }
        } catch (e) { /* ignore */ }
    },

    readRawInputs: function (formId) {
        var d = {};
        if (formId === 'me') { d['me-mass'] = document.getElementById('me-mass').value; }
        if (formId === 'ke') {
            d['ke-mass'] = document.getElementById('ke-mass').value;
            d['ke-vel']  = document.getElementById('ke-vel').value;
        }
        if (formId === 'ht') {
            d['ht-mass']     = document.getElementById('ht-mass').value;
            d['ht-cp']       = document.getElementById('ht-cp').value;
            d['ht-dt']       = document.getElementById('ht-dt').value;
            d['ht-material'] = document.getElementById('ht-material').value;
        }
        return d;
    },

    /* ── Ch 3: Validation ────────────────────────────────────────────────── */
    validate: {
        me: function () {
            var mass = parseFloat(document.getElementById('me-mass').value);
            if (isNaN(mass) || document.getElementById('me-mass').value === '')
                return { valid: false, message: 'Please enter a mass value.' };
            if (mass <= 0)
                return { valid: false, message: 'Mass must be greater than zero.' };
            return { valid: true };
        },
        ke: function () {
            var mass = parseFloat(document.getElementById('ke-mass').value);
            var vel  = parseFloat(document.getElementById('ke-vel').value);
            if (isNaN(mass) || document.getElementById('ke-mass').value === '')
                return { valid: false, message: 'Please enter a mass value.' };
            if (mass <= 0)
                return { valid: false, message: 'Mass must be greater than zero.' };
            if (isNaN(vel) || document.getElementById('ke-vel').value === '')
                return { valid: false, message: 'Please enter a velocity value.' };
            if (vel < 0)
                return { valid: false, message: 'Velocity cannot be negative.' };
            return { valid: true };
        },
        ht: function () {
            var mass = parseFloat(document.getElementById('ht-mass').value);
            var cp   = parseFloat(document.getElementById('ht-cp').value);
            var dt   = parseFloat(document.getElementById('ht-dt').value);
            if (isNaN(mass) || document.getElementById('ht-mass').value === '')
                return { valid: false, message: 'Please enter a mass value.' };
            if (mass <= 0)
                return { valid: false, message: 'Mass must be greater than zero.' };
            if (isNaN(cp) || document.getElementById('ht-cp').value === '')
                return { valid: false, message: 'Please enter or select a specific heat capacity.' };
            if (cp <= 0)
                return { valid: false, message: 'Specific heat capacity must be greater than zero.' };
            if (isNaN(dt) || document.getElementById('ht-dt').value === '')
                return { valid: false, message: 'Please enter a temperature change ΔT.' };
            if (dt === 0)
                return { valid: false, message: 'ΔT is zero — no heat transferred.' };
            return { valid: true };
        }
    },

    showError: function (formId, message) {
        var el = document.getElementById(formId + '-error');
        if (!el) return;
        el.textContent = '⚠ ' + message;
        el.classList.remove('hidden');
        el.classList.add('shake');
        setTimeout(function () { el.classList.remove('shake'); }, 400);
    },

    clearError: function (formId) {
        var el = document.getElementById(formId + '-error');
        if (el) el.classList.add('hidden');
    },

    /* ── Ch 3: Slider & dropdown ─────────────────────────────────────────── */
    syncInputFromSlider: function () {
        var slider = document.getElementById('ke-slider');
        var input  = document.getElementById('ke-vel');
        var label  = document.getElementById('ke-slider-val');
        if (!slider || !input) return;
        input.value = slider.value;
        if (label) label.textContent = slider.value;
        app.clearError('ke');
    },

    syncSliderFromInput: function () {
        var input  = document.getElementById('ke-vel');
        var slider = document.getElementById('ke-slider');
        var label  = document.getElementById('ke-slider-val');
        if (!input || !slider) return;
        var val = parseFloat(input.value);
        if (!isNaN(val) && val >= 0 && val <= 3000) {
            slider.value = val;
            if (label) label.textContent = Math.round(val);
        }
    },

    onMaterialChange: function () {
        var sel = document.getElementById('ht-material');
        var cp  = document.getElementById('ht-cp');
        if (!sel || !cp) return;
        var val = sel.value;
        cp.value = (val === '' || val === 'custom') ? '' : val;
        if (val === 'custom') cp.focus();
        app.clearError('ht');
    },

    onManualCpEntry: function () {
        var sel = document.getElementById('ht-material');
        if (sel) sel.value = 'custom';
    },

    /* ── Ch 3: Reset ─────────────────────────────────────────────────────── */
    resetForm: function (formId) {
        app.clearError(formId);
        document.getElementById(formId + '-result').classList.add('hidden');
        if (formId === 'me') { document.getElementById('me-mass').value = ''; }
        if (formId === 'ke') {
            document.getElementById('ke-mass').value = '';
            document.getElementById('ke-vel').value  = '';
            document.getElementById('ke-slider').value = 0;
            document.getElementById('ke-slider-val').textContent = '0';
        }
        if (formId === 'ht') {
            document.getElementById('ht-mass').value     = '';
            document.getElementById('ht-cp').value       = '';
            document.getElementById('ht-dt').value       = '';
            document.getElementById('ht-material').value = '';
        }
        localStorage.removeItem(STORE + formId);
    },

    /* ── Ch 4: Calculate ─────────────────────────────────────────────────── */
    calculate: function (formId) {
        var v = app.validate[formId]();
        if (!v.valid) { app.showError(formId, v.message); return; }
        app.clearError(formId);
        if (formId === 'me') app._calcMassEnergy();
        if (formId === 'ke') app._calcKineticEnergy();
        if (formId === 'ht') app._calcHeatEnergy();
    },

    _calcMassEnergy: function () {
        var mass = parseFloat(document.getElementById('me-mass').value);
        var r    = physics.massEnergy(mass);
        document.getElementById('me-joules').textContent   = fmt.energy(r.joules);
        document.getElementById('me-calories').textContent = fmt.energy(r.calories);
        document.getElementById('me-kwh').textContent      = fmt.energy(r.kwh);
        document.getElementById('me-result-inputs').textContent = 'm = ' + mass + ' kg';
        app._lastResult = { formId: 'me', mass: mass, result: r };
        app._showResult('me');
    },

    _calcKineticEnergy: function () {
        var mass = parseFloat(document.getElementById('ke-mass').value);
        var vel  = parseFloat(document.getElementById('ke-vel').value);
        var r    = physics.kineticEnergy(mass, vel);
        document.getElementById('ke-joules').textContent = fmt.energy(r.joules);
        document.getElementById('ke-kj').textContent     = fmt.energy(r.kj);
        document.getElementById('ke-wh').textContent     = fmt.energy(r.wh);
        document.getElementById('ke-result-inputs').textContent =
            'm = ' + mass + ' kg,  v = ' + vel + ' m/s';
        app._lastResult = { formId: 'ke', mass: mass, vel: vel, result: r };
        app._showResult('ke');
    },

    _calcHeatEnergy: function () {
        var mass = parseFloat(document.getElementById('ht-mass').value);
        var cp   = parseFloat(document.getElementById('ht-cp').value);
        var dt   = parseFloat(document.getElementById('ht-dt').value);
        var r    = physics.heatEnergy(mass, cp, dt);
        document.getElementById('ht-joules').textContent    = fmt.energy(r.joules);
        document.getElementById('ht-cal').textContent       = fmt.energy(r.calories);
        document.getElementById('ht-kj').textContent        = fmt.energy(r.kj);
        document.getElementById('ht-direction').textContent = r.direction;
        document.getElementById('ht-result-inputs').textContent =
            'm = ' + mass + ' kg,  c = ' + cp + ' J/kg·K,  ΔT = ' + dt + ' K';
        app._lastResult = { formId: 'ht', mass: mass, cp: cp, dt: dt, result: r };
        app._showResult('ht');
    },

    _showResult: function (formId) {
        var box = document.getElementById(formId + '-result');
        if (!box) return;
        box.classList.remove('hidden');
        box.classList.remove('result-pop');
        void box.offsetWidth;
        box.classList.add('result-pop');
    },

    /* ── Ch 4: Save to log ───────────────────────────────────────────────── */
    saveToLog: function (formId) {
        if (!app._lastResult || app._lastResult.formId !== formId) return;
        var lr = app._lastResult;
        var formula, inputs, resultStr;
        if (formId === 'me') {
            formula   = 'E = mc²';
            inputs    = 'm = ' + lr.mass + ' kg';
            resultStr = fmt.summary(lr.result.joules, 'J');
        } else if (formId === 'ke') {
            formula   = 'KE = ½mv²';
            inputs    = 'm = ' + lr.mass + ' kg,  v = ' + lr.vel + ' m/s';
            resultStr = fmt.summary(lr.result.joules, 'J');
        } else {
            formula   = 'Q = mcΔT';
            inputs    = 'm = ' + lr.mass + ' kg,  c = ' + lr.cp +
                        ' J/kg·K,  ΔT = ' + lr.dt + ' K';
            resultStr = fmt.summary(lr.result.joules, 'J');
        }
        expLog.add(formula, inputs, resultStr, lr.result);
        var btn = document.querySelector('#' + formId + '-result .save-btn');
        if (btn) {
            btn.textContent = '✓ Saved!';
            btn.classList.add('saved');
            setTimeout(function () {
                btn.textContent = '💾 Save to Experiment Log';
                btn.classList.remove('saved');
            }, 1800);
        }
    }
};

/* ── Entry point ─────────────────────────────────────────────────────────── */
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    document.getElementById('deviceready').classList.add('ready');
    app.log('deviceready — ' + cordova.platformId + ' @ ' + cordova.version);

    // Chapter 5: register battery event listener for live updates
    window.addEventListener('batterystatus', function (info) {
        if (app.currentScreen === 'monitor' &&
            app.currentMonitor === 'battery') {
            app._renderBattery(info.level, info.isPlugged);
        }
    }, false);

    // Chapter 5: register network events for live updates
    document.addEventListener('online',  function () {
        if (app.currentScreen === 'monitor' &&
            app.currentMonitor === 'network') {
            app.refreshNetwork();
        }
    }, false);
    document.addEventListener('offline', function () {
        if (app.currentScreen === 'monitor' &&
            app.currentMonitor === 'network') {
            app.refreshNetwork();
        }
    }, false);

    // Ch 3: restore saved inputs
    app.restoreInputs('me');
    app.restoreInputs('ke');
    app.restoreInputs('ht');

    // Ch 5: start at main menu
    app.showScreen('menu');

    setTimeout(app.showApp, 800);
}
