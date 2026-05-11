# CAHIER DE CHARGE - UNIGATE
## Portail d'Inscription Universitaire Intelligent

**Version:** 1.0.0  
**Date:** Mai 2026  
**Phase:** 1 - Enregistrement + Validation de Documents + Machine d'État + Sécurité

---

## 1. PRÉSENTATION GÉNÉRALE DU PROJET

### 1.1 Objectif Global
UniGate est une plateforme web intelligente et complète conçue pour automatiser et simplifier le processus d'inscription et de gestion administrative des universités. Elle offre une expérience utilisateur rationalisée pour les étudiants, les administrateurs et les superviseurs système, tout en intégrant des fonctionnalités avancées de validation, de notification en temps réel et de suivi d'état.

### 1.2 Contexte et Justification
- **Problème:** Les universités font face à des processus d'inscription complexes, manuels et chronophages
- **Solution:** Une plateforme centralisée et automatisée qui gère:
  - L'inscription et l'authentification des utilisateurs
  - La validation des documents et de l'éligibilité
  - La gestion des horaires (emploi du temps)
  - Le suivi des notes et performances
  - L'échange de compétences entre étudiants
  - La gestion des stages
  - Les notifications en temps réel

### 1.3 Portée et Phases
**Phase Actuelle (Phase 1):**
- Système d'enregistrement complet
- Validation de documents
- Machine d'état pour le suivi du processus
- Sécurité et authentification robustes

**Phases Futures:**
- Phase 2: Analytics et reporting avancés
- Phase 3: Intégration avec systèmes externes
- Phase 4: Intelligence artificielle pour recommandations

---

## 2. ARCHITECTURE GLOBALE

### 2.1 Architecture en 3 Couches

```
┌─────────────────────────────────────────────────────────────┐
│               COUCHE PRÉSENTATION (Frontend)               │
│           React 18 + React Router 6 + Tailwind CSS          │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│         COUCHE MÉTIER (Backend)                             │
│  Spring Boot 3.2 + Java 17 + Spring Security + State Machine│
│  - Gestion utilisateurs/authentification                    │
│  - Logique métier pour chaque module                        │
│  - WebSocket pour notifications temps réel                 │
└────────────────────────┬────────────────────────────────────┘
                         │ JDBC/JPA
┌────────────────────────▼────────────────────────────────────┐
│          COUCHE DONNÉES (Persistence)                       │
│         PostgreSQL 15 + Hibernate ORM                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Infrastructure et Déploiement

| Composant | Technology | Détails |
|-----------|-----------|---------|
| **Frontend** | React 18 | Single Page Application |
| **Backend** | Spring Boot 3.2 | Microarchitecture monolithique |
| **Runtime** | Java 17 | JVM |
| **Base de Données** | PostgreSQL 15 | SGBDR relationnelle |
| **Conteneurisation** | Docker & Docker Compose | Déploiement containerisé |
| **Orchestration API** | Spring WebSocket (STOMP) | Communication bidirectionnelle temps réel |
| **Cache** | Spring Cache (Simple) | Amélioration des performances |
| **Authentification** | JWT (jjwt 0.11.5) | Token Bearer pour sécurité API |
| **Email** | Spring Mail + Gmail SMTP | Communication asynchrone |

---

## 3. STACK TECHNOLOGIQUE DÉTAILLÉ

### 3.1 Backend

```xml
Spring Boot Parent: 3.2.3
Java Version: 17 (LTS)

Dependencies Clés:
├── spring-boot-starter-web           (REST API)
├── spring-boot-starter-data-jpa      (ORM/Hibernate)
├── spring-boot-starter-security      (Spring Security 6)
├── spring-boot-starter-websocket     (WebSocket/STOMP)
├── spring-boot-starter-mail          (Email)
├── spring-boot-starter-validation    (Bean Validation)
├── spring-boot-starter-cache         (Caching)
├── spring-boot-starter-aop           (Aspect Oriented Programming)
├── spring-boot-starter-thymeleaf     (Templating pour emails)
├── spring-statemachine-core: 4.0.0   (State Machine)
├── jjwt: 0.11.5                      (JWT)
├── postgresql-driver                 (PostgreSQL)
└── springdoc-openapi                 (Swagger/OpenAPI)
```

### 3.2 Frontend

```json
{
  "core": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-router-dom": "6.22.3",
    "react-scripts": "5.0.1"
  },
  "networking": {
    "axios": "1.6.7",
    "stompjs": "7.0.0",
    "sockjs-client": "1.6.1"
  },
  "styling": {
    "tailwindcss": "3.4.1",
    "postcss": "8.4.35",
    "autoprefixer": "10.4.18"
  }
}
```

### 3.3 Base de Données

```
PostgreSQL 15 (Alpine)
├── Driver: org.postgresql.Driver
├── Dialect: PostgreSQL 9.5+
├── Connection Pool: HikariCP
└── Migrations: Hibernate DDL (update mode)
```

---

## 4. FONCTIONNALITÉS PRINCIPALES

### 4.1 Module Authentification & Autorisation

**Objectif:** Sécuriser l'accès à la plateforme

**Fonctionnalités:**
- ✅ Inscription d'utilisateur (auto-enregistrement pour étudiants)
- ✅ Connexion avec email/password
- ✅ JWT Token avec expiration configurable (24h par défaut)
- ✅ Refresh Token pour renouvellement (7j par défaut)
- ✅ Rôles et permissions multiples:
  - **SUPER_ADMIN**: Accès complet, gestion système
  - **ADMIN**: Gestion universitaire, revue des applications
  - **REVIEWER**: Validation et revue des documents
  - **STUDENT**: Accès à leurs propres données
- ✅ Spring Security 6 pour sécurisation des endpoints
- ✅ Hachage des mots de passe (BCrypt)

**Flux d'authentification:**
```
User Login → Credentials Validation → JWT Generation → Token Response
   ↓
