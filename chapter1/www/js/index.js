/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SciCalcApp — Chapter 1: Introduction                   ║
 * ║  index.js — deviceready listener & app initialisation   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Chapter 1 teaches:
 *  - The deviceready event: the single most important Cordova event.
 *    No Cordova API (camera, battery, network, etc.) is safe to call
 *    before this fires. Always gate your startup logic behind it.
 *  - Transitioning from splash screen to app UI.
 *  - Reading basic platform information.
 */

// ── Entry point ──────────────────────────────────────────────────────────────
// Register the deviceready listener as early as possible.
// 'false' = bubble phase (standard for Cordova).
document.addEventListener('deviceready', onDeviceReady, false);

/**
 * onDeviceReady — called once by Cordova when the native layer is ready.
 *
 * Chapter 1 tasks:
 *  1. Mark the deviceready indicator as received.
 *  2. Log platform info to the console (useful during testing — Ch 2).
 *  3. Show the platform name in the welcome card.
 *  4. Transition from splash screen to app container.
 */
function onDeviceReady() {

    // 1. Flip the deviceready indicator to "received"
    document.getElementById('deviceready').classList.add('ready');

    // 2. Console output — Chapter 2 will verify this in the browser console
    console.log('[Ch1] deviceready fired');
    console.log('[Ch1] Platform : ' + cordova.platformId);
    console.log('[Ch1] Cordova  : ' + cordova.version);

    // 3. Display platform name in the welcome card
    var platformEl = document.getElementById('platform-name');
    if (platformEl) {
        platformEl.textContent = cordova.platformId + ' (Cordova ' + cordova.version + ')';
    }

    // 4. Transition: hide splash, reveal app
    //    A short delay lets the user see the "ready" status briefly.
    setTimeout(showApp, 800);
}

/**
 * showApp — swaps splash screen for the main app container.
 * The CSS class 'hidden' uses display:none; removing it reveals the element.
 */
function showApp() {
    var splash = document.getElementById('splash-screen');
    var app    = document.getElementById('app-container');

    if (splash) {
        splash.classList.add('fade-out');
        // Remove from DOM after the CSS fade-out transition completes
        setTimeout(function () { splash.style.display = 'none'; }, 400);
    }

    if (app) {
        app.classList.remove('hidden');
        app.classList.add('fade-in');
    }
}
