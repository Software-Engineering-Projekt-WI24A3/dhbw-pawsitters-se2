Software-Engineering Projekt von Justus Krahl, Raphael Buller & Niklas Ulbrich - Kurs WI24A3 bei Dr. Ana-Maria Nicolaescu

## Lokale Datenbank

Das Backend nutzt MySQL. Fuer lokale Entwicklung kann die Datenbank aus dem Repository-Root gestartet werden:

```bash
docker compose up -d mysql
```

Standardwerte:

- `DB_URL=jdbc:mysql://localhost:3306/pawsitters?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=UTC`
- `DB_USERNAME=pawsitters`
- `DB_PASSWORD=pawsitters`
- `JPA_DDL_AUTO=update`

Die Tests verwenden weiterhin eine isolierte H2-In-Memory-Datenbank und brauchen keine lokale MySQL-Instanz.

![Japan](https://github.com/user-attachments/assets/49667f7b-60a7-4f34-aa31-27685d84e30c)
