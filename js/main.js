'use strict';

import { initModal, showAlert, showConfirm } from './modal-alert.js';
import { initEditor } from './quill.js';

initModal();
const myEditor = initEditor('#editor');