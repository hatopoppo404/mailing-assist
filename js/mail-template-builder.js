import { modalMessage } from './modal-alert.js';
import { db, dbSetting } from './db.js';

export async function saveTemplate(quill) {
    const isOk = await modalMessage('COMFIRM', '現状をテンプレート保存します', false);
    if (!isOk) return await modalMessage('FAILED', '保存はキャンセルされました', true);

    let existingId = undefined;
    let shouldSave = false;

    try {
        const subject = document.getElementById('subject-input').value.trim();
        const htmlBody = quill.getSemanticHTML();
        if (!subject || !htmlBody) return await modalMessage('FAILED', 'データベースに保存できませんでした<br>件名と本文を記入してください', true);

        const tableBody = document.querySelector('#selected-address-sets');
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        const addressSetIds = rows.map(tr => {
            const firstTd = tr.querySelector('td:first-child');
            if (!firstTd || !firstTd.dataset.id) return null;

            return Number(firstTd.dataset.id.replace('address-cb-', ''));
        }).filter(id => id !== null);
        const now = new Date().toISOString();

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