import { db } from './db.js';
import { modalMessage } from './modal-alert.js';

export async function addressSetsEdit() {
    return new Promise(async (resolve) => {
        const editor = document.getElementById('modal-editor');
        const tbody = document.getElementById('address-sets-editor-table');
        const btnOk = document.getElementById('modal-editor__ok');
        const btnCancel = document.getElementById('modal-editor__cancel');
        const btnAdd = document.getElementById('modal-editor__add-row');

        const addRow = async (e) => {
            e.stopPropagation();

            const lastItem = await db.addressSets.orderBy('id').last();
            const newId = lastItem ? lastItem.id + 1 : 1;
            tbody.insertAdjacentHTML('beforeend', `
                <tr data-id="${newId}">
                    <td class="is-start is-end"><input type="text" value="" placeholder="(株)○○"></td>
                    <td class="is-start"><input type="text" value="" placeholder="株式会社○○　資材部"></td>
                    <td class=""><input type="text" value="" placeholder="敬称略：カンマ区切り"></td>
                    <td class=""><input type="text" value="" placeholder="「;」で複数指定"></td>
                    <td class=""><input type="text" value="" placeholder="「;」で複数指定"></td>
                    <td class="is-end"><input type="text" value="" placeholder="「;」で複数指定"></td>
                    <td class="remove-cell is-start is-end">
                        <button class="remove-address-set" data-id="${newId}">
                            <i class="icon-remove" aria-hidden="true">
                                <svg class="icon-backspace" viewBox="0 0 48 36">
                                    <path
                                        d="M36 12L24 24M24 12L36 24M42 2H16L2 18L16 34H42C43.0609 34 44.0783 33.5786 44.8284 32.8284C45.5786 32.0783 46 31.0609 46 30V6C46 4.93913 45.5786 3.92172 44.8284 3.17157C44.0783 2.42143 43.0609 2 42 2Z" />
                                </svg>
                            </i>
                        </button>
                    </td>
                </tr>
            `);
        };

        const removeRow = (e) => {
            const btn = e.target.closest('.remove-address-set');
            if (!btn) return;

            const targetRow = btn.closest('tr');
            const targetId = targetRow?.dataset.id;
            if (!targetId) return;

            if (targetRow) targetRow.remove();
        };

        const onOk = async (e) => {
            e.stopPropagation();

            // 保存する処理を行う
            const currentDbData = await db.addressSets.toArray();
            const dbMap = new Map(currentDbData.map(item => [item.id, item]));
            const now = new Date().toISOString();
            const rows = Array.from(tbody.querySelectorAll('tr'));

            const updatedData = rows.map(row => {
                const id = Number(row.dataset.id);
                const inputs = row.querySelectorAll('input');

                const existingItem = dbMap.get(id);

                return {
                    id: Number(row.dataset.id), // IDを数値に変換
                    setName: inputs[0].value,
                    company: inputs[1].value,
                    addressee: inputs[2].value,
                    to: inputs[3].value,
                    cc: inputs[4].value,
                    bcc: inputs[5].value,
                    createdAt: existingItem ? existingItem.createdAt : now,
                    updatedAt: now
                };
            });

            try {
                await db.addressSets.clear();
                await db.addressSets.bulkPut(updatedData);
                cleanup();
                await modalMessage('SUCCEEDED', 'データベースに保存しました', true);
            } catch (error) {
                cleanup();
                await modalMessage('FAILED', 'データベースに保存できませんでした', true);
            }

            cleanup();
        };

        const onCancel = (e) => {
            e.stopPropagation();
            cleanup();
            resolve(false);
        };

        function cleanup() {
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            btnAdd.removeEventListener('click', addRow);
            tbody.removeEventListener('click', removeRow);
            editor.close();
        };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        btnAdd.addEventListener('click', addRow);
        tbody.addEventListener('click', removeRow);

        const data = await db.addressSets.toArray();
        const htmlRows = data.map(item => `
            <tr data-id="${item.id}">
                <td class="is-start is-end"><input type="text" value="${item.setName || ''}" placeholder="(株)○○"></td>
                <td class="is-start"><input type="text" value="${item.company || ''}" placeholder="株式会社○○　資材部"></td>
                <td class=""><input type="text" value="${item.addressee || ''}" placeholder="敬称略：カンマ区切り"></td>
                <td class=""><input type="text" value="${item.to || ''}" placeholder="「;」で複数指定"></td>
                <td class=""><input type="text" value="${item.cc || ''}" placeholder="「;」で複数指定"></td>
                <td class="is-end"><input type="text" value="${item.bcc || ''}" placeholder="「;」で複数指定"></td>
                <td class="remove-cell is-start is-end">
                    <button class="remove-address-set" data-id="${item.id}">
                        <i class="icon-remove" aria-hidden="true">
                            <svg class="icon-backspace" viewBox="0 0 48 36">
                                <path
                                    d="M36 12L24 24M24 12L36 24M42 2H16L2 18L16 34H42C43.0609 34 44.0783 33.5786 44.8284 32.8284C45.5786 32.0783 46 31.0609 46 30V6C46 4.93913 45.5786 3.92172 44.8284 3.17157C44.0783 2.42143 43.0609 2 42 2Z" />
                            </svg>
                        </i>
                    </button>
                </td>
            </tr>
        `).join('');
        tbody.innerHTML = htmlRows;

        editor.showModal();


    });
};

