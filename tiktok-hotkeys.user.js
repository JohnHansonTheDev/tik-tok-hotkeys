// ==UserScript==
// @name         TikTok Keyboard Shortcuts with Customizable Keys & Sounds
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  TikTok keyboard shortcuts with customizable keys, floating menu, and sound toggle (sounds off by default)
// @match        https://www.tiktok.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function () {
    'use strict';

    const $ = window.jQuery;

    const defaults = {
        keyScrollDown: 's',
        keyScrollUp: 'w',
        keyLike: 'd',
        keyNotInterested: 'a',
        soundsEnabled: false
    };

    let settings = JSON.parse(localStorage.getItem('tiktokShortcutSettings')) || defaults;

    function saveSettings() {
        localStorage.setItem('tiktokShortcutSettings', JSON.stringify(settings));
    }

    function beep(duration = 150, frequency = 440, volume = 0.3) {
        if (!settings.soundsEnabled) return;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.value = volume;
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                context.close();
            }, duration);
        } catch (e) {
            console.warn('Beep not supported:', e);
        }
    }

    function createMenu() {
        if ($('#tiktok-shortcuts-menu').length) return;

        const html = `
        <div id="tiktok-shortcuts-menu" style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: #111;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 9999999;
            width: 250px;
            box-shadow: 0 0 8px rgba(0,0,0,0.8);
        ">
            <h4 style="margin-top:0; margin-bottom: 8px;">TikTok Shortcuts</h4>
            <label style="display:block; margin-bottom:6px;">
                Scroll Down Key:
                <input type="text" id="keyScrollDown" maxlength="1" style="width:30px; text-transform: lowercase;" value="${settings.keyScrollDown}">
            </label>
            <label style="display:block; margin-bottom:6px;">
                Scroll Up Key:
                <input type="text" id="keyScrollUp" maxlength="1" style="width:30px; text-transform: lowercase;" value="${settings.keyScrollUp}">
            </label>
            <label style="display:block; margin-bottom:6px;">
                Like Key:
                <input type="text" id="keyLike" maxlength="1" style="width:30px; text-transform: lowercase;" value="${settings.keyLike}">
            </label>
            <label style="display:block; margin-bottom:6px;">
                Not Interested Key:
                <input type="text" id="keyNotInterested" maxlength="1" style="width:30px; text-transform: lowercase;" value="${settings.keyNotInterested}">
            </label>
            <label style="display:block; margin-bottom:6px;">
                <input type="checkbox" id="enableSounds" ${settings.soundsEnabled ? 'checked' : ''}>
                Enable Sounds
            </label>
            <button id="saveSettingsBtn" style="
                margin-top: 8px;
                padding: 6px 12px;
                background: #22a;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                font-weight: bold;
            ">Save Settings</button>
            <div style="margin-top:12px; font-size:12px; text-align:center;">
                <a href="https://github.com/JohnHansonTheDev/tik-tok-hotkeys" target="_blank" style="color:#7fd8ff; text-decoration:none;">GitHub Repo</a><br>
                <span style="opacity:0.6;">by vanzim</span>
            </div>
        </div>`;

        $('body').append(html);

        $('#saveSettingsBtn').on('click', () => {
            settings.keyScrollDown = $('#keyScrollDown').val().toLowerCase() || defaults.keyScrollDown;
            settings.keyScrollUp = $('#keyScrollUp').val().toLowerCase() || defaults.keyScrollUp;
            settings.keyLike = $('#keyLike').val().toLowerCase() || defaults.keyLike;
            settings.keyNotInterested = $('#keyNotInterested').val().toLowerCase() || defaults.keyNotInterested;
            settings.soundsEnabled = $('#enableSounds').prop('checked');
            saveSettings();
            beep(200, 600);
            alert('Settings saved!');
        });
    }

    function main() {
        createMenu();

        document.addEventListener('keydown', function (e) {
            if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

            const key = e.key.toLowerCase();

            if (key === settings.keyScrollDown) {
                const scrollBtns = document.querySelectorAll('button.TUXButton.TUXButton--capsule.TUXButton--medium.TUXButton--secondary.action-item.css-1rxmjnh');
                if (scrollBtns.length > 1) {
                    scrollBtns[1].click();
                    beep(300, 350);
                } else {
                    beep(300, 200);
                }
                e.preventDefault();
            } else if (key === settings.keyScrollUp) {
                const scrollBtns = document.querySelectorAll('button.TUXButton.TUXButton--capsule.TUXButton--medium.TUXButton--secondary.action-item.css-1rxmjnh');
                if (scrollBtns.length > 0) {
                    scrollBtns[0].click();
                    beep(300, 350);
                } else {
                    beep(300, 200);
                }
                e.preventDefault();
            } else if (key === settings.keyLike) {
                const buttons = document.querySelectorAll('button.css-67yy18-ButtonActionItem.e1hk3hf90');
                let visibleButton = null;
                for (const btn of buttons) {
                    const rect = btn.getBoundingClientRect();
                    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                        visibleButton = btn;
                        break;
                    }
                }
                if (visibleButton) {
                    visibleButton.click();
                    beep();
                } else {
                    beep(300, 200);
                }
                e.preventDefault();
            } else if (key === settings.keyNotInterested) {
                const moreButtons = document.querySelectorAll('button.TUXButton.TUXButton--capsule.TUXButton--medium.TUXButton--secondary.action-item.css-3ryazn');
                let visibleMoreBtn = null;
                for (const btn of moreButtons) {
                    const rect = btn.getBoundingClientRect();
                    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                        visibleMoreBtn = btn;
                        break;
                    }
                }

                if (visibleMoreBtn) {
                    visibleMoreBtn.click();
                    beep();
                    setTimeout(() => {
                        const notInterestedItems = document.querySelectorAll('div.TUXMenuItem[data-e2e="more-menu-popover_not-interested"]');
                        if (notInterestedItems.length > 0) {
                            notInterestedItems[0].click();
                            beep();
                        } else {
                            beep(300, 200);
                        }
                    }, 10);
                } else {
                    beep(300, 200);
                }
                e.preventDefault();
            }
        });
    }

    const waitForPage = setInterval(() => {
        if (document.querySelector('button.css-67yy18-ButtonActionItem.e1hk3hf90')) {
            clearInterval(waitForPage);
            beep();
            main();
        }
    }, 300);
})();
