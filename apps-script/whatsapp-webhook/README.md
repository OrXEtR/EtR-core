# EtR / ORYX - WhatsApp webhook Apps Script

Objectif : versionner dans GitHub le webhook Apps Script qui reçoit les événements WhatsApp Cloud API et écrit les messages dans le Google Sheet `Journal_brut`.

## Architecture

```text
WhatsApp Cloud API
→ Apps Script Web App doGet/doPost
→ Google Sheet Journal_brut
→ traitement EtR
```

## Fichiers

```text
src/Code.gs           Code Apps Script
src/appsscript.json   Manifest Apps Script
.claspignore          Fichiers envoyés par clasp
package.json          Dépendance @google/clasp
```

## Configuration Apps Script obligatoire

Dans Apps Script :

```text
Project Settings
→ Script Properties
```

Ajouter :

```text
SPREADSHEET_ID = ID du Google Sheet Journal brut EtR
VERIFY_TOKEN   = token choisi pour Meta Webhook Verify Token
```

Ne pas mettre ces valeurs dans le dépôt public.

## Déploiement

Le déploiement CI/CD utilise GitHub Actions + clasp.

Secrets GitHub nécessaires :

```text
CLASPRC_JSON = contenu complet du fichier ~/.clasprc.json généré par clasp login
CLASP_JSON  = contenu complet du fichier .clasp.json du projet cible
```

Le fichier `.clasp.json` ressemble à :

```json
{
  "scriptId": "VOTRE_SCRIPT_ID",
  "rootDir": "apps-script/whatsapp-webhook/src"
}
```

Attention : `.clasprc.json` contient un refresh token Google. Ne jamais le committer.