Authorization Header Check → Token Validation → Route Access
```

### 4.2 Module Inscription (Registration)

**Objectif:** Gérer le processus d'inscription des étudiants

**Fonctionnalités:**
- ✅ Formulaire d'inscription multi-étapes
- ✅ Validation des champs (email unique, password fort)
- ✅ Confirmation par email
- ✅ Gestion des périodes d'inscription (configurable par admin)
- ✅ Limitation du nombre d'inscriptions par période
- ✅ Validation des documents obligatoires:
  - Certificat de naissance
  - Diplôme de baccalauréat
  - Avis d'imposition
  - Photo d'identité
- ✅ Machine d'état pour suivi du statut:
  ```
  PENDING → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED → REGISTERED
  ```

**Upload de fichiers:**
- Taille maximale: 10MB par fichier
- Taille totale requête: 50MB max
- Formats acceptés: PDF, JPG, PNG
- Stockage: Répertoire `/app/uploads` (persistent via volume Docker)

### 4.3 Module Éligibilité (Eligibility)

**Objectif:** Valider l'admissibilité des étudiants selon les critères

**Fonctionnalités:**
- ✅ Règles d'éligibilité configurables par admin
- ✅ Critères basés sur:
  - Notes/Moyenne générale
  - Diplômes prérequis
  - Situation administrative
  - Antécédents académiques
- ✅ Validation automatique ou manuelle
- ✅ Notification en temps réel du statut d'éligibilité
- ✅ SLA (Service Level Agreement): 48 heures pour revue

### 4.4 Module Grades (Gestion des Notes)

**Objectif:** Enregistrer, consulter et gérer les notes des étudiants

**Fonctionnalités:**
- ✅ Configuration des types de notes (CC, Exam, TP, Projet)
- ✅ Entrée et modification des notes par enseignants
- ✅ Calcul automatique des moyennes
- ✅ Consultation par étudiants
- ✅ Export des bulletins en PDF
- ✅ Historique des modifications
- ✅ Seuils de passage configurables

### 4.5 Module Emploi du Temps (Timetable)

**Objectif:** Gérer et consulter l'emploi du temps des étudiants

**Fonctionnalités:**
- ✅ Création d'emploi du temps par admin/enseignant
- ✅ Gestion des salles de classe
- ✅ Affectation des étudiants aux groupes
- ✅ Gestion des enseignants
- ✅ Prévention des conflits d'horaire
- ✅ Export calendrier (iCalendar)
- ✅ Notifications de changement d'horaire
- ✅ Vue jour/semaine/mois

### 4.6 Module Stages (Internship)

**Objectif:** Gérer les demandes et suivi des stages

**Fonctionnalités:**
- ✅ Annuaire des entreprises partenaires
- ✅ Offres de stages disponibles
- ✅ Candidature à des stages
- ✅ Suivi du statut de candidature
- ✅ Attribution des stages
- ✅ Fiche de suivi du stagiaire
- ✅ Évaluation de fin de stage
- ✅ Génération de certificats

### 4.7 Module Échange de Compétences (SkillSwap)

**Objectif:** Faciliter l'échange de compétences entre étudiants

**Fonctionnalités:**
- ✅ Annuaire des compétences disponibles
- ✅ Profils de compétences des étudiants
- ✅ Demandes d'échange de compétences
- ✅ Chat/Messagerie entre étudiants
- ✅ Notation et avis après échange
- ✅ Certification d'échange
- ✅ Statistiques de compétences

### 4.8 Module Notifications

**Objectif:** Informer les utilisateurs en temps réel

**Fonctionnalités:**
- ✅ Notifications push via WebSocket (STOMP)
- ✅ Notifications email asynchrones (Thymeleaf + SMTP)
- ✅ Types de notifications:
  - Inscription confirmée
  - Résultat éligibilité
  - Nouvelles notes
  - Changement emploi du temps
  - Réponse à demande de stage
  - Nouvelle offre de stage
  - Message reçu en SkillSwap
- ✅ Préférences de notification par utilisateur
- ✅ Historique des notifications

### 4.9 Module Administration (Admin Dashboard)

**Objectif:** Interface de gestion pour administrateurs

**Fonctionnalités:**
- ✅ Dashboard avec KPIs en temps réel
- ✅ Gestion des utilisateurs (CRUD)
- ✅ Revue des applications d'inscription
- ✅ Configuration des règles d'éligibilité
- ✅ Configuration des grades et notes
- ✅ Gestion des périodes d'inscription
- ✅ Logs d'activité et audit trail
- ✅ Reports et analytics

### 4.10 Module Super Admin

**Objectif:** Gestion système complète

**Fonctionnalités:**
- ✅ Gestion des admins
- ✅ Gestion des départements/facultés
- ✅ Configuration des périodes d'inscription globales
- ✅ Logs d'audit complets
- ✅ Statistiques système
- ✅ Configuration des paramètres globaux
- ✅ Sauvegarde et restauration (futures)

---

## 5. MODÈLE DE DONNÉES

### 5.1 Entités Principales

```
User (Utilisateur)
├── id: UUID
├── email: String (unique)
├── password: String (bcrypt)
├── firstName: String
├── lastName: String
├── role: Enum [STUDENT, ADMIN, REVIEWER, SUPER_ADMIN]
├── department: FK → Department
├── createdAt: Timestamp
└── updatedAt: Timestamp

