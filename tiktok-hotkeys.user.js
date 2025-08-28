// ==UserScript==
// @name         TikTok Keyboard Shortcuts v2.9
// @namespace    http://tampermonkey.net/
// @version      2.9
// @description  TikTok keyboard shortcuts with draggable menu, sound toggle, GitHub link, and minimize button
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
        soundsEnabled: false,
        menuPos: { top: 10, left: null, right: 10 },
        minimized: false
    };

    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('tiktokShortcutSettings')) || {}; } catch (e) {}
    let settings = { ...defaults, ...stored };
    settings.menuPos = { ...defaults.menuPos, ...(stored.menuPos || {}) };

    function saveSettings() {
        localStorage.setItem('tiktokShortcutSettings', JSON.stringify(settings));
    }

    function beep(duration = 150, frequency = 440, volume = 0.3) {
        if (!settings.soundsEnabled) return;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.frequency.value = frequency;
            osc.type = 'sine';
            gain.gain.value = volume;
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start();
            setTimeout(() => { osc.stop(); context.close(); }, duration);
        } catch {}
    }

    function createMenu() {
        if ($('#tiktok-shortcuts-menu').length) return;

        let posStyle = `top:${settings.menuPos.top}px;`;
        if (settings.menuPos.left !== null) posStyle += `left:${settings.menuPos.left}px;`;
        else posStyle += `right:${settings.menuPos.right}px;`;

        const html = `
        <div id="tiktok-shortcuts-menu" style="
            position: fixed; ${posStyle}
            background: #111; color: white; padding: 12px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 14px; z-index: 9999999;
            width: 260px; box-shadow: 0 0 8px rgba(0,0,0,0.8); cursor: move;">
            <div id="menu-header" style="display:flex; justify-content:space-between; align-items:center; cursor: move; margin-bottom:6px;">
                <h4 style="margin:0;">TikTok Shortcuts</h4>
                <button id="toggleMenuBtn" style="
                    background:#22a; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; padding:2px 6px;">
                    ${settings.minimized ? '+' : '-'}
                </button>
            </div>
            <div id="menu-body" style="${settings.minimized ? 'display:none;' : ''}">
                <label style="display:block; margin-bottom:6px;">Scroll Down Key:
                    <input type="text" id="keyScrollDown" maxlength="1" style="width:30px;" value="${settings.keyScrollDown}">
                </label>
                <label style="display:block; margin-bottom:6px;">Scroll Up Key:
                    <input type="text" id="keyScrollUp" maxlength="1" style="width:30px;" value="${settings.keyScrollUp}">
                </label>
                <label style="display:block; margin-bottom:6px;">Like Key:
                    <input type="text" id="keyLike" maxlength="1" style="width:30px;" value="${settings.keyLike}">
                </label>
                <label style="display:block; margin-bottom:6px;">Not Interested Key:
                    <input type="text" id="keyNotInterested" maxlength="1" style="width:30px;" value="${settings.keyNotInterested}">
                </label>
                <label style="display:block; margin-bottom:6px;">
                    <input type="checkbox" id="enableSounds" ${settings.soundsEnabled ? 'checked' : ''}> Enable Sounds
                </label>
                <button id="saveSettingsBtn" style="
                    margin-top: 8px; padding: 6px 12px; background: #22a;
                    border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; display:block;">
                    Save Settings
                </button>
                <div style="margin-top:12px; font-size:12px; text-align:center;">
                    <a href="https://github.com/JohnHansonTheDev/tik-tok-hotkeys" target="_blank" style="color:#7fd8ff; text-decoration:none;">GitHub Repo</a><br>
                    <span style="opacity:0.6;">by vanzim</span>
                </div>
            </div>
        </div>`;

        $('body').append(html);

        $('#toggleMenuBtn').on('click', () => {
            const body = $('#menu-body');
            if(body.is(':visible')){
                body.hide();
                $('#toggleMenuBtn').text('+');
                settings.minimized = true;
            } else {
                body.show();
                $('#toggleMenuBtn').text('-');
                settings.minimized = false;
            }
            saveSettings();
        });

        $('#saveSettingsBtn').on('click', () => {
            settings.keyScrollDown = $('#keyScrollDown').val().toLowerCase() || defaults.keyScrollDown;
            settings.keyScrollUp = $('#keyScrollUp').val().toLowerCase() || defaults.keyScrollUp;
            settings.keyLike = $('#keyLike').val().toLowerCase() || defaults.keyLike;
            settings.keyNotInterested = $('#keyNotInterested').val().toLowerCase() || defaults.keyNotInterested;
            settings.soundsEnabled = $('#enableSounds').prop('checked');
            saveSettings();
            beep(200, 600);
        });

        makeDraggable($('#tiktok-shortcuts-menu')[0]);
    }

    function makeDraggable(el) {
        let isDragging = false, startX, startY, startTop, startLeft;
        el.addEventListener('mousedown', (e) => {
            if(['INPUT','BUTTON','LABEL'].includes(e.target.tagName)) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            startTop = el.offsetTop; startLeft = el.offsetLeft;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if(!isDragging) return;
            el.style.top = (startTop + e.clientY - startY) + 'px';
            el.style.left = (startLeft + e.clientX - startX) + 'px';
            el.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if(isDragging){
                isDragging = false;
                document.body.style.userSelect = '';
                settings.menuPos = { top: parseInt(el.style.top), left: parseInt(el.style.left), right: null };
                saveSettings();
            }
        });
    }

    function main() {
        createMenu();

        document.addEventListener('keydown', function(e){
            if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
            const key = e.key.toLowerCase();

            if(key === settings.keyScrollDown){
                const scrollBtns = document.querySelectorAll('button.TUXButton.TUXButton--capsule.TUXButton--medium.TUXButton--secondary.action-item.css-1rxmjnh');
                if(scrollBtns.length > 1) scrollBtns[1].click();
                e.preventDefault();
            }
            else if(key === settings.keyScrollUp){
                const scrollBtns = document.querySelectorAll('button.TUXButton.TUXButton--capsule.TUXButton--medium.TUXButton--secondary.action-item.css-1rxmjnh');
                if(scrollBtns.length > 0) scrollBtns[0].click();
                e.preventDefault();
            }
            else if(key === settings.keyLike){
                const likeBtn = Array.from(document.querySelectorAll('span[data-e2e="like-icon"]'))
                    .map(s => s.closest('button'))
                    .find(b => {
                        const rect = b.getBoundingClientRect();
                        return rect.top >=0 && rect.bottom <= window.innerHeight;
                    });
                if(likeBtn) likeBtn.click();
                e.preventDefault();
            }
            else if(key === settings.keyNotInterested){
                const moreBtn = Array.from(document.querySelectorAll('button[data-e2e="more-menu-icon"]'))
                    .find(b => {
                        const rect = b.getBoundingClientRect();
                        return rect.top >=0 && rect.bottom <= window.innerHeight;
                    });
                if(moreBtn){
                    moreBtn.click();
                    beep();
                    setTimeout(() => {
                        const notInterestedItems = document.querySelectorAll('div.TUXMenuItem[data-e2e="more-menu-popover_not-interested"]');
                        if(notInterestedItems.length > 0) notInterestedItems[0].click();
                    }, 10);
                }
                e.preventDefault();
            }
        });
    }

    const waitForPage = setInterval(() => {
        const likeBtn = Array.from(document.querySelectorAll('span[data-e2e="like-icon"]'))
            .map(s => s.closest('button'))
            .find(b => {
                const rect = b.getBoundingClientRect();
                return rect.top >=0 && rect.bottom <= window.innerHeight;
            });
        if(likeBtn){
            clearInterval(waitForPage);
            beep();
            main();
        }
    }, 300);

})();
