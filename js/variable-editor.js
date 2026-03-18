import { db, dbSetting } from './db.js';



export const setVariableEditor = async () => {

    // dbから宛先セット情報取得
    const master = await db.addressSets.toArray();
    const varValMaster = await db.variableValues.toArray();

    // セットされている宛先セットのidを取得
    const selectedIds = Array.from(document.querySelectorAll('.address-checkbox:checked'))
        .map(item => item.value);
    if (selectedIds.length === 0) return;

    // quill本文から変数を取得
    const requiredTags = ["{{会社名}}", "{{宛名}}"]
    const rawTextToMacthes = quill.getText().match(/{{([^}]+)}}/g);
    const uniqueTags = [...new Set([...requiredTags, ...rawTextToMacthes])];
    const columns = ["宛先セット", ...uniqueTags];

    const headerHtml = columns.map((col, index) => {
        let className = "";
        if (index === 0) className = "is-start is-end";
        else if (index === 1) className = "is-start";
        else if (index === columns.length - 1) className = "is-end";

        return `<th class="${className}">${col}</th>`;
    }).join('');

    // 変数差し込み値を入力
    const rowsHtml = selectedIds.map((id) => {
        const targetData = master.find(s => s.id === id);
        if (!targetData) return "";

        const tds = columns.map((label, index) => {
            let valueName = "";
            if (label === "宛先セット") valueName = master.targetData.setName;
            else if (label === "{{会社名}}") valueName = master.targetData.company;
            else if (label === "{{宛名}}") valueName = master.targetData.addressee.replace(/,/g, '様　');

            let className = "";
            if (index === 0) className = "is-start is-end";
            else if (index === 1) className = "is-start";
            else if (index === columns.length - 1) className = "is-end";

            return `<td class="${className}"><textarea data-id="${id}-${label}">${valueName}</textarea></td>`;
        }).join('');
        return `<tr data-id="${id}">${tds}</tr>`;
    }).join('');

    // table反映、表示
    document.getElementById('variable-editor-header').innerHTML = headerHtml;
    document.getElementById('variable-editor-tablebody').innerHTML = rowsHtml;
};