Student (Étudiant)
├── id: UUID
├── user: FK → User
├── matricule: String (unique)
├── dateOfBirth: Date
├── gender: Enum
├── address: String
├── phone: String
├── nationalId: String
├── department: FK → Department
└── majorSubject: String

Registration (Inscription)
├── id: UUID
├── student: FK → Student
├── registrationPeriod: FK → RegistrationPeriod
├── status: Enum [PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, REGISTERED]
├── documents: Collection → Document
├── eligibility: FK → Eligibility
├── submittedAt: Timestamp
├── reviewedAt: Timestamp
├── reviewedBy: FK → User
└── comments: String

Document
├── id: UUID
├── registration: FK → Registration
├── documentType: Enum [BIRTH_CERTIFICATE, DIPLOMA, TAX_NOTICE, PHOTO]
├── filePath: String
├── fileName: String
├── fileSize: Long
├── mimeType: String
├── uploadedAt: Timestamp
├── status: Enum [PENDING, VALIDATED, REJECTED]
└── validationComments: String

Eligibility (Éligibilité)
├── id: UUID
├── registration: FK → Registration
├── isEligible: Boolean
├── criteria: JSON (critères validés)
├── score: Decimal
├── checkedAt: Timestamp
├── checkedBy: FK → User
└── notes: String

Grade (Note)
├── id: UUID
├── student: FK → Student
├── course: FK → Course
├── subject: String
├── courseType: Enum [CC, EXAM, TP, PROJECT]
├── value: Decimal
├── outOf: Decimal (100)
├── weight: Decimal
├── gradedAt: Timestamp
└── gradedBy: FK → Teacher

Course (Cours)
├── id: UUID
├── code: String (unique)
├── name: String
├── credits: Integer
├── department: FK → Department
├── teachers: Collection → Teacher
├── students: Collection → Student
└── courseType: String

TimeSlot (Créneaux)
├── id: UUID
├── course: FK → Course
├── room: FK → Room
├── teacher: FK → Teacher
├── dayOfWeek: Enum [MON, TUE, WED, THU, FRI, SAT, SUN]
├── startTime: Time
├── endTime: Time
├── capacity: Integer
├── academicYear: String
└── semester: Integer

Internship (Stage)
├── id: UUID
├── offerId: FK → InternshipOffer
├── student: FK → Student
├── company: String
├── startDate: Date
├── endDate: Date
├── status: Enum [PENDING, ACCEPTED, ONGOING, COMPLETED, REJECTED]
├── mentor: String
├── evaluation: FK → InternshipEvaluation
└── certificate: Blob

SkillSwap (Échange de Compétences)
├── id: UUID
├── initiator: FK → Student
├── target: FK → Student
├── skillOffered: String
├── skillRequested: String
├── status: Enum [PENDING, ACCEPTED, COMPLETED, REJECTED]
├── rating: Integer [1-5]
└── feedback: String

Notification
├── id: UUID
├── user: FK → User
├── type: Enum
├── title: String
├── message: String
├── relatedEntity: String (polymorphe)
├── isRead: Boolean
├── createdAt: Timestamp
└── readAt: Timestamp

Department (Département)
├── id: UUID
├── code: String (unique)
├── name: String
├── faculty: String
├── head: FK → User
├── budget: Decimal
└── createdAt: Timestamp

