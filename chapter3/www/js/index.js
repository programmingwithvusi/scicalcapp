/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SciCalcApp — Chapter 3: Making Apps More Interactive   ║
 * ║               Through Data Input                        ║
 * ║  index.js — tabs, validation, slider, dropdown,         ║
 * ║             localStorage persistence                    ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Chapter 3 teaches:
 *  - Capturing user input from number fields, sliders, dropdowns.
 *  - Validating input before passing to any calculation.
 *  - Two-way slider ↔ number-input synchronisation.
 *  - Dropdown-driven auto-fill (material → specific heat c).
 *  - Persisting last-used values with localStorage so the user
 *    doesn't have to retype on every app launch.
 *  - Tab-based navigation between multiple input panels.
 *
 * Chapter 4 will add the actual physics algorithms.
 * This chapter only wires up the inputs and validates them.
 */

'use strict';

/* ── Storage key prefix ──────────────────────────────────────────────────── */
var STORE = 'scicalc_ch3_';

/* ── App namespace ───────────────────────────────────────────────────────── */
var app = {

    // ── Chapter 1 & 2: carried forward ───────────────────────────────────
    log: function (msg, level) {
        level = level || 'info';
        console[level === 'error' ? 'error' : 'log']('[SciCalcApp] ' + msg);
    },

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

    // ── Chapter 3: Tab navigation ─────────────────────────────────────────
    // Switches between the three calculator panels.
    // The active tab is tracked in localStorage so it restores on relaunch.
    activeTab: 'me',

    switchTab: function (id) {
        // Deactivate all panels and tabs
        ['me', 'ke', 'ht'].forEach(function (t) {
            var panel = document.getElementById('panel-' + t);
            var tab   = document.getElementById('tab-' + t);
            if (panel) panel.classList.add('hidden');
            if (tab)   tab.classList.remove('active');
        });

        // Activate the selected one
        var panel = document.getElementById('panel-' + id);
        var tab   = document.getElementById('tab-' + id);
        if (panel) panel.classList.remove('hidden');
        if (tab)   tab.classList.add('active');

        app.activeTab = id;
        localStorage.setItem(STORE + 'activeTab', id);
        app.log('Switched to tab: ' + id);
    },

    restoreActiveTab: function () {
        var saved = localStorage.getItem(STORE + 'activeTab') || 'me';
        app.switchTab(saved);
    },

    // ── Chapter 3: localStorage persistence ──────────────────────────────
    // Saves the current form values so they survive an app restart.
    // Called on each input's onblur event.
    saveInput: function (formId) {
        var data = app.readRawInputs(formId);
        localStorage.setItem(STORE + formId, JSON.stringify(data));
        app.log('Saved ' + formId + ' inputs to localStorage');
    },

    // Restores saved values into the form fields on startup.
    restoreInputs: function (formId) {
        var raw = localStorage.getItem(STORE + formId);
        if (!raw) return;
        try {
            var data = JSON.parse(raw);
            Object.keys(data).forEach(function (key) {
                var el = document.getElementById(key);
                if (el) el.value = data[key];
            });
            // Restore slider and dropdown state
            if (formId === 'ke') {
                app.syncSliderFromInput();
            }
            if (formId === 'ht' && data['ht-material']) {
                var sel = document.getElementById('ht-material');
                if (sel) sel.value = data['ht-material'];
            }
            app.log('Restored ' + formId + ' inputs from localStorage');
        } catch (e) {
            app.log('Could not restore ' + formId + ': ' + e.message, 'error');
        }
    },

    // Reads all raw string values from a form's inputs.
    readRawInputs: function (formId) {
        var data = {};
        if (formId === 'me') {
            data['me-mass'] = document.getElementById('me-mass').value;
        }
        if (formId === 'ke') {
            data['ke-mass']   = document.getElementById('ke-mass').value;
            data['ke-vel']    = document.getElementById('ke-vel').value;
        }
        if (formId === 'ht') {
            data['ht-mass']     = document.getElementById('ht-mass').value;
            data['ht-cp']       = document.getElementById('ht-cp').value;
            data['ht-dt']       = document.getElementById('ht-dt').value;
            data['ht-material'] = document.getElementById('ht-material').value;
        }
        return data;
    },

    // ── Chapter 3: Input validation ───────────────────────────────────────
    // Each validate function returns { valid: bool, message: string }.
    // Rules follow Chapter 3's guidance:
    //   - Field must not be empty
    //   - Value must be a finite number
    //   - Physics constraints (mass > 0, etc.)

    validate: {

        me: function () {
            var mass = parseFloat(document.getElementById('me-mass').value);
            if (isNaN(mass) || document.getElementById('me-mass').value === '') {
                return { valid: false, message: 'Please enter a mass value.' };
            }
            if (mass <= 0) {
                return { valid: false, message: 'Mass must be greater than zero.' };
            }
            return { valid: true };
        },

        ke: function () {
            var mass = parseFloat(document.getElementById('ke-mass').value);
            var vel  = parseFloat(document.getElementById('ke-vel').value);
            if (isNaN(mass) || document.getElementById('ke-mass').value === '') {
                return { valid: false, message: 'Please enter a mass value.' };
            }
            if (mass <= 0) {
                return { valid: false, message: 'Mass must be greater than zero.' };
            }
            if (isNaN(vel) || document.getElementById('ke-vel').value === '') {
                return { valid: false, message: 'Please enter a velocity value.' };
            }
            if (vel < 0) {
                return { valid: false, message: 'Velocity cannot be negative. Use the magnitude.' };
            }
            return { valid: true };
        },

        ht: function () {
            var mass = parseFloat(document.getElementById('ht-mass').value);
            var cp   = parseFloat(document.getElementById('ht-cp').value);
            var dt   = parseFloat(document.getElementById('ht-dt').value);
            if (isNaN(mass) || document.getElementById('ht-mass').value === '') {
                return { valid: false, message: 'Please enter a mass value.' };
            }
            if (mass <= 0) {
                return { valid: false, message: 'Mass must be greater than zero.' };
            }
            if (isNaN(cp) || document.getElementById('ht-cp').value === '') {
                return { valid: false, message: 'Please enter or select a specific heat capacity.' };
            }
            if (cp <= 0) {
                return { valid: false, message: 'Specific heat capacity must be greater than zero.' };
            }
            if (isNaN(dt) || document.getElementById('ht-dt').value === '') {
                return { valid: false, message: 'Please enter a temperature change ΔT.' };
            }
            if (dt === 0) {
                return { valid: false, message: 'ΔT is zero — no heat energy is transferred.' };
            }
            return { valid: true };
        }
    },

    // Shows a validation error below the form.
    showError: function (formId, message) {
        var el = document.getElementById(formId + '-error');
        if (!el) return;
        el.textContent = '⚠ ' + message;
        el.classList.remove('hidden');
        el.classList.add('shake');
        setTimeout(function () { el.classList.remove('shake'); }, 400);
    },

    // Clears the validation error (called on any input event).
    clearError: function (formId) {
        var el = document.getElementById(formId + '-error');
        if (el) el.classList.add('hidden');
    },

    // ── Chapter 3: Calculate (stub — Chapter 4 fills this in) ────────────
    calculate: function (formId) {
        var result = app.validate[formId]();
        if (!result.valid) {
            app.showError(formId, result.message);
            app.log('Validation failed [' + formId + ']: ' + result.message, 'error');
            return;
        }
        app.clearError(formId);
        app.log('Validation passed [' + formId + '] — calculation coming in Chapter 4.');

        // Show placeholder result box
        var box = document.getElementById(formId + '-result');
        if (box) box.classList.remove('hidden');
    },

    // ── Chapter 3: Reset form ────────────────────────────────────────────
    resetForm: function (formId) {
        app.clearError(formId);
        var resultBox = document.getElementById(formId + '-result');
        if (resultBox) resultBox.classList.add('hidden');

        if (formId === 'me') {
            document.getElementById('me-mass').value = '';
        }
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
        app.log('Reset form: ' + formId);
    },

    // ── Chapter 3: Slider ↔ input synchronisation ─────────────────────────
    // Two-way: moving the slider updates the number input, and typing in
    // the number input moves the slider. Demonstrates how interactive
    // controls can be kept in sync without a framework.

    syncInputFromSlider: function () {
        var slider = document.getElementById('ke-slider');
        var input  = document.getElementById('ke-vel');
        var label  = document.getElementById('ke-slider-val');
        if (!slider || !input) return;
        var val = slider.value;
        input.value = val;
        if (label) label.textContent = val;
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

    // ── Chapter 3: Dropdown — material → specific heat ────────────────────
    // When the user picks a material, its c value is written into the
    // number input. Selecting "Custom value…" clears the field for manual entry.

    onMaterialChange: function () {
        var sel = document.getElementById('ht-material');
        var cp  = document.getElementById('ht-cp');
        if (!sel || !cp) return;
        var val = sel.value;
        if (val === '' || val === 'custom') {
            cp.value = '';
            cp.focus();
        } else {
            cp.value = val;
        }
        app.clearError('ht');
        app.log('Material selected — c set to ' + (val || 'manual'));
    },

    // If the user types c manually, reset the dropdown to avoid confusion.
    onManualCpEntry: function () {
        var sel = document.getElementById('ht-material');
        if (sel) sel.value = 'custom';
    }
};

/* ── Entry point ─────────────────────────────────────────────────────────── */
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Chapter 1: flip splash indicator
    document.getElementById('deviceready').classList.add('ready');
    app.log('deviceready — ' + cordova.platformId + ' @ ' + cordova.version);

    // Chapter 2: build info
    app.populateBuildInfo();

    // Chapter 3: restore last-used tab and inputs from localStorage
    app.restoreActiveTab();
    app.restoreInputs('me');
    app.restoreInputs('ke');
    app.restoreInputs('ht');

    setTimeout(app.showApp, 800);
}
