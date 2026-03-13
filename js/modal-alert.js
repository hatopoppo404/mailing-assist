export async function modalMessage(title, message, okOnly) {
    return new Promise((resolve) => {

        // 変数宣言
        const modal = document.getElementById('modal');
        const panel = document.getElementById('modal__panel');
        document.getElementById('modal__title').innerText = title;
        document.getElementById('modal__text').innerText = message;
        const okBtn = document.getElementById('modal__ok');
        const cancelBtn = document.getElementById('modal__cancel');

        // 関数宣言
        const onOverlayClick = (e) => {
            if (!e.target.closest('#modal__panel')) {
                panel.classList.add('shake-animation');
                setTimeout(() => {
                    panel.classList.remove('shake-animation');
                }, 300);
            }
        };
        const onOk = (e) => {
            e.stopPropagation();
            cleanup();
            resolve(true);
        };
        const onCancel = (e) => {
            e.stopPropagation();
            cleanup();
            resolve(false);
        };
        function cleanup() {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onOverlayClick);
            modal.close();
        };

        // 処理
        modal.classList.toggle('okOnly', okOnly);

        modal.addEventListener('click', onOverlayClick);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);

        modal.showModal();
    });
};


// // アラート
// export function showAlert(title, message) {
//     document.getElementById('alertTitle').innerText = title;
//     document.getElementById('alertMessage').innerText = message;
//     document.getElementById('customAlert').classList.add('is-open');

//     document.getElementById('alertClose').focus();
// }

// // 閉じるボタンのイベント
// document.getElementById('alertClose').addEventListener('click', () => {
//     document.getElementById('customAlert').classList.remove('is-open');
// });

// export function showConfirm(title, message) {
//     return new Promise((resolve) => {
//         document.getElementById('confirmTitle').innerText = title;
//         document.getElementById('confirmMessage').innerText = message;
//         const modal = document.getElementById('customConfirm');
//         const confirmWindow = document.getElementById('confirmWindow');

//         modal.classList.add('is-open');

//         modal.addEventListener('click', (e) => {
//             // クリックされたのが「背景」そのものだった場合（中のウィンドウじゃなくて）
//             if (e.target === modal) {
//                 // 揺らすクラスを追加
//                 confirmWindow.classList.add('shake-animation');

//                 // アニメーションが終わったらクラスを外す（次また振れるように）
//                 setTimeout(() => {
//                     confirmWindow.classList.remove('shake-animation');
//                 }, 300);
//             }
//         });

//         const okBtn = document.getElementById('confirmOk');
//         const cancelBtn = document.getElementById('confirmCancel');

//         const onOk = () => {
//             cleanup();
//             resolve(true);
//         };

//         const onCancel = () => {
//             cleanup();
//             resolve(false);
//         };

//         // 後片付け用関数（イベントを消して閉じる）
//         function cleanup() {
//             okBtn.removeEventListener('click', onOk);
//             cancelBtn.removeEventListener('click', onCancel);
//             modal.classList.remove('is-open');
//         }

//         okBtn.addEventListener('click', onOk);
//         cancelBtn.addEventListener('click', onCancel);
//     });
// };