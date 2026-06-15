# Projet EtR - GitHub + clasp + Apps Script

## Objectif

Rendre le code Apps Script maintenable :

```text
GitHub gratuit
→ code versionné
→ GitHub Actions
→ clasp
→ Apps Script
```

## 1. Activer Apps Script API

Dans ton compte Google :

```text
https://script.google.com/home/usersettings
→ Google Apps Script API : ON
```

## 2. Installer localement une seule fois

Sur PC :

```bash
npm install -g @google/clasp
clasp login
```

Cela crée un fichier sensible :

```text
~/.clasprc.json
```

Il contient le refresh token Google. Ne jamais le publier.

## 3. Récupérer le Script ID

Dans Apps Script :

```text
Project Settings
→ IDs
→ Script ID
```

Créer localement un fichier temporaire `.clasp.json` :

```json
{
  "scriptId": "TON_SCRIPT_ID",
  "rootDir": "apps-script/whatsapp-webhook/src"
}
```

## 4. Ajouter les secrets GitHub

Dans GitHub :

```text
OrXEtR/EtR-core
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Créer :

```text
CLASPRC_JSON = contenu complet de ~/.clasprc.json
CLASP_JSON  = contenu complet de .clasp.json
```

## 5. Déployer

Le workflow est ici :

```text
.github/workflows/apps-script-whatsapp-webhook-deploy.yml
```

Il se lance :

```text
- automatiquement si modification du dossier apps-script/whatsapp-webhook
- manuellement via Actions → Deploy Apps Script - WhatsApp Webhook → Run workflow
```

## 6. Règle de sécurité

Ne jamais committer :

```text
.clasprc.json
.clasp.json réel
Token Meta
Verify token
Spreadsheet ID si le dépôt est public
```

Les valeurs projet doivent rester dans :

```text
Apps Script Script Properties
GitHub Actions Secrets
```
