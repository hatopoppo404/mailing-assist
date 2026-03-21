'use strict';

// 関数インポート
import { modalMessage } from './modal-alert.js';
import { quill } from './quill.js';
import { db } from './db.js';
import {
    countSelectedAddressSets,
    selectAddressSets,
    renderAddressOptions,
    removeSelected,
    getSelectedAddressSetIds,
    applySelectedAddressState
} from './address-list_select.js';
import { addressSetsEdit } from './address-sets-editor.js'
import { saveTemplate, makeTemplateList, setTemplate } from './mail-template-builder.js'
import { setVariableEditor, saveAllVariables } from './variable-editor.js'
import { collectCurrentMailData, buildMailFiles } from './save-mails.js'

// 変数宣言
const addressOptions = document.getElementById('address-options');
const selectedAddressTableBody = document.getElementById('selected-address-sets');
const addressPopover = document.getElementById("menu__address-sets");
const btnOpenEditor = document.getElementById('btnOpenEditor');
const btnSaveTemplate = document.getElementById('btn-save-template');
const areaSelectTemplate = document.getElementById('container-mail-templates');
const btnVariableEdit = document.getElementById('btn__variable-edit');
const VariableEditor = document.getElementById('menu__variable-editor');
const btnSaveMails = document.getElementById('save-mails');

// 読み込み時実行
document.addEventListener('DOMContentLoaded', async () => {
    await renderAddressOptions();
    const addressOptions = document.getElementById('address-options');
    if (addressOptions) {
        selectAddressSets(addressOptions);
        countSelectedAddressSets(addressOptions);
    }
    await makeTemplateList();
    await setVariableEditor();
});

// 宛先選択
selectedAddressTableBody.addEventListener('click', removeSelected);

addressOptions.addEventListener('change', async (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;

    await applySelectedAddressState(addressOptions);
    await renderAddressOptions();
    setVariableEditor();
});

addressPopover.addEventListener("toggle", async (e) => {
    if (e.newState === "open") {
        await renderAddressOptions();
    } else {
        selectAddressSets(addressOptions);
    }
});

btnOpenEditor.addEventListener('click', async (e) => {
    await addressSetsEdit()
});

btnSaveTemplate.addEventListener('click', async (e) => {
    await saveTemplate();
    await makeTemplateList();
});

areaSelectTemplate.addEventListener('change', async (e) => {
    await setTemplate();
    await setVariableEditor();
});

btnVariableEdit.addEventListener('click', setVariableEditor);

VariableEditor.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') saveAllVariables();
});

btnSaveMails.addEventListener('click', async () => {
    await saveAllVariables();
    const currentMailData = await collectCurrentMailData();

    const selectedAddresses = await db.addressSets
        .where('id')
        .anyOf(currentMailData.selectedAddressSetIds)
        .toArray();

    const mailFiles = buildMailFiles({
        subject: currentMailData.subject,
        bodyHtml: currentMailData.bodyHtml,
        variableValues: currentMailData.variableValues,
        selectedAddresses
    });

    if (!mailFiles.length) return;

    const firstMail = mailFiles[0];
    const blob = new Blob([firstMail.emlContent], { type: 'message/rfc822;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = firstMail.fileName;
    link.click();

    URL.revokeObjectURL(url);
});