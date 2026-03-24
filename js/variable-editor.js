import { db, dbSetting } from './db.js';
import { quill } from './quill.js';
import { getSelectedAddressSetIds } from './address-list_select.js';

/**
 * @param {number} setId - 宛先セットのID（数値）
 * @param {string} label - 変数の名前（例: "{{納期}}"）
 * @param {string} val - ユーザーが入力した中身
 */



export const setVariableEditor = async () => {
    // dbから情報取得
    const master = await db.addressSets.toArray();
    const varValMaster = await db.variableValues.toArray();

    // セットされている宛先セットのidを取得
    const settings = await db.settings.get(1);
    const selectedIds = settings?.lastSelectedAddressSetsIDs ?? [];

    // quill本文から変数を取得
    const requiredTags = ["{{会社名}}", "{{名前}}"]
    const rawSubjectToMacthes = document.querySelector('#subject-input').value?.match(/{{([^}]+)}}/g) ?? [];
    const rawBodyToMacthes = quill.getText().match(/{{([^}]+)}}/g) ?? [];
    const uniqueTags = [...new Set([...requiredTags, ...rawSubjectToMacthes, ...rawBodyToMacthes])];
    const columns = ["宛先セット", ...uniqueTags];

    const headerHtml = columns.map((col, index) => {
        let className = "";
        if (index === 0) className = "is-start is-end";
        else if (index === 1) className = "is-start";
        else if (index === columns.length - 1) className = "is-end";

        return `<th class="${className}">${col}</th>`;
    }).join('');

    if (selectedIds.length === 0) {
        document.getElementById('variable-editor-header').innerHTML = headerHtml
        document.getElementById('variable-editor-tablebody').innerHTML = "宛先が選択されていません";
        return;
    };

    // 変数差し込み値を入力
    const rowsHtml = selectedIds.map((id) => {
        const targetData = master.find(s => s.id === Number(id));
        if (!targetData) return "";
        const savedEntry = varValMaster.find(s => s.addressSetId === Number(id));
        const savedData = savedEntry ? savedEntry.values : {};

        const tds = columns.map((label, index) => {
            let className = "";
            if (index === 0) className = "is-start is-end";
            else if (index === 1) className = "is-start";
            else if (index === columns.length - 1) className = "is-end";

            let valueName = "";
            if (label === "宛先セット") valueName = targetData.setName;
            else if (label === "{{会社名}}") valueName = targetData.company;
            else if (label === "{{名前}}") valueName = (targetData.addressee || "").replace(/,/g, '様　') + "様";
            else valueName = savedData[label] ?? "";

            let innerData = ""
            if (label === "宛先セット" || label === "{{会社名}}" || label === "{{名前}}") {
                innerData = `<p data-id="${id}-${label}" data-label="${label}">${valueName}</p>`
            } else {
                innerData = `<textarea data-id="${id}-${label}" data-label="${label}">${valueName}</textarea>`
            }
            return `<td class="${className}">` + innerData + `</td >`;
        }).join('');
        return `<tr data-id="${id}">${tds}</tr>`;
    }).join('');

    // table反映、表示
    document.getElementById('variable-editor-header').innerHTML = headerHtml;
    document.getElementById('variable-editor-tablebody').innerHTML = rowsHtml;
};

export const saveVariableToDb = async (setId, label, val) => {
    const entry = await db.variableValues.get(setId) || { addressSetId: setId, values: {} };
    const updatedValues = {
        ...entry.values,
        [label]: val
    };
    await db.variableValues.put({
        addressSetId: setId,
        values: updatedValues,
        updatedAt: new Date().toLocaleString('ja-JP')
    });
};

export const saveAllVariables = async () => {
    const rows = document.querySelectorAll('#variable-editor-tablebody tr');

    for (const row of rows) {
        const setId = Number(row.dataset.id);
        const textareas = row.querySelectorAll('textarea');

        const entry = await db.variableValues.get(setId) || { addressSetId: setId, values: {} };
        const newValues = { ...entry.values };

        textareas.forEach(ta => {
            const label = ta.dataset.label;
            const val = ta.value;

            const readonlyLabels = ["宛先セット", "{{会社名}}", "{{名前}}"];
            if (!readonlyLabels.includes(label)) {
                newValues[label] = val;
            }
        });
        await db.variableValues.put({
            addressSetId: setId,
            values: newValues,
            updatedAt: new Date().toLocaleString('ja-JP')
        });
    }
};