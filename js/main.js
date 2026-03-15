'use strict';

// 関数インポート
import { modalMessage } from './modal-alert.js';
import { initEditor } from './quill.js';
import { countSelectedAddressSets, selectAddressSets } from './address-list_select.js';

// 変数宣言

const myEditor = initEditor('#editor');
const addressOptions = document.getElementById('address-options');
const pop = document.getElementById("menu__address-sets");

// testbtn.addEventListener('click', async () => {

//     const result = await modalMessage('title', 'message', false);

//     if (result) {
//         alert('done');
//     }
// });

// 宛先選択
addressOptions.addEventListener('change', (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    countSelectedAddressSets(addressOptions);

});
pop.addEventListener("toggle", (e) => {
    // e.newState: "open" or "closed"
    if (e.newState === "closed") selectAddressSets(addressOptions)
});