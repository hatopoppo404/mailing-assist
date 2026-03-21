import { db } from './db.js';
import { quill } from './quill.js';

export const collectCurrentMailData = async () => {
    const settings = await db.settings.get(1);
    const variableValues = await db.variableValues.toArray();

    return {
        subject: document.getElementById('subject-input')?.value.trim() ?? '',
        bodyHtml: quill.root.innerHTML,
        bodyText: quill.getText(),
        selectedAddressSetIds: settings?.lastSelectedAddressSetsIDs ?? [],
        lastUsedTemplateID: settings?.lastUsedTemplateID ?? null,
        variableValues,
        collectedAt: new Date().toISOString()
    };
};

const DEFAULT_MAIL_STYLE = `font-family: 'Yu Gothic', 'Meiryo', sans-serif; font-size: 9px; line-height: 1.7; color: #222;`;

export const wrapMailHtml = (html, style = DEFAULT_MAIL_STYLE) => {
    return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
  <div style="${style}">
    ${html}
  </div>
</body>
</html>`;
};

export const formatAddressee = (addressee = '') => {
    const raw = String(addressee ?? '').trim();
    if (!raw) return '';
    return raw.replace(/,/g, '様　') + '様';
};

export const formatDateForMail = (date) => {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
};

export const buildTodayVariableMap = (baseDate = new Date()) => {
    return {
        '{{TODAY}}': formatDateForMail(baseDate)
    };
};

export const replaceVariables = (text, variableMap, baseDate = new Date()) => {
    if (!text) return '';

    return text.replace(/{{TODAY(?:([+-])(\d+))?}}|{{[^}]+}}/g, (tag, operator, offsetDays) => {
        if (tag.startsWith('{{TODAY')) {
            const nextDate = new Date(baseDate);
            const days = Number(offsetDays ?? 0);
            const signedDays = operator === '-' ? -days : days;
            nextDate.setDate(nextDate.getDate() + signedDays);
            return formatDateForMail(nextDate);
        }

        const value = variableMap[tag];
        return value == null ? '' : String(value);
    });
};

export const encodeMimeHeader = (text = '') => {
    if (!text) return '';

    const utf8Bytes = new TextEncoder().encode(String(text));
    let binary = '';

    utf8Bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return `=?UTF-8?B?${btoa(binary)}?=`;
};

export const buildVariableMap = (addressData = {}, variableValues = []) => {
    const variableMap = {
        '{{会社名}}': addressData.company ?? '',
        '{{名前}}': formatAddressee(addressData.addressee),
        ...buildTodayVariableMap()
    };

    variableValues.forEach((item) => {
        if (!item?.variableName) return;
        const tag = `{{${item.variableName}}}`;
        variableMap[tag] = item.value ?? '';
    });

    return variableMap;
};

export const buildMailFileName = (subject = '', index = 0) => {
    const safeSubject = String(subject ?? 'mail').replace(/[\\/:*?"<>|]/g, '_').trim() || 'mail';
    return `${String(index + 1).padStart(3, '0')}_${safeSubject}.eml`;
};

export const buildMailDataForAddress = ({
    addressData,
    subject,
    bodyHtml,
    variableValues,
    index,
    bodyStyle = DEFAULT_MAIL_STYLE
}) => {
    const variableMap = buildVariableMap(addressData, variableValues);
    const baseDate = new Date();
    const resolvedSubject = replaceVariables(subject, variableMap, baseDate);
    const resolvedBodyHtml = replaceVariables(bodyHtml, variableMap, baseDate);
    const wrappedBodyHtml = wrapMailHtml(resolvedBodyHtml, bodyStyle);

    return {
        toName: formatAddressee(addressData?.addressee),
        toEmail: addressData?.to ?? '',
        cc: addressData?.cc ?? '',
        bcc: addressData?.bcc ?? '',
        subject: resolvedSubject,
        bodyHtml: wrappedBodyHtml,
        fileName: buildMailFileName(resolvedSubject, index),
        variableMap
    };
};

export const buildEmlContent = ({ toName = '', toEmail = '', cc = '', bcc = '', subject = '', bodyHtml = '' }) => {
    const encodedToName = toName ? encodeMimeHeader(toName) : '';
    const encodedSubject = encodeMimeHeader(subject);
    const toHeader = encodedToName ? `${encodedToName} <${toEmail}>` : toEmail;
    const headers = [
        `To: ${toHeader}`,
        `Subject: ${encodedSubject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit'
    ];

    if (cc) headers.splice(1, 0, `Cc: ${cc}`);
    if (bcc) headers.splice(2, 0, `Bcc: ${bcc}`);

    return [
        ...headers,
        '',
        bodyHtml
    ].join('\r\n');
};

export const buildMailFiles = ({
    subject,
    bodyHtml,
    variableValues = [],
    selectedAddresses = [],
    bodyStyle = DEFAULT_MAIL_STYLE
}) => {
    return selectedAddresses.map((addressData, index) => {
        const mailData = buildMailDataForAddress({
            addressData,
            subject,
            bodyHtml,
            variableValues,
            index,
            bodyStyle
        });

        return {
            ...mailData,
            emlContent: buildEmlContent(mailData)
        };
    });
};

export const downloadMailFilesAsZip = async (mailFiles = [], zipName = 'mails.zip') => {
    if (!mailFiles.length) return;

    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip is not loaded');
    }

    const zip = new JSZip();

    mailFiles.forEach((mailFile) => {
        zip.file(mailFile.fileName, mailFile.emlContent);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = zipName;
    link.click();

    URL.revokeObjectURL(url);
};
