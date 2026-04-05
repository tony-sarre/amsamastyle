# Amsama Style — amsama-style.com

Site web de couture africaine pour Aminata Sarre, Winnipeg, Canada.

## Stack technique
- **11ty (Eleventy)** — Générateur de site statique
- **Decap CMS** — Interface admin pour Aminata
- **Netlify** — Hébergement gratuit + formulaires + identité
- **GitHub** — Code source et versioning

## Déploiement

### 1. Créer un repository GitHub
- Créer un nouveau repo sur github.com (ex: `amsama-style`)
- Uploader tout le contenu de ce dossier

### 2. Connecter à Netlify
- Aller sur [netlify.com](https://netlify.com)
- "Add new site" > "Import an existing project" > GitHub
- Sélectionner le repo `amsama-style`
- Build command: `npx @11ty/eleventy`
- Publish directory: `_site`

### 3. Associer le domaine
- Dans Netlify > Site settings > Domain management
- Ajouter `amsama-style.com` (déjà acheté sur Netlify)

### 4. Activer Netlify Identity (admin pour Aminata)
- Netlify > Site settings > Identity > Enable Identity
- Identity > Services > Git Gateway > Enable
- Identity > Invite users > entrer l'email d'Aminata

### 5. Aminata se connecte
- Aller sur `https://amsama-style.com/admin/`
- Se connecter avec email/mot de passe

## Structure des fichiers
```
_data/
  products.json    ← Produits (modifiable via CMS)
  services.json    ← Services et tarifs
  trends.json      ← Tendances mode
  site.json        ← Infos générales (tel, adresse, etc.)
_includes/
  layout.njk       ← Template principal
admin/
  index.html       ← Page admin Decap CMS
  config.yml       ← Configuration du CMS
images/            ← Photos des créations
css/
  style.css        ← Design du site
index.njk          ← Page d'accueil
```

## Modifier le contenu
Aminata peut modifier via `amsama-style.com/admin/` :
- Produits (nom, prix, photo, description FR/EN)
- Services et tarifs
- Tendances mode
- Informations de contact et horaires
