'use strict';

import { modalMessage } from './modal-alert.js';
import { initEditor } from './quill.js';

const myEditor = initEditor('#editor');

const testbtn = document.getElementById('openBtn')
testbtn.addEventListener('click', async () => {

    const result = await modalMessage('title', 'message', false);

    if (result) {
        alert('done');
    }
});

