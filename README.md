# GRH — Gestion des Ressources Humaines

Application web de gestion RH (React + Vite) avec **base de données persistante**
partagée via un serveur Node (Postgres sur Railway, ou fichiers JSON en local).

## Démarrage local

```bash
npm install
npm run dev:full
```

- Interface : URL Vite (souvent `http://localhost:5173`)
- API / santé : `http://localhost:3000/api/health`

### Postgres local (recommandé)

PostgreSQL 18 est utilisé en local avec la base `grh` :

| Paramètre | Valeur |
|-----------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| Base | `grh` |
| User | `grh` |
| Mot de passe | `grh_local_2026` |

Le fichier `.env` (local, non versionné) contient déjà `DATABASE_URL`.  
Sans Postgres, les données tombent dans le dossier `data/` (JSON).

**Double écriture locale + Railway** (pour vos amis) :

- En local, `VITE_MIRROR_API_URL` pousse aussi chaque sauvegarde vers Railway.
- Pour republier toute la base locale d’un coup :

```bash
npm run server
npm run sync:railway
```

Mode front seul (navigateur uniquement, sans API) :

```bash
npm run dev
```

## Identifiants de démo

| E-mail | Mot de passe | Rôle |
|--------|--------------|------|
| `admin@grh.local` | `admin123` | Administrateur |
| `demo@grh.local` | `demo123` | RH |

Mot de passe Paramètres (base) par défaut : `dbadmin123`

## Persistance

Stores synchronisés navigateur ↔ serveur :

- `parametres` (entreprises, utilisateurs, barèmes, congés…)
- `recrutement` (personnel, administrateurs…)
- `paie` (feuilles de paie B1 / B2)

Au premier chargement avec API disponible : si le cloud est vide, les données déjà présentes dans votre navigateur sont **envoyées** vers le serveur (migration douce).

## GitHub + Railway (mise en ligne pour vos amis)

### 1. GitHub

Le dépôt doit être poussé sur GitHub (voir section déploiement ci-dessous ou demandez à l’assistant de le faire).

### 2. Railway

1. Créez un compte sur [railway.app](https://railway.app) et connectez GitHub.
2. **New Project** → **Deploy from GitHub repo** → choisissez `GRH`.
3. Ajoutez un plugin **PostgreSQL** au projet (Railway injecte `DATABASE_URL`).
4. Déployez : build `npm install && npm run build`, start `npm start`.
5. Générer un domaine public (**Settings → Networking → Generate Domain**).

Vos amis ouvrent l’URL Railway, se connectent avec les comptes démo, et voient **la même base** partagée.

## Modules

1. **Recrutement & Carrière**
2. **Gestion des Présences**
3. **Gestion de Paie**
4. **Paramètres & Sécurité**
5. **Administration RH**
