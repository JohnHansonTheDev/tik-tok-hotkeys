// ==UserScript==
// @name         TikTok Keyboard Shortcuts v3.5
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  TikTok keyboard shortcuts with draggable menu, minimize, run toggle next to minimize, and audio beep
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
        menuPos: { top: 10, left: null, right: 10 }
    };

    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('tiktokShortcutSettings')) || {}; } catch (e) {}
    let settings = { ...defaults, ...stored };
    settings.menuPos = { ...defaults.menuPos, ...(stored.menuPos || {}) };

    let shortcutsEnabled = true;

    function saveSettings() {
        localStorage.setItem('tiktokShortcutSettings', JSON.stringify(settings));
    }

    function beep() {
        if (!settings.soundsEnabled) return;
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQoAAAAA');
        audio.play();
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
            width: 280px; box-shadow: 0 0 8px rgba(0,0,0,0.8); cursor: move;">
            <div id="menuHeader" style="margin-bottom:8px; cursor:move; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold;">TikTok Shortcuts</span>
                <div style="display:flex; align-items:center; gap:6px;">
                    <label style="display:flex; align-items:center; font-weight:normal; font-size:12px; cursor:pointer;">
                        <input type="checkbox" id="runShortcuts" checked style="margin-right:4px;">Run
                    </label>
                    <button id="minimizeMenu" style="background:#555;color:white;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;">–</button>
                </div>
            </div>
            <div id="menuContent">
                <label>Scroll Down Key:<input type="text" id="keyScrollDown" maxlength="1" style="width:30px;" value="${settings.keyScrollDown}"></label><br>
                <label>Scroll Up Key:<input type="text" id="keyScrollUp" maxlength="1" style="width:30px;" value="${settings.keyScrollUp}"></label><br>
                <label>Like Key:<input type="text" id="keyLike" maxlength="1" style="width:30px;" value="${settings.keyLike}"></label><br>
                <label>Not Interested Key:<input type="text" id="keyNotInterested" maxlength="1" style="width:30px;" value="${settings.keyNotInterested}"></label><br>
                <label><input type="checkbox" id="enableSounds" ${settings.soundsEnabled ? 'checked' : ''}> Enable Sounds</label><br><br>
                <button id="saveSettingsBtn" style="
                    margin-top:8px;
                    width:100%;
                    background:#1da1f2;
                    color:white;
                    border:none;
                    border-radius:4px;
                    padding:6px 0;
                    cursor:pointer;
                    font-weight:bold;
                ">Save Settings</button>
                <div style="margin-top:12px; font-size:12px; text-align:center;">
                    <a href="https://github.com/JohnHansonTheDev/tik-tok-hotkeys" target="_blank" style="color:#7fd8ff; text-decoration:none;">GitHub Repo</a><br>
                    <span style="opacity:0.6;">by vanzim</span>
                </div>
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
            beep();
        });

        $('#runShortcuts').on('change', () => {
            shortcutsEnabled = $('#runShortcuts').prop('checked');
        });

        $('#minimizeMenu').on('click', () => {
            const content = $('#menuContent');
            if(content.is(':visible')){
                content.hide();
                $('#minimizeMenu').text('+');
            } else {
                content.show();
                $('#minimizeMenu').text('–');
            }
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
            if(!shortcutsEnabled) return;
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
                if(likeBtn) { likeBtn.click(); beep(); }
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
