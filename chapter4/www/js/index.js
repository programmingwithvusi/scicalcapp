/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SciCalcApp — Chapter 4: Making Apps Do Significant     ║
 * ║               Computing                                 ║
 * ║  index.js — physics algorithms, multi-unit output,      ║
 * ║             edge-case handling, experiment log          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Chapter 4 teaches:
 *  - Embedding real scientific algorithms in mobile apps.
 *  - Presenting results in multiple units simultaneously.
 *  - Handling edge cases: very large numbers (E=mc² outputs ~10^17 J),
 *    very small numbers, zero velocity (KE=0 is valid), negative ΔT.
 *  - Formatting numbers clearly: toFixed() vs toExponential().
 *  - Persisting results to localStorage for the experiment log
 *    that Chapter 5 will display.
 */

'use strict';

/* ── Constants ───────────────────────────────────────────────────────────── */
var C          = 299792458;      // Speed of light (m/s)  — exact SI definition
var J_PER_CAL  = 4.184;          // 1 thermochemical calorie = 4.184 J
var J_PER_KWH  = 3600000;        // 1 kWh = 3 600 000 J
var J_PER_WH   = 3600;           // 1 Wh  = 3 600 J

/* ── Storage keys ────────────────────────────────────────────────────────── */
var STORE     = 'scicalc_ch3_';   // Ch3 input persistence (unchanged)
var LOG_KEY   = 'scicalc_log';    // Ch4 experiment log entries

/* ═══════════════════════════════════════════════════════════════════════════
   CHAPTER 4 — Physics algorithms
   Each function takes validated numeric inputs and returns a results object.
   Pure functions: no DOM access, fully testable in isolation.
   ═══════════════════════════════════════════════════════════════════════════ */

