'use strict';

// 関数インポート
import { modalMessage } from './modal-alert.js';
import { initEditor } from './quill.js';
import { db, dbSetting } from './db.js';
import { countSelectedAddressSets, selectAddressSets, renderAddressOptions } from './address-list_select.js';
import { addressSetsEdit } from './address-sets-editor.js'

// 変数宣言

const myEditor = initEditor('#editor');
const addressOptions = document.getElementById('address-options');
const addressPopover = document.getElementById("menu__address-sets");

// testbtn.addEventListener('click', async () => {

//     const result = await modalMessage('title', 'message', false);

//     if (result) {
//         alert('done');
//     }
// });


// 読み込み時実行
document.addEventListener('DOMContentLoaded', async () => {
    await renderAddressOptions();
    const addressOptions = document.getElementById('address-options');
    if (addressOptions) {
        selectAddressSets(addressOptions);
        countSelectedAddressSets(addressOptions);
    }
});

// 宛先選択
addressOptions.addEventListener('change', async (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;

    // 現在チェックされている全ボタンから数値のID配列を作る
    const checkedCbs = addressOptions.querySelectorAll('input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkedCbs).map(cb => Number(cb.value));

    // 既存の設定を一度取ってきて、ID配列だけ差し替えて保存（他の設定値を壊さないため）
    const currentSettings = await db.settings.get(1) || { id: 1 };

    await db.settings.put({
        ...currentSettings,
        lastSelectedAddressSetsIDs: selectedIds,
        updatedAt: new Date().toISOString()
    });
    countSelectedAddressSets(addressOptions);
    selectAddressSets(addressOptions);
});

addressPopover.addEventListener("toggle", async (e) => {
    if (e.newState === "open") {
        await renderAddressOptions();
    } else {
        selectAddressSets(addressOptions);
    }
});


const btnOpenEditor = document.getElementById('btnOpenEditor');

btnOpenEditor.addEventListener('click', async (e) => {
    const result = await addressSetsEdit()

    if (result) {
        await modalMessage('SUCCEEDED', 'データベースに保存しました', true);
    }

});

