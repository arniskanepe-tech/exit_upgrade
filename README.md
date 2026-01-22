# Disku spēle + Admin v1

Šis projekts satur:
- **Spēli** (index.html + assets)
- **Admin login**: `/admin`
- **Admin paneli**: `/admin/panel`
- **Serveri**: `server.js` (Express)

## Palaišana lokāli (uz datora)
1) Uzinstalē bibliotēkas:
```bash
npm install
```

2) Palaid:
```bash
npm start
```

3) Atver pārlūkā:
- Spēle: `http://localhost:3000/`
- Admin login: `http://localhost:3000/admin`
- Admin panelis: `http://localhost:3000/admin/panel`
- Healthcheck: `http://localhost:3000/health`

## Kā šobrīd strādā Admin
- Login lapā (`/admin`) ievadi **admin atslēgu** → tā tiek saglabāta pārlūkā (`localStorage`).
- Panelis (`/admin/panel`) pārbauda, vai atslēga eksistē.
- Šobrīd atslēga **netiek pārbaudīta serverī** (to pievienosim nākamajos soļos).

## Nākamie soļi (plānots)
- Railway PostgreSQL pieslēgums
- DB tabula `levels`
- API maršruti:
  - `GET /api/levels/active`
  - `GET/POST/PUT /api/admin/levels`
