
export function dbSetting(){
    const db = new Dexie("MailingAppDB");

    db.version(1).stores({
        templates: '++id, subject, body, addressSetId, createdAt, updatedAt',
        addressSets: '++id, setName, to, cc, bcc, company, addressee, createdAt, updatedAt',
        settings: 'id, lastUsedTemplateID, lastUsedAddressSets, updatedAt'
    });

    db.open().catch(err => {
        console.error("DBの接続エラー", err.stack || err);
    });
};

