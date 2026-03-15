
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
        const labelText = cb.closest('label').querySelector('span').textContent;
        const checkboxId = cb.id;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${labelText}</td>
            <td class="remove-cell">
                <button class="remove-selected">
                    <i class="icon-remove" aria-hidden="true">
                        <svg data-target="${checkboxId}" class="icon-backspace" viewBox="0 0 48 36">
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