RegistrationPeriod (Période d'Inscription)
├── id: UUID
├── name: String
├── startDate: Date
├── endDate: Date
├── capacity: Integer
├── enrolled: Integer
├── academicYear: String
├── isActive: Boolean
└── createdBy: FK → User

AuditLog (Journal d'Audit)
├── id: UUID
├── user: FK → User
├── action: String
├── entityType: String
├── entityId: UUID
├── changes: JSON
├── timestamp: Timestamp
├── ipAddress: String
└── userAgent: String
```

### 5.2 Relations Principales

```
User (1) ──→ (N) Registration
User (1) ──→ (N) AuditLog
User (1) ──→ (N) Notification

Student (1) ──→ (1) User
Student (1) ──→ (N) Grade
Student (1) ──→ (N) TimeSlot
Student (1) ──→ (N) Internship
Student (1) ──→ (N) SkillSwap

Registration (1) ──→ (N) Document
Registration (1) ──→ (1) Eligibility

Grade (N) ──→ (1) Course
Grade (N) ──→ (1) Student

Course (N) ──→ (N) Student (many-to-many)
Course (1) ──→ (N) TimeSlot

TimeSlot (N) ──→ (1) Room
TimeSlot (N) ──→ (1) Teacher

Internship (N) ──→ (1) InternshipOffer
Internship (N) ──→ (1) Company

SkillSwap (N) ──→ (1) Student (initiator)
SkillSwap (N) ──→ (1) Student (target)
```

---

## 6. FLUX DE TRAVAIL PRINCIPAUX

### 6.1 Flux d'Enregistrement d'un Étudiant

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ACCUEIL - Page d'Enregistrement                          │
│    - Formulaire multi-champs (nom, email, password, etc.)   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Soumettre
┌─────────────────────▼───────────────────────────────────────┐
│ 2. VALIDATION - Serveur Backend                            │
│    - Vérifier unicité email                                 │
│    - Valider format password (force)                        │
│    - Hasher password avec BCrypt                            │
│    - Créer compte User + Student                            │
└─────────────────────┬───────────────────────────────────────┘
                      │ Succès
┌─────────────────────▼───────────────────────────────────────┐
│ 3. CONFIRMATION - Email de Confirmation                    │
│    - Générer lien de confirmation (JWT temporaire)          │
│    - Envoyer email avec Thymeleaf template                  │
│    - Attendre clic du lien                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ Clic lien confirmation
┌─────────────────────▼───────────────────────────────────────┐
│ 4. ACTIVATION - Compte Activé                              │
│    - Marquer compte comme actif                             │
│    - Créer premier enregistrement (PENDING)                 │
│    - Rediriger vers formulaire d'enregistrement complet     │
└─────────────────────┬───────────────────────────────────────┘
                      │ Soumettre documents
┌─────────────────────▼───────────────────────────────────────┐
│ 5. TÉLÉCHARGEMENT DOCUMENTS - Upload Fichiers              │
│    - Certificate de naissance                              │
│    - Diplôme de baccalauréat                                │
│    - Avis d'imposition                                      │
│    - Photo d'identité                                       │
│    - Validation: format, taille, vérification              │
└─────────────────────┬───────────────────────────────────────┘
                      │ Documents uploadés
┌─────────────────────▼───────────────────────────────────────┐
│ 6. STATE MACHINE - Transition PENDING → SUBMITTED           │
│    - Marquer registration comme SUBMITTED                   │
│    - Notifier admin/reviewer                                │
│    - Déclencher revue automatique d'éligibilité             │
└─────────────────────┬───────────────────────────────────────┘
                      │ Review automatique + manuelle
┌─────────────────────▼───────────────────────────────────────┐
│ 7. REVUE D'ÉLIGIBILITÉ - Admin/Reviewer                    │
│    - Vérifier documents (validité, authenticité)           │
│    - Appliquer règles d'éligibilité                         │
│    - Créer Eligibility record                               │
│    - Décision: APPROVED ou REJECTED                         │
│    - SLA: 48 heures                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │ APPROVED               │ REJECTED
    ┌────▼─────────┐        ┌────▼─────────┐
    │ 8. APPROVED  │        │ 9. REJECTED  │
    │ Transition → │        │ Feedback +   │
    │ REGISTERED   │        │ Appel        │
    │ Notif email  │        │ Notif email  │
    └──────────────┘        └──────────────┘
```

### 6.2 Flux de Consultation des Grades

```
Étudiant accède → Page Grades (protected)
                    ↓
            Backend récupère Student
                    ↓
        Requête à database pour grades
                    ↓
        Retourner Liste [Grade] + Moyennes
                    ↓
    Frontend affiche tableau notes
                    ↓
     Possibilité export PDF/email
```

### 6.3 Flux Notification Temps Réel (WebSocket)

```
Événement backend                   Frontend (WebSocket connection)
(ex: Nouvelle note)                      ↓
     ↓                        Connected via STOMP
Backend publishe              (stomp /user/queue/notifications)
  message → Message Broker            ↓
     ↓                         Reçoit notification
Broker route vers             Affiche toast/badge
étudiant spécifique                    ↓
     ↓                     Utilisateur clique
Frontend reçoit            Redirection vers page
notification              (ex: Voir notes)
```

---

## 7. SÉCURITÉ ET CONFORMITÉ

### 7.1 Authentification et Autorisation

| Aspect | Implémentation |
|--------|-----------------|
| **Stockage Passwords** | BCrypt avec salt (Spring Security) |
| **JWT Token** | HMAC-SHA256, 24h expiration (86400000ms) |
| **Refresh Token** | 7 jours expiration (604800000ms) |
| **CORS** | Configuré pour frontend localhost:3000 |
| **CSRF** | Disabled (API stateless avec JWT) |
| **API Rate Limiting** | À implémenter (future) |

### 7.2 Protection des Données

- ✅ HTTPS en production (recommandé)
- ✅ Chiffrement passwords (BCrypt)
- ✅ Masquage informations sensibles en logs
- ✅ Upload documents sécurisé (validation type/taille)
- ✅ Isolation données par utilisateur (User-based filtering)
- ✅ Audit trail complet (AuditLog)

### 7.3 Gestion des Fichiers

```
Upload Directory: /app/uploads
├── student_<id>/
│   ├── birth_certificate_<timestamp>.pdf
│   ├── diploma_<timestamp>.pdf
│   ├── tax_notice_<timestamp>.pdf
│   └── photo_<timestamp>.jpg
└── ...

Validations:
- Max file size: 10MB
- Allowed MIME: application/pdf, image/jpeg, image/png
- Virus scan: À ajouter (ClamAV future)
```

### 7.4 Conformité

- ✅ RGPD: Droit à l'oubli (à implémenter)
- ✅ CCPA: Privacy policy (à créer)
- ✅ Logs audit trail complets (AuditLog entity)
- ✅ Immuabilité des documents soumis
- ✅ Gestion consentement données

---

## 8. PROCESSUS ET WORKFLOWS

### 8.1 Gestion des Périodes d'Inscription

```
Super Admin crée Période (RegistrationPeriod)
├── Nom: "L1 2025-2026 Fall"
├── Start Date: 2025-09-01
├── End Date: 2025-09-30
├── Capacity: 500
└── Academic Year: 2025-2026

Pendant la période:
- Étudiants peuvent s'inscrire
- Inscription automatiquement associée à period
- Capacity check lors de validation
- Admin peut clôturer période manuellement

Après clôture:
- Plus d'inscriptions acceptées
- Rapports générés
- SLA revue vérifié (48h)
```

### 8.2 Gestion des Règles d'Éligibilité

```
Admin configure règles dans GradeConfigPage
├── Moyenne minimum: 12/20
├── Diplômes prérequis: Bac scientifique
├── Antécédents: Pas de renvoi
└── Situation administrative: OK

À chaque revue:
- Système applique règles automatiquement
- Calcule score d'éligibilité
- Reviewer peut override décision
- Historique conservé
```

### 8.3 SLA (Service Level Agreement) - 48 Heures

```
Timeline:
├── T0: Student soumet inscription (SUBMITTED state)
│   └── Notification auto-envoyée à reviewers
├── T+24h: Vérification status
│   └── Si pas encore revue → Alert to admins
├── T+48h: DEADLINE
│   ├── Si approuvé → REGISTERED
│   ├── Si rejeté → REJECTED (feedback obligatoire)
│   └── Si pas revue → AUTO-APPROVED (option configurable)
└── Rapport SLA généré
```

---

## 9. INTERFACES UTILISATEUR (UI/UX)

### 9.1 Rôles et Accès

```
┌─────────────────────┬──────────────────┬──────────────┬────────────────┐
│ Fonctionnalité      │ Student          │ Admin/Rev    │ Super Admin    │
├─────────────────────┼──────────────────┼──────────────┼────────────────┤
│ Dashboard           │ Perso (notes,    │ Global KPIs, │ KPIs système,  │
│                     │ emploi temps)    │ users, apps  │ tous les users │
│ Registration        │ Soumettre        │ Reviewer     │ Manager        │
│ Grades              │ View perso       │ Enter/Update │ View all       │
│ Timetable           │ View perso       │ Create/Edit  │ Manager        │
│ Internship          │ Candidater       │ Attribution  │ Manager        │
│ SkillSwap           │ Participer       │ Monitor      │ Monitor        │
│ Configuration       │ —                │ Configure    │ Manager        │
│ Audit Log           │ —                │ View perso   │ View all       │
└─────────────────────┴──────────────────┴──────────────┴────────────────┘
```

### 9.2 Pages Principales

#### Frontend (React)

```
/
├── /login                    (LoginPage)
├── /register                 (RegisterPage)
└── /home                     (HomeRedirect)

/student (Protected: STUDENT)
├── /student/                 (StudentDashboard)
├── /student/grades           (GradesPage)
├── /student/registration     (ApplicationStatus)
├── /student/documents        (DocumentUpload)
├── /student/timetable        (TimetablePage)
├── /student/internship       (InternshipsPage)
├── /student/skillswap        (SkillSwapPage)
└── /student/notifications    (NotificationsPage)

/admin (Protected: ADMIN, REVIEWER)
├── /admin/                   (AdminDashboard)
├── /admin/applications       (ApplicationReview)
├── /admin/grades             (GradeConfigPage)
├── /admin/eligibility        (EligibilityRulesPage)
└── /admin/notifications      (NotificationsPage)

/super-admin (Protected: SUPER_ADMIN)
├── /super-admin/             (SuperAdminDashboard)
├── /super-admin/admins       (SuperAdminAdmins)
├── /super-admin/departments  (SuperAdminDepartments)
├── /super-admin/periods      (SuperAdminRegistrationPeriod)
└── /super-admin/audit        (SuperAdminAuditLog)
```

#### Backend (Spring Boot REST API)

```
Base URL: http://localhost:8081/api

Authentication:
POST   /auth/register
POST   /auth/login
POST   /auth/refresh-token
POST   /auth/logout

Users:
GET    /users/profile
PUT    /users/profile
GET    /users (ADMIN, SUPER_ADMIN)
POST   /users (SUPER_ADMIN)

Registration:
POST   /registrations
GET    /registrations/{id}
PUT    /registrations/{id}
GET    /registrations (admin)
POST   /registrations/{id}/submit
POST   /registrations/{id}/review

Documents:
POST   /documents/upload
GET    /documents/{id}
DELETE /documents/{id}

Grades:
GET    /grades
GET    /grades/student/{studentId}
POST   /grades (ADMIN)
PUT    /grades/{id} (ADMIN)

Timetable:
GET    /timetable
GET    /timetable/student/{studentId}
POST   /timetable (ADMIN)

Internship:
GET    /internships
GET    /internships/offers
POST   /internships/apply
GET    /internships/{id}

SkillSwap:
GET    /skillswap/profiles
GET    /skillswap/offers
POST   /skillswap/request
GET    /skillswap/{id}

Notifications:
GET    /notifications
GET    /notifications/unread
PUT    /notifications/{id}/read

Admin:
GET    /admin/dashboard
POST   /admin/grades/config
POST   /admin/eligibility/rules

Super Admin:
GET    /super-admin/dashboard
POST   /super-admin/admins
GET    /super-admin/departments
POST   /super-admin/periods

API Documentation:
GET    /swagger-ui.html
GET    /api-docs
```

---

## 10. DÉPLOIEMENT ET INFRASTRUCTURE

### 10.1 Stack Docker

```yaml
Services:
├── postgres:15-alpine
│   ├── Port: 5432
│   ├── Volumes: postgres_data (persistent)
│   └── Health Check: pg_isready
├── backend:latest
│   ├── Port: 8081
│   ├── Build: ./backend/Dockerfile
│   ├── Environment: DB config, JWT secret, mail config
│   └── Volumes: uploads (persistent)
└── frontend:latest
    ├── Port: 3000 (mapped)
    ├── Build: ./frontend/Dockerfile
    └── Nginx: Reverse proxy

Networks: unigate-network
Volumes:
├── postgres_data
└── uploads
```

### 10.2 Configuration Environnement (.env)

```bash
# Database
DB_NAME=unigate_db
DB_USER=unigate_user
DB_PASSWORD=unigate_pass_2025

# JWT
JWT_SECRET=UniGateSuperSecretJwtKeyThatIsAtLeast256BitsLongForHS256Algorithm2025!
JWT_EXPIRATION=86400000       # 24h en ms
JWT_REFRESH_EXPIRATION=604800000  # 7j en ms

# Mail (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Paths
APP_UPLOAD_DIR=/app/uploads
FRONTEND_URL=http://localhost:3000

# Server
SERVER_PORT=8080
```

### 10.3 Commandes de Déploiement

```bash
# Build et démarrage
docker-compose up --build

# Arrêt et nettoyage
docker-compose down -v

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Redémarrer un service
docker-compose restart backend

# Shell dans container
docker exec -it unigate-backend bash
docker exec -it unigate-postgres psql -U unigate_user -d unigate_db
```

### 10.4 URLs de Développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| Swagger/API Docs | http://localhost:8081/swagger-ui.html |
| PostgreSQL | localhost:5432 |

---

## 11. TESTS ET QUALITÉ

### 11.1 Couverture de Tests (Attendue)

| Module | Unit | Integration | E2E |
|--------|------|-------------|-----|
| Authentication | ✅ | ✅ | ✅ |
| Registration | ✅ | ✅ | ✅ |
| Grades | ✅ | ✅ | ✅ |
| Eligibility | ✅ | ✅ | ⏳ |
| Timetable | ✅ | ⏳ | ⏳ |
| Internship | ✅ | ⏳ | ⏳ |
| SkillSwap | ✅ | ⏳ | ⏳ |

### 11.2 Outils de Qualité

- **Testing Framework**: JUnit 5 (Backend), Jest (Frontend)
- **Mocking**: Mockito, @MockBean
- **Coverage**: JaCoCo (target: >80%)
- **Linting**: Checkstyle (Backend), ESLint (Frontend)
- **Formatting**: Google Java Format, Prettier
- **Build**: Maven (Backend), npm (Frontend)

### 11.3 Checklist de Qualité

- [ ] Tous les tests passent
- [ ] Coverage > 80%
- [ ] Pas de warnings de sécurité (OWASP)
- [ ] Pas de warnings de linting
- [ ] Documentation API Swagger générée
- [ ] README mis à jour
- [ ] CHANGELOG mis à jour

---

## 12. PERFORMANCE ET SCALABILITÉ

### 12.1 Optimisations Implémentées

- ✅ **JPA Lazy Loading**: Chargement à la demande des relations
- ✅ **Query Optimization**: Projections, native queries où nécessaire
- ✅ **Caching**: Spring Cache simple (future: Redis)
- ✅ **Pagination**: Pour listes grandes (registrations, grades, etc.)
- ✅ **Database Indexing**: Sur colonnes fréquemment cherchées
- ✅ **Async Processing**: Email envoi asynchrone (@EnableAsync)
- ✅ **Connection Pooling**: HikariCP configuré

### 12.2 Métriques de Performance

| Métrique | Target | Statut |
|----------|--------|--------|
| Response Time (API) | <500ms | À tester |
| DB Query Time | <100ms | À tester |
| Upload File | <5s | À tester |
| Concurrent Users | 1000+ | À tester |
| Database Connections | 10-20 pool | Configuré |

### 12.3 Scalabilité Future

- Passage à **PostgreSQL managed** (AWS RDS, Azure Database)
- **Redis** pour caching distribué
- **Message Queue** (RabbitMQ) pour async processing
- **Kubernetes** pour orchestration
- **Load Balancer** (Nginx) devant backend

---

## 13. MAINTENANCE ET OPÉRATIONS

### 13.1 Backup Strategy

```
Daily Backups:
- Database backup (pg_dump) → S3/Cloud Storage
- Documents backup (uploads folder) → Cloud Storage
- Retention: 30 jours

Weekly Full Backup:
- Retention: 3 mois
```

### 13.2 Monitoring et Logging

```
Logs:
- Com.unigate: DEBUG
- Spring Security: WARN
- Spring Statemachine: WARN
- Location: /var/log/unigate/

Monitoring (future):
- Prometheus + Grafana
- Health checks: /actuator/health
- Metrics endpoint: /actuator/metrics
```

### 13.3 Patches et Updates

- **Critical Security**: Apply within 24h
- **High Priority**: Within 1 week
- **Regular Updates**: Monthly window
- **Testing Required**: Before production deployment

---

## 14. DOCUMENTATION

### 14.1 Documentation Technique

- ✅ README.md (Quick start)
- ✅ Architecture diagram (Mermaid)
- ✅ Database schema (ERD)
- ✅ API Swagger/OpenAPI
- ✅ Deployment guide
- ⏳ Developer setup guide
- ⏳ Troubleshooting guide

### 14.2 Documentation Utilisateur

- ⏳ User manual (Student)
- ⏳ Admin guide
- ⏳ Video tutorials
- ⏳ FAQ

---

## 15. TIMELINE ET PHASES FUTURES

### Phase 1 (Actuelle - Mai 2026)
- ✅ Système d'enregistrement complet
- ✅ Authentification sécurisée
- ✅ Gestion des documents
- ✅ Machine d'état
- ✅ Notifications
- ✅ Modules de base (Grades, Timetable, etc.)

### Phase 2 (Q3 2026)
- [ ] Analytics avancé
- [ ] Reporting complet
- [ ] Performance optimization
- [ ] Mobile app (React Native)

### Phase 3 (Q4 2026)
- [ ] Intégration LDAP/Active Directory
- [ ] Single Sign-On (SAML)
- [ ] Intégration systèmes externes
- [ ] Machine Learning recommendations

### Phase 4 (2027)
- [ ] IA pour recommendation de stages
- [ ] Chatbot support
- [ ] API publique pour partenaires
- [ ] Blockchain pour certificats

---

## 16. RESSOURCES REQUISES

### 16.1 Équipe

- 1x Architecte Solutions
- 2x Backend Developers (Java/Spring)
- 2x Frontend Developers (React)
- 1x DevOps Engineer (Docker/K8s)
- 1x QA Engineer
- 1x Product Manager
- 1x UX/UI Designer

### 16.2 Infrastructure (Développement)

```
Développement Local:
- Docker Desktop: 8GB RAM, 4 vCPU
- IDE: VS Code / IntelliJ IDEA
- Git: GitHub/GitLab

Production (Estimé):
- Server: 2x Backend Instances (2 vCPU, 4GB RAM)
- Database: PostgreSQL Managed (4 vCPU, 16GB RAM)
- Storage: 100GB uploads storage
- CDN: CloudFront / Cloudflare
```

### 16.3 Budget (Estimé)

| Item | Cost/Month |
|------|-----------|
| Server (Backend) | $200 |
| Database (Managed) | $300 |
| Storage (S3) | $50 |
| CDN | $100 |
| Monitoring/Logging | $100 |
| **Total** | **$750/month** |

---

## 17. RISQUES ET MITIGATION

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| Data Loss | Critique | Daily backups, disaster recovery plan |
| Security Breach | Critique | WAF, encryption, audits réguliers |
| Performance Dégradation | High | Monitoring, auto-scaling, caching |
| DB Corruption | High | PITR, backups, validation queries |
| Accès Non Autorisé | High | JWT, Role-based access control |
| Perte de Availability | High | Multi-region, failover, SLA 99.9% |

---

## 18. CONTACTS ET ESCALADE

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| Tech Lead | — | — |
| Product Manager | — | — |
| DevOps Contact | — | — |
| Support 24/7 | — | — |
| Emergency Escalation | — | — |

---

## 19. APPROVALS

| Rôle | Nom | Signature | Date |
|------|-----|----------|------|
| Product Owner | — | — | — |
| Technical Lead | — | — | — |
| Project Manager | — | — | — |
| Quality Lead | — | — | — |

---

## 20. ANNEXES

### Annexe A: Glossaire Technique

| Terme | Définition |
|-------|-----------|
| JWT | JSON Web Token - Standard pour tokens stateless |
| STOMP | Simple Text Oriented Messaging Protocol |
| ORM | Object-Relational Mapping (Hibernate) |
| DAO | Data Access Object Pattern |
| DTO | Data Transfer Object |
| CSRF | Cross-Site Request Forgery |
| BCrypt | Password hashing algorithm |
| SLA | Service Level Agreement |
| CRUD | Create, Read, Update, Delete |
| RESTful | Representational State Transfer |
| WebSocket | Protocol for bidirectional communication |
| PostgreSQL | Open-source relational database |
| Docker Compose | Tool for defining multi-container applications |

### Annexe B: Références

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Reference](https://spring.io/projects/spring-security)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [JWT Introduction](https://jwt.io/introduction)

### Annexe C: Fichiers Clés du Projet

```
unigate/
├── README.md                    # Quick start
├── docker-compose.yml           # Infrastructure as Code
├── .env                         # Configuration
├── backend/
│   ├── pom.xml                 # Maven dependencies
│   ├── Dockerfile              # Backend containerization
│   ├── src/main/java/com/unigate/
│   │   ├── UnigateApplication.java
│   │   ├── authentication/     # Auth module
│   │   ├── registration/       # Registration module
│   │   ├── eligibility/        # Eligibility module
│   │   ├── grades/             # Grades module
│   │   ├── timetable/          # Timetable module
│   │   ├── internship/         # Internship module
│   │   ├── skillswap/          # SkillSwap module
│   │   ├── notification/       # Notification module
│   │   └── common/             # Shared utilities
│   └── src/main/resources/
│       └── application.yml     # Spring config
└── frontend/
    ├── package.json            # NPM dependencies
    ├── Dockerfile              # Frontend containerization
    └── src/
        ├── App.js              # Main component
        ├── pages/              # Page components
        ├── components/         # Reusable components
        ├── services/           # API services
        ├── context/            # React Context
        └── i18n/               # Internationalization
```

---

## 21. CONCLUSION

UniGate est une plateforme complète, moderne et sécurisée conçue pour transformer les processus d'administration universitaire. Basée sur un stack technologique éprouvé (Spring Boot 3.2, React 18, PostgreSQL 15) et suivant les meilleures pratiques de développement, elle offre une solution scalable, maintenable et orientée utilisateur.

Le projet s'engage à livrer une première phase robuste couvrant l'enregistrement, la validation et la gestion de base, avec une roadmap claire pour les phases futures incluant analytics, machine learning et intégrations avancées.

**Document Version:** 1.0.0  
**Dernière Mise à Jour:** Mai 2026  
**Prochaine Révision:** Septembre 2026
