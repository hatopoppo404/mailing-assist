import { db } from './db.js';
import { quill } from './quill.js';

export const collectCurrentMailData = async () => {
    const settings = await db.settings.get(1);
    const variableValues = await db.variableValues.toArray();

    return {
        subject: document.getElementById('subject-input')?.value.trim() ?? '',
        bodyHtml: quill.root.innerHTML.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'),
        bodyText: quill.getText(),
        selectedAddressSetIds: settings?.lastSelectedAddressSetsIDs ?? [],
        lastUsedTemplateID: settings?.lastUsedTemplateID ?? null,
        variableValues,
        collectedAt: new Date().toISOString()
    };
};

const DEFAULT_MAIL_STYLE = `font-family: 'Yu Gothic', 'Meiryo', sans-serif; font-size: 12px; line-height: 1; color: #222; margin: 0;`;

export const wrapMailHtml = (html, style = DEFAULT_MAIL_STYLE) => {
    const processedHtml = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    * {
        mso-line-height-rule: exactly;
    }
    .ql-size-small{
        font-size: small;
    }

    .ql-size-large {
        font-size: large;
    }

    .ql-size-huge {
        font-size: x-large;
    }
  </style>
</head>
<body>
  <div style="${style}">
    ${html}
  </div>
</body>
</html>`;
    return processedHtml.replace(/<p>/g, '<p style="margin: 0; line-height: 1.2;">');
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

    const targetVariables = variableValues.find(set => set.addressSetId === addressData.id);
    if (targetVariables && targetVariables.values) {
        Object.entries(targetVariables.values).forEach(([key, value]) => {
            if (key) {
                variableMap[key] = replaceLineBr(value) ?? '';
            }
        });
    }

    return variableMap;
};

export const replaceLineBr = (lines) => {
    return lines.replace(/\n/g, '<br>');
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
    const resolvedBodyText = replaceVariables(quill.getText(), variableMap, baseDate);
    const wrappedBodyHtml = wrapMailHtml(resolvedBodyHtml, bodyStyle);

    return {
        // toName: formatAddressee(addressData?.addressee),
        toEmail: addressData?.to ?? '',
        cc: addressData?.cc ?? '',
        bcc: addressData?.bcc ?? '',
        subject: resolvedSubject,
        bodyHtml: wrappedBodyHtml,
        bodyText: resolvedBodyText,
        fileName: buildMailFileName(resolvedSubject, index),
        variableMap
    };
};

export const buildEmlContent = ({ toName = '', toEmail = '', cc = '', bcc = '', subject = '', bodyHtml = '', bodyText = '' }) => {
    const encodedToName = toName ? encodeMimeHeader(toName) : '';
    const encodedSubject = encodeMimeHeader(subject);
    const toHeader = encodedToName ? `${encodedToName} <${toEmail}>` : toEmail;
    const boundary = `boundary_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const headers = [
        `X-Unsent: 1`,
        `To: ${toHeader}`,
        `Subject: ${encodedSubject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`
    ];

    if (cc) headers.splice(2, 0, `Cc: ${cc}`);
    if (bcc) headers.splice(3, 0, `Bcc: ${bcc}`);

    return [
        ...headers,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        bodyText,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        bodyHtml,
        '',
        `--${boundary}--`
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

export const downloadMailFiles = async (mailFiles = []) => {
    if (!mailFiles.length) return;

    for (const mailFile of mailFiles) {
        const content = mailFile.emlContent;

        // const blob = new Blob(['\ufeff', content], { type: 'message/rfc822' });
        const blob = new Blob([content], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const rawName = mailFile.fileName || `mail_${Date.now()}.eml`;
        link.download = rawName.endsWith('.eml') ? rawName : `${rawName}.eml`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        await new Promise(resolve => setTimeout(resolve, 200));
    }
};