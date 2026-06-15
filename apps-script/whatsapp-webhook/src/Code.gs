/**
 * Projet EtR / ORYX - WhatsApp Cloud API webhook MVP
 *
 * Source of truth: GitHub OrXEtR/EtR-core
 * Runtime: Google Apps Script V8
 *
 * Script properties required:
 * - SPREADSHEET_ID : Google Sheet ID for Journal_brut
 * - VERIFY_TOKEN   : Meta WhatsApp webhook verify token
 */

const JOURNAL_SHEET_NAME = 'Journal_brut';

const JOURNAL_HEADERS = [
  'horodatage_reception',
  'source',
  'id_message',
  'numero_expediteur',
  'nom_expediteur',
  'conversation',
  'type_message',
  'texte_original',
  'media_id_whatsapp',
  'lien_media_drive',
  'statut_traitement',
  'classification_ia',
  'criticite',
  'action_creee',
  'commentaire'
];

function getConfig_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value || fallback || '';
}

function requireConfig_(key) {
  const value = getConfig_(key);
  if (!value) {
    throw new Error('Missing script property: ' + key);
  }
  return value;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const mode = e && e.parameter ? e.parameter['hub.mode'] : '';
  const token = e && e.parameter ? e.parameter['hub.verify_token'] : '';
  const challenge = e && e.parameter ? e.parameter['hub.challenge'] : '';
  const verifyToken = requireConfig_('VERIFY_TOKEN');

  if (mode === 'subscribe' && token === verifyToken) {
    return ContentService.createTextOutput(challenge);
  }

  return ContentService.createTextOutput('Forbidden');
}

function doPost(e) {
  const receivedAt = new Date();
  const spreadsheetId = requireConfig_('SPREADSHEET_ID');
  const sheet = getOrCreateJournalSheet_(spreadsheetId);

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    appendRow_(sheet, [
      receivedAt,
      'WHATSAPP_CLOUD',
      'PARSE_ERROR',
      '',
      '',
      '',
      'error',
      e && e.postData ? e.postData.contents : '',
      '',
      '',
      'ERREUR_JSON',
      '',
      '',
      '',
      String(err)
    ]);
    return json_({ ok: false, error: 'JSON_PARSE_ERROR' });
  }

  const rows = extractWhatsAppRows_(payload, receivedAt);
  if (rows.length === 0) {
    appendRow_(sheet, [
      receivedAt,
      'WHATSAPP_CLOUD',
      'NO_MESSAGE',
      '',
      '',
      '',
      'event',
      JSON.stringify(payload),
      '',
      '',
      'A_TRAITER',
      '',
      '',
      '',
      'Payload reçu sans message utilisateur'
    ]);
  } else {
    rows.forEach(function(row) {
      appendRow_(sheet, row);
    });
  }

  return json_({ ok: true, rows: rows.length });
}

function extractWhatsAppRows_(payload, receivedAt) {
  const rows = [];
  const entries = payload.entry || [];

  entries.forEach(function(entry) {
    const changes = entry.changes || [];

    changes.forEach(function(change) {
      const value = change.value || {};
      const metadata = value.metadata || {};
      const contacts = value.contacts || [];
      const messages = value.messages || [];
      const contactName = contacts[0] && contacts[0].profile ? contacts[0].profile.name : '';
      const conversation = metadata.display_phone_number || metadata.phone_number_id || '';

      messages.forEach(function(msg) {
        const type = msg.type || '';
        const parsed = parseMessageContent_(msg, type);

        rows.push([
          receivedAt,
          'WHATSAPP_CLOUD',
          msg.id || '',
          msg.from || '',
          contactName,
          conversation,
          type,
          parsed.text,
          parsed.mediaId,
          '',
          'A_TRAITER',
          '',
          '',
          '',
          ''
        ]);
      });
    });
  });

  return rows;
}

function parseMessageContent_(msg, type) {
  if (type === 'text') {
    return {
      text: msg.text && msg.text.body ? msg.text.body : '',
      mediaId: ''
    };
  }

  if (type && msg[type]) {
    return {
      text: '[' + type + ']',
      mediaId: msg[type].id || ''
    };
  }

  return {
    text: JSON.stringify(msg),
    mediaId: ''
  };
}

function getOrCreateJournalSheet_(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(JOURNAL_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(JOURNAL_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(JOURNAL_HEADERS);
  }

  return sheet;
}

function appendRow_(sheet, row) {
  sheet.appendRow(row);
}

/**
 * Manual test from Apps Script editor.
 * Before running: set Script Properties SPREADSHEET_ID and VERIFY_TOKEN.
 */
function testLocalWebhook() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        entry: [{
          changes: [{
            value: {
              metadata: { display_phone_number: '+52 1 229 950 2880' },
              contacts: [{ profile: { name: 'Anthony test' } }],
              messages: [{
                id: 'wamid.test.001',
                from: '5212299502880',
                type: 'text',
                text: { body: 'Test EtR : contrôle propreté interne Z3 avant soudage.' }
              }]
            }
          }]
        }]
      })
    }
  };

  return doPost(fakeEvent);
}