var physics = {

    /**
     * massEnergy — E = mc²
     * @param  {number} mass  kg, must be > 0
     * @returns {{ joules, calories, kwh }}
     *
     * Edge cases handled:
     *  - Very large results (e.g. 1 kg → 8.99×10¹⁶ J): use scientific notation
     *  - Very small mass (e.g. 0.000001 kg): still computes correctly
     */
    massEnergy: function (mass) {
        var joules   = mass * C * C;
        var calories = joules / J_PER_CAL;
        var kwh      = joules / J_PER_KWH;
        return { joules: joules, calories: calories, kwh: kwh };
    },

    /**
     * kineticEnergy — KE = ½mv²
     * @param  {number} mass      kg, must be > 0
     * @param  {number} velocity  m/s, must be ≥ 0
     * @returns {{ joules, kj, wh }}
     *
     * Edge cases handled:
     *  - velocity = 0: KE = 0 is physically correct (object at rest)
     *  - Large velocity (e.g. 3000 m/s): results in MJ range, handled cleanly
     */
    kineticEnergy: function (mass, velocity) {
        var joules = 0.5 * mass * velocity * velocity;
        var kj     = joules / 1000;
        var wh     = joules / J_PER_WH;
        return { joules: joules, kj: kj, wh: wh };
    },

    /**
     * heatEnergy — Q = mcΔT
     * @param  {number} mass   kg, must be > 0
     * @param  {number} cp     J/kg·K, must be > 0
     * @param  {number} dt     K (or °C), must be ≠ 0
     * @returns {{ joules, calories, kj, direction }}
     *
     * Edge cases handled:
     *  - Negative ΔT: Q is negative — object is losing heat (cooling)
     *  - Very large cp × mass × ΔT: can reach MJ, handled by formatter
     */
    heatEnergy: function (mass, cp, dt) {
        var joules    = mass * cp * dt;
        var calories  = joules / J_PER_CAL;
        var kj        = joules / 1000;
        var direction = joules > 0 ? '🔺 Heating (energy absorbed)'
                                   : '🔻 Cooling (energy released)';
        return { joules: joules, calories: calories, kj: kj, direction: direction };
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHAPTER 4 — Number formatting
   Chooses between fixed-point and scientific notation based on magnitude.
   Keeps the display readable at all scales.
   ═══════════════════════════════════════════════════════════════════════════ */

var fmt = {

    /**
     * energy — formats an energy value with appropriate precision.
     * < 0.001       → scientific notation  (e.g. 1.23×10⁻⁵)
     * 0.001–999999  → fixed 4 decimal places
     * ≥ 1 000 000   → scientific notation  (e.g. 8.99×10¹⁶)
     */
    energy: function (value) {
        if (value === 0) return '0';
        var abs = Math.abs(value);
        var sign = value < 0 ? '−' : '';

        if (abs < 0.001 || abs >= 1e6) {
            return sign + abs.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^−');
        }
        // Use commas for thousands separator
        return sign + abs.toFixed(4).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    /**
     * summary — compact human-readable summary for the log entry header.
     * Always uses 4 significant figures in scientific notation.
     */
    summary: function (value, unit) {
        if (value === 0) return '0 ' + unit;
        return value.toExponential(3) + ' ' + unit;
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHAPTER 4 — Experiment Log
   Saves calculation results to localStorage as a JSON array.
   Chapter 5 will read this array and render the full log viewer.
   ═══════════════════════════════════════════════════════════════════════════ */

var log = {

    load: function () {
        try {
            return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    save: function (entries) {
        localStorage.setItem(LOG_KEY, JSON.stringify(entries));
    },

    /**
     * add — appends one result entry to the log.
     * @param {string} formula   e.g. 'E = mc²'
     * @param {string} inputs    human-readable inputs  e.g. 'm = 2 kg'
     * @param {string} result    primary result summary e.g. '1.797×10¹⁷ J'
     * @param {object} full      full results object for display
     */
    add: function (formula, inputs, result, full) {
        var entries = log.load();
        entries.unshift({                        // newest first
            id:        Date.now(),
            timestamp: new Date().toLocaleString(),
            formula:   formula,
            inputs:    inputs,
            result:    result,
            full:      full
        });
        // Cap at 50 entries so localStorage doesn't grow unbounded
        if (entries.length > 50) entries = entries.slice(0, 50);
        log.save(entries);
        app.log('Saved to experiment log: ' + formula + ' → ' + result);
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   APP NAMESPACE — carries forward Ch1–3, adds Ch4 calculate & saveToLog
   ═══════════════════════════════════════════════════════════════════════════ */

var app = {

    /* ── Ch 1 & 2: carried forward ─────────────────────────────────────── */
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

    populateBuildInfo: function () {
        function set(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        }
        set('info-platform', cordova.platformId + ' @ Cordova ' + cordova.version);
        set('info-cordova',  cordova.version);
        set('info-screen',   window.screen.width + '×' + window.screen.height);
    },

    /* ── Ch 3: tab navigation ──────────────────────────────────────────── */
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

    /* ── Ch 3: localStorage input persistence ──────────────────────────── */
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
        } catch (e) { /* ignore corrupt data */ }
    },

    readRawInputs: function (formId) {
        var data = {};
        if (formId === 'me') { data['me-mass'] = document.getElementById('me-mass').value; }
        if (formId === 'ke') {
            data['ke-mass'] = document.getElementById('ke-mass').value;
            data['ke-vel']  = document.getElementById('ke-vel').value;
        }
        if (formId === 'ht') {
            data['ht-mass']     = document.getElementById('ht-mass').value;
            data['ht-cp']       = document.getElementById('ht-cp').value;
            data['ht-dt']       = document.getElementById('ht-dt').value;
            data['ht-material'] = document.getElementById('ht-material').value;
        }
        return data;
    },

    /* ── Ch 3: validation ──────────────────────────────────────────────── */
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
                return { valid: false, message: 'Velocity cannot be negative. Use the magnitude.' };
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
                return { valid: false, message: 'ΔT is zero — no heat energy is transferred.' };
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

    /* ── Ch 3: slider & dropdown ───────────────────────────────────────── */
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

    /* ── Ch 3: reset ───────────────────────────────────────────────────── */
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

    /* ── CHAPTER 4: calculate ──────────────────────────────────────────── */
    // Validates inputs, runs the physics algorithm, formats results,
    // and renders the result card. Replaces the Ch3 stub.

    calculate: function (formId) {
        var v = app.validate[formId]();
        if (!v.valid) { app.showError(formId, v.message); return; }
        app.clearError(formId);

        if (formId === 'me') { app._calcMassEnergy(); }
        if (formId === 'ke') { app._calcKineticEnergy(); }
        if (formId === 'ht') { app._calcHeatEnergy(); }
    },

    _calcMassEnergy: function () {
        var mass = parseFloat(document.getElementById('me-mass').value);
        var r    = physics.massEnergy(mass);

        // Fill result rows
        document.getElementById('me-joules').textContent   = fmt.energy(r.joules);
        document.getElementById('me-calories').textContent = fmt.energy(r.calories);
        document.getElementById('me-kwh').textContent      = fmt.energy(r.kwh);

        // Inputs summary line
        document.getElementById('me-result-inputs').textContent =
            'm = ' + mass + ' kg';

        // Store on instance for saveToLog
        app._lastResult = { formId: 'me', mass: mass, result: r };

        app._showResult('me');
        app.log('E=mc² → m=' + mass + 'kg → ' + fmt.summary(r.joules, 'J'));
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
        app.log('KE=½mv² → m=' + mass + 'kg, v=' + vel + 'm/s → ' +
                fmt.summary(r.joules, 'J'));
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
        app.log('Q=mcΔT → m=' + mass + ', c=' + cp + ', ΔT=' + dt +
                ' → ' + fmt.summary(r.joules, 'J'));
    },

    _showResult: function (formId) {
        var box = document.getElementById(formId + '-result');
        if (!box) return;
        box.classList.remove('hidden');
        // Re-trigger animation
        box.classList.remove('result-pop');
        void box.offsetWidth;   // force reflow
        box.classList.add('result-pop');
    },

    /* ── CHAPTER 4: save to experiment log ─────────────────────────────── */
    // Persists the most recent calculation to localStorage.
    // Chapter 5 reads this array and renders the log viewer screen.

    saveToLog: function (formId) {
        if (!app._lastResult || app._lastResult.formId !== formId) {
            app.log('No result to save for ' + formId, 'error');
            return;
        }
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

        log.add(formula, inputs, resultStr, lr.result);

        // Visual feedback: briefly change button text
        var btn = document.querySelector('#' + formId +
                  '-result .save-btn');
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

    app.populateBuildInfo();
    app.restoreActiveTab();
    app.restoreInputs('me');
    app.restoreInputs('ke');
    app.restoreInputs('ht');

    setTimeout(app.showApp, 800);
}
