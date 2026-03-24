import { modalMessage } from './modal-alert.js';
import { db, dbSetting } from './db.js';
import { quill } from './quill.js';
import { getSelectedAddressSetIds, applySelectedAddressState, renderAddressOptions } from './address-list_select.js';


export async function saveTemplate() {
    const isOk = await modalMessage('COMFIRM', '現状をテンプレート保存します', false);
    if (!isOk) return await modalMessage('FAILED', '保存はキャンセルされました', true);

    let existingId = undefined;
    let shouldSave = false;

    try {
        const subject = document.getElementById('subject-input').value.trim();
        const htmlBody = quill.getSemanticHTML();
        if (!subject || !htmlBody) return await modalMessage('FAILED', '件名と本文を記入してください', true);

        const addressSetIds = getSelectedAddressSetIds();
        const now = new Date().toLocaleString('ja-JP');

        const currentDbData = await db.templates.toArray();
        const dbMap = new Map(currentDbData.map(item => [item.id, item.subject]));
        const existingItem = currentDbData.find(item => item.subject === subject);


        if (existingItem) {
            existingId = existingItem.id
            const isUpdate = await modalMessage('COMFIRM', '同件名のテンプレートが存在します<br>上書きしますか', false);
            if (isUpdate) shouldSave = true;
        } else {
            shouldSave = true;
        }
        if (shouldSave) {
            await db.templates.put({
                ...(existingId && { id: existingId }),
                subject: subject,
                body: htmlBody,
                addressSetId: addressSetIds,
                updatedAt: now,
                ...(!existingId && { createdAt: now })
            });
            await modalMessage('SUCCEEDED', 'データベースに保存しました', true);
        } else {
            await modalMessage('FAILED', '保存はキャンセルされました', true);
        }

    } catch (error) {
        console.log(error)
        await modalMessage('FAILED', 'データベースに保存できませんでした', true);
    }

};

export const makeTemplateList = async () => {

    const [templates, allSet] = await Promise.all([
        db.templates.toArray(),
        db.addressSets.toArray()
    ]);

    const allhtml = templates.map(item => {
        const allSetsHtml = item.addressSetId.map(id => {
            const set = allSet.find(s => s.id === id);
            const setName = set ? set.setName : '名称未設定';
            return `<span>${setName}</span>`;
        }).join('');
        const plainText = item.body.replace(/<[^>]*>/g, '');
        const templateCard = `
            <label class="mail-template-list-container" for="template-${item.id}">
                <div class="container__card--mail-template">
                    <input type="radio" name="template-group" 
                        value="${item.id}" 
                        data-id="" 
                        id="template-${item.id}"
                        class="card--mail-template">
                    <div class="wrapper-icon">
                        <i class="icon-" aria-hidden="true">
                        </i>
                    </div>
                    <div class="wrapper-text">
                        <h3 class="text-subject">${item.subject}</h3>
                        <p class="text-addressee">
                            ${allSetsHtml}
                        </p>
                    </div>
                    <div class="preview-body">
                        <p>
                            ${plainText}
                        </p>
                    </div>
                </div>
            </label>
        `;
        return templateCard;
    }).join('');

    const container = document.getElementById('container-mail-templates');
    if (container) {
        container.innerHTML = allhtml || '<p>テンプレートがありません</p>';
    }
};

export const setTemplate = async () => {
    const targetEl = document.querySelector('input[name="template-group"]:checked');
    if (!targetEl) return;

    const selectedId = Number(targetEl.value);
    const selectedTemplate = await db.templates.get(selectedId);
    if (!selectedTemplate) return;

    await db.settings.put({ id: 1, lastUsedTemplateID: selectedId });
    // document.querySelectorAll('.address-checkbox').forEach(cb => cb.checked = false);

    // 差し込み
    document.getElementById('subject-input').value = selectedTemplate.subject;
    quill.root.innerHTML = selectedTemplate.body;
    const selectedAddressSetsId = selectedTemplate.addressSetId.map(id => {
        const cb = document.querySelector(`.address-checkbox[value="${id}"]`);
        if (cb) cb.checked = true;
    });
    await applySelectedAddressState();
    await renderAddressOptions();
};