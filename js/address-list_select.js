
import { db } from './db.js';

export function countSelectedAddressSets(addressOptions) {

    const allCheckboxes = addressOptions.querySelectorAll('input[type="checkbox"]');
    const checkedItems = Array.from(allCheckboxes).filter(cb => cb.checked);
    const countDisplay = document.getElementById('selected-count');

    if (countDisplay) countDisplay.textContent = checkedItems.length;
};

export function selectAddressSets(addressOptions) {

    const allCheckboxes = addressOptions.querySelectorAll('input[type="checkbox"]');
    const checkedItems = Array.from(allCheckboxes).filter(cb => cb.checked);
    const tableBody = document.getElementById('selected-address-sets');

    tableBody.innerHTML = '';
    checkedItems.forEach(cb => {
        const labelText = cb.dataset.setName;
        const checkboxId = cb.id;

        const row = document.createElement('tr');
        row.dataset.id = checkboxId;
        row.innerHTML = `
            <td>${labelText}</td>
            <td class="remove-cell">
                <button class="remove-selected" data-id="${checkboxId}" >
                    <i class="icon-remove" aria-hidden="true">
                        <svg class="icon-backspace" viewBox="0 0 48 36">
                            <path d="M36 12L24 24M24 12L36 24M42 2H16L2 18L16 34H42C43.0609 34 44.0783 33.5786 44.8284 32.8284C45.5786 32.0783 46 31.0609 46 30V6C46 4.93913 45.5786 3.92172 44.8284 3.17157C44.0783 2.42143 43.0609 2 42 2Z" />
                        </svg>
                    </i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (!checkedItems.length) tableBody.innerHTML = `
        <tr>
            <td colspan="2">宛先を選択してください</td>
        </tr>
    `;
};

export async function renderAddressOptions() {
    const addressOptionsUl = document.getElementById('address-options');
    if (!addressOptionsUl) return;

    const [settings, allSets] = await Promise.all([
        db.settings.get(1),
        db.addressSets.toArray()
    ]);

    const selectedIds = settings?.lastSelectedAddressSetsIDs || [];

    const htmlItems = allSets.map(item => {
        // DBの配列にこのIDが含まれているか？（数値同士で比較）
        const isChecked = selectedIds.includes(item.id) ? 'checked' : '';

        return `
            <li>
                <label for="address-cb-${item.id}">
                    <input type="checkbox" 
                           class="address-checkbox"
                           id="address-cb-${item.id}" 
                           data-id="address-cb-${item.id}" 
                           value="${item.id}"
                           data-set-name="${item.setName || '名称未設定'}"
                           ${isChecked}>
                    <span>${item.setName || '名称未設定'}</span>
                </label>
            </li>
        `;
    }).join('');

    addressOptionsUl.innerHTML = htmlItems || '<p>宛先データがありません</p>';

    countSelectedAddressSets(document.getElementById('address-options'));

};

export const removeSelected = async (e) => {
    const btn = e.target.closest('.remove-selected');
    if (!btn) return;

    const targetId = btn.dataset.id;
    if (!targetId) return;

    // 1. チェックボックスを直接IDで取得（dataset.id ではなく id 属性で指定しているため）
    const checkbox = document.getElementById(targetId);
    if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    }
};