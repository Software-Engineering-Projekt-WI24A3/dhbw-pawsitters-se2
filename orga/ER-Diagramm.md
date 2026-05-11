# Entity Relationship Diagramm (ERD)

Dieses Diagramm visualisiert das Datenbankmodell der Pawsitters-Applikation basierend auf den JPA-Entitäten (`User`, `Pet`, `Offer`, `Request`) sowie deren Relationen und automatisch generierten Hilfstabellen (für `@ElementCollection`).

```mermaid
erDiagram
    %% Relationen
    USERS ||--o{ PETS : "owns (1:n)"
    USERS ||--o{ OFFERS : "creates as HOST (1:n)"
    USERS ||--o{ REQUESTS : "makes as PET_OWNER (1:n)"
    PETS ||--o{ REQUESTS : "is booked in (1:n)"
    
    %% Element Collections (Join Tables)
    USERS ||--o{ USER_ACCEPTED_PET_SPECIES : "accepts (1:n)"
    OFFERS ||--o{ OFFER_ACCEPTED_PET_SPECIES : "accepts (1:n)"
    OFFERS ||--o{ OFFER_SERVICES : "includes (1:n)"

    %% Tabellen Definitionen
    USERS {
        BIGINT id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR phone
        DATE birth_date
        VARCHAR emergency_contact
        VARCHAR profile_picture
        VARCHAR bio
        DOUBLE rating
        INTEGER number_of_ratings
        VARCHAR role "Enum: PET_OWNER, HOST, ADMIN"
        VARCHAR postal_code
        VARCHAR city
    }

    PETS {
        BIGINT id PK
        VARCHAR name
        VARCHAR species "Enum: PetChoice"
        VARCHAR breed
        INTEGER age
        VARCHAR special_needs
        VARCHAR image_path
        VARCHAR image_hash UK
        BIGINT owner_id FK "References USERS"
    }

    OFFERS {
        BIGINT id PK
        BIGINT host_id FK "References USERS"
        VARCHAR title
        VARCHAR description
        DECIMAL price_per_day
        VARCHAR status "Enum: DRAFT, PUBLISHED"
    }

    REQUESTS {
        BIGINT id PK
        BIGINT pet_owner_id FK "References USERS"
        BIGINT pet_id FK "References PETS"
        DATE start_date
        DATE end_date
        VARCHAR description
        VARCHAR location
        VARCHAR housing_type
        VARCHAR extras
        VARCHAR special_needs
        VARCHAR price
        VARCHAR status "Enum: RequestStatus"
    }

    USER_ACCEPTED_PET_SPECIES {
        BIGINT user_id FK "References USERS"
        VARCHAR species "Enum: PetChoice"
    }

    OFFER_ACCEPTED_PET_SPECIES {
        BIGINT offer_id FK "References OFFERS"
        VARCHAR species "Enum: PetChoice"
    }

    OFFER_SERVICES {
        BIGINT offer_id FK "References OFFERS"
        VARCHAR service_name
        INTEGER position "Order Column"
    }
```
