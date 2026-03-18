// js/editor-setup.js
export function initEditor(containerId) {
    const quill = new Quill(containerId, {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['table'],
                ['link', 'clean']
            ],
            keyboard: {
                bindings: {
                    tab: {
                        key: 9,
                        handler: function (range) {
                            this.quill.insertText(range.index, '\t');
                            return false;
                        }
                    }
                }
            }
        }
    });
    return quill;
}

export const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['table'],
            ['link', 'clean']
        ],
        keyboard: {
            bindings: {
                tab: {
                    key: 9,
                    handler: function (range) {
                        this.quill.insertText(range.index, '\t');
                        return false;
                    }
                }
            }
        }
    }
});
