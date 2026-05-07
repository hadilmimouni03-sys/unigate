# 📚 UNIGATE - COMPLETE PROJECT DOCUMENTATION

## 📋 TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Modules (Detailed)](#core-modules-detailed)
6. [Data Model & Database](#data-model--database)
7. [Security Implementation](#security-implementation)
8. [API Endpoints](#api-endpoints)
9. [Configuration & Setup](#configuration--setup)
10. [Key Features Implemented](#key-features-implemented)

---

## PROJECT OVERVIEW

**UniGate** = Smart University Registration Portal

**Purpose:** Centralized system for managing student registration, academic records, internships, skill exchange, and administrative processes.

**Type:** Fullstack Application
- **Backend:** Java Spring Boot 3.2.3 (REST API)
- **Frontend:** React (Web UI)
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)

**Java Version:** Java 17
**Build Tool:** Maven

---

## ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│                   React Frontend (3000)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / CORS                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION (Port 8080)             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Security Layer (JWT Filter)                │    │
│  │  - Authenticate requests                           │    │
│  │  - Validate JWT tokens                             │    │
│  │  - Manage sessions (stateless)                     │    │
│  └────────────────────────────────────────────────────┘    │
│                            ↓                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │    REST Controllers & WebSocket Controllers         │    │
│  │  - Registration, Grades, Internship, etc.          │    │
│  │  - Real-time communication (Grades updates)        │    │
│  └────────────────────────────────────────────────────┘    │
│                            ↓                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Business Logic (Services)                │    │
│  │  - ApplicationService (registration flow)          │    │
│  │  - GradeService (academic management)              │    │
│  │  - InternshipService (internship matching)         │    │
│  │  - EligibilityService (rules engine)               │    │
│  └────────────────────────────────────────────────────┘    │
│                            ↓                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │    Data Access Layer (JPA Repositories)            │    │
│  │  - ORM mapping (Entities ↔ Database)               │    │
│  │  - Custom query methods                            │    │
│  │  - Transaction management                          │    │
│  └────────────────────────────────────────────────────┘    │
│                            ↓                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │   AOP Aspects (Cross-Cutting Concerns)             │    │
│  │  - AuditAspect: log all admin actions              │    │
│  │  - Authentication checks                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  - 21 entity tables                                          │
│  - Relationships (1:1, 1:M, M:M)                             │
│  - Audit logs & system tables                               │
└─────────────────────────────────────────────────────────────┘
```

### Layered Architecture Pattern

```
Presentation Layer (Controllers)
     ↓
API DTOs (Data Transfer Objects)
     ↓
Business Logic Layer (Services)
     ↓
Domain Model Layer (Entities)
     ↓
Data Access Layer (Repositories)
     ↓
Database Layer (PostgreSQL)
```

---

## TECHNOLOGY STACK

### Backend Dependencies (from pom.xml)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Core Framework** | Spring Boot | 3.2.3 | Web application framework |
| **Web** | spring-boot-starter-web | 3.2.3 | REST API, HTTP handling |
| **ORM** | spring-boot-starter-data-jpa | 3.2.3 | Database abstraction (Hibernate) |
| **Database** | PostgreSQL | Latest | Relational database |
| **Security** | spring-boot-starter-security | 3.2.3 | Authentication/authorization |
| **JWT** | jjwt | 0.11.5 | Token-based authentication |
| **Async** | spring-boot-starter-async | 3.2.3 | Async task execution |
| **Scheduling** | spring-boot-starter-scheduler | 3.2.3 | Scheduled tasks |
| **WebSocket** | spring-boot-starter-websocket | 3.2.3 | Real-time communication |
| **Email** | spring-boot-starter-mail | 3.2.3 | Email notifications |
| **Cache** | spring-boot-starter-cache | 3.2.3 | Caching (Simple, no Redis) |
| **AOP** | spring-boot-starter-aop | 3.2.3 | Aspect-oriented programming |
| **Validation** | spring-boot-starter-validation | 3.2.3 | Input validation (@Valid) |
| **API Docs** | springdoc-openapi-ui | 2.3.0 | Swagger/OpenAPI documentation |
| **State Machine** | spring-statemachine-core | 4.0.0 | Application workflow states |
| **Lombok** | lombok | Latest | Code generation (getters/setters) |

### Frontend Stack (React)
- **Framework:** React with Hooks
- **State Management:** React Context API or Redux
- **Build Tool:** npm/webpack
- **Language:** TypeScript/JavaScript

### Database
- **Type:** PostgreSQL 12+
- **Schema:** Generated via Hibernate (DDL auto-update)
- **Tables:** 21 entity tables
- **Relationships:** JOINED inheritance, OneToOne, OneToMany, ManyToMany

---

## PROJECT STRUCTURE

### Backend Directory Structure

```
backend/
├── src/main/java/com/unigate/
│   ├── UnigateApplication.java         ← Entry point (@SpringBootApplication)
│   │
│   ├── common/                          ← Shared infrastructure
│   │   ├── aspect/
│   │   │   └── AuditAspect.java        ← AOP: audit logging for admin actions
│   │   ├── config/
│   │   │   ├── SecurityConfig.java     ← Spring Security & JWT setup
│   │   │   ├── WebSocketConfig.java    ← WebSocket configuration
│   │   │   ├── OpenApiConfig.java      ← Swagger/API docs
│   │   │   ├── AsyncConfig.java        ← Async task configuration
│   │   │   └── DataInitializer.java    ← Seed data on startup
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java   ← JWT generation/validation
│   │   │   ├── JwtAuthenticationFilter.java ← JWT extraction from requests
│   │   │   └── UserDetailsServiceImpl.java ← Load user from DB
│   │   ├── scheduler/
│   │   │   └── ScheduledTasks.java     ← Periodic tasks (@Scheduled)
│   │   └── exception/
│   │       ├── BusinessException.java
│   │       ├── ResourceNotFoundException.java
│   │       └── GlobalExceptionHandler.java ← @RestControllerAdvice
│   │
│   ├── registration/                    ← Student Registration Module
│   │   ├── controller/
│   │   │   ├── RegistrationController.java
│   │   │   ├── ApplicationController.java
│   │   │   └── DocumentController.java
│   │   ├── service/
│   │   │   ├── ApplicationService.java      ← Main business logic
│   │   │   └── DocumentService.java
│   │   ├── entity/
│   │   │   ├── Application.java             ← JPA Entity (registration app)
│   │   │   ├── Document.java                ← Supporting documents
│   │   │   ├── Student.java                 ← User subclass (JOINED)
│   │   │   └── User.java                    ← Base user entity
│   │   ├── repository/
│   │   │   ├── ApplicationRepository.java
│   │   │   ├── StudentRepository.java
│   │   │   └── UserRepository.java
│   │   ├── dto/
│   │   │   ├── ApplicationDTO.java
│   │   │   ├── StudentDTO.java
│   │   │   └── DocumentDTO.java
│   │   ├── enums/
│   │   │   ├── ApplicationStatus.java       ← DRAFT, SUBMITTED, APPROVED, REJECTED
│   │   │   ├── ApplicationEvent.java        ← State machine events
│   │   │   └── DocumentStatus.java
│   │   ├── event/
│   │   │   └── ApplicationStatusChangedEvent.java
│   │   └── statemachine/
│   │       └── ApplicationStateMachineService.java ← Workflow state transitions
│   │
│   ├── grades/                          ← Academic Grades Module
│   │   ├── controller/
│   │   │   ├── GradeController.java
│   │   │   └── GradeWebSocketController.java ← Real-time updates
│   │   ├── service/
│   │   │   └── GradeService.java            ← Grade calculation & entry
│   │   ├── entity/
│   │   │   ├── StudentGrade.java            ← Student's grades (M:1)
│   │   │   └── GradeConfig.java             ← Module grading template
│   │   ├── repository/
│   │   │   ├── StudentGradeRepository.java
│   │   │   └── GradeConfigRepository.java
│   │   ├── dto/
│   │   │   ├── GradeDTO.java
│   │   │   ├── GradeConfigDTO.java
│   │   │   ├── GradeEntryRequest.java
│   │   │   ├── SimulationRequest.java
│   │   │   └── SimulationResult.java
│   │   └── enums/
│   │       └── (grade-related enums)
│   │
│   ├── internship/                      ← Internship Module
│   │   ├── controller/
│   │   │   └── InternshipController.java
│   │   ├── service/
│   │   │   └── InternshipService.java
│   │   ├── entity/
│   │   │   ├── Company.java
│   │   │   ├── Offer.java                  ← Internship opportunity
│   │   │   ├── InternshipApplication.java  ← Student application for offer
│   │   │   └── Interview.java
│   │   ├── repository/
│   │   │   ├── CompanyRepository.java
│   │   │   ├── OfferRepository.java
│   │   │   └── InternshipApplicationRepository.java
│   │   ├── dto/
│   │   │   ├── CompanyDTO.java
│   │   │   ├── OfferDTO.java
│   │   │   └── InternshipApplicationDTO.java
│   │   └── enums/
│   │       ├── OfferStatus.java             ← DRAFT, PUBLISHED, CLOSED
│   │       └── ApplicationInternshipStatus.java
│   │
│   ├── skillswap/                       ← Peer Skill Exchange Module
│   │   ├── controller/
│   │   │   └── SkillSwapController.java
│   │   ├── service/
│   │   │   └── SkillSwapService.java
│   │   ├── entity/
│   │   │   ├── Skill.java                  ← Skill registry
│   │   │   ├── SkillOffer.java             ← Student's skill offer
│   │   │   ├── SkillSwap.java              ← Matched swap agreement
│   │   │   └── SwapRating.java             ← Peer rating
│   │   ├── repository/
│   │   │   ├── SkillRepository.java
│   │   │   ├── SkillOfferRepository.java
│   │   │   └── SkillSwapRepository.java
│   │   ├── dto/
│   │   │   ├── SkillDTO.java
│   │   │   ├── SkillOfferDTO.java
│   │   │   └── SkillSwapDTO.java
│   │   └── enums/
│   │       └── SwapStatus.java              ← PENDING, ACCEPTED, COMPLETED, REJECTED
│   │
│   ├── timetable/                       ← Course Schedule Module
│   │   ├── controller/
│   │   │   └── TimetableController.java
│   │   ├── service/
│   │   │   └── TimetableService.java
│   │   ├── entity/
│   │   │   ├── Course.java
│   │   │   ├── ClassGroup.java
│   │   │   └── TimetableSlot.java         ← Individual schedule entry
│   │   ├── repository/
│   │   │   ├── CourseRepository.java
│   │   │   ├── ClassGroupRepository.java
│   │   │   └── TimetableSlotRepository.java
│   │   ├── dto/
│   │   │   ├── CourseDTO.java
│   │   │   ├── ClassGroupDTO.java
│   │   │   └── TimetableSlotDTO.java
│   │   └── enums/
│   │       └── SlotType.java               ← LECTURE, TD, TP
│   │
│   ├── eligibility/                     ← Eligibility Rules Engine
│   │   ├── controller/
│   │   │   └── EligibilityController.java
│   │   ├── service/
│   │   │   └── EligibilityService.java
│   │   ├── entity/
│   │   │   └── EligibilityRule.java       ← Configurable eligibility criteria
│   │   ├── repository/
│   │   │   └── EligibilityRuleRepository.java
│   │   ├── dto/
│   │   │   └── EligibilityRuleDTO.java
│   │   └── enums/
│   │       └── ConditionType.java         ← GPA_GTE, CREDITS_GTE, STATUS_EQ
│   │
│   └── notification/                    ← System Notifications & Audit
│       ├── controller/
│       │   └── NotificationController.java
│       ├── service/
│       │   └── NotificationService.java
│       ├── entity/
│       │   ├── Notification.java          ← User notifications
│       │   ├── AuditLog.java              ← System audit trail
│       │   └── RefreshToken.java
│       ├── repository/
│       │   ├── NotificationRepository.java
│       │   ├── AuditLogRepository.java
│       │   └── RefreshTokenRepository.java
│       ├── dto/
│       │   └── NotificationDTO.java
│       ├── event/
│       │   ├── GradeEnteredEvent.java     ← Event fired when grade entered
│       │   ├── NewOfferPublishedEvent.java
│       │   └── ApplicationStatusChangedEvent.java
│       └── listener/
│           ├── GradeEnteredListener.java
│           ├── NewOfferPublishedListener.java
│           └── ApplicationStatusChangedListener.java
│
└── src/main/resources/
    ├── application.yml                  ← Main configuration file
    ├── application-dev.yml              ← Development profile
    ├── data.sql                         ← Sample test data
    └── db/
        └── migration/                   ← Database migrations (if using Flyway)

frontend/
├── src/
│   ├── components/                      ← Reusable UI components
│   ├── pages/                           ← Page components
│   ├── services/                        ← API client services
│   ├── context/                         ← React Context (state management)
│   ├── hooks/                           ← Custom React hooks
│   ├── App.jsx                          ← Main component
│   └── index.jsx                        ← Entry point
└── package.json
```

---

## CORE MODULES (DETAILED)

### 1️⃣ **REGISTRATION MODULE** (`registration/`)

**Purpose:** Manage student registration applications and document processing.

#### Key Entities:
- **User** (Base): Authentication & authorization
  - Fields: id, email, password, firstName, lastName, role, createdAt, updatedAt
  - Role: ENUM (ADMIN, STUDENT, COORDINATOR)
  
- **Student** (extends User via JOINED inheritance)
  - Added fields: registrationType, department, speciality, partnerUniversity
  - Relationships: 1:1 with ClassGroup, 1:1 with Application
  
- **Application** (Registration Application)
  - Fields: id, student_id (1:1), status (ApplicationStatus), registrationType, reviewerComment
  - Status flow: DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED/REJECTED/INCOMPLETE
  - Uses: State Machine for state transitions
  
- **Document** (Supporting Documents)
  - Types: DIPLOMA, TRANSCRIPT, ID_CARD, PHOTO, MEDICAL_CERT, AGREEMENT, OTHER
  - Status: PENDING → VALIDATED/REJECTED
  - Fields: fileName, filePath, contentType, fileSize, validationMessage

#### Services:
```java
ApplicationService:
  - createOrGetApplication(studentId)         ← Create draft or return existing
  - submit(applicationId, studentId)          ← Submit app (state machine transition)
  - review(applicationId, reviewRequest)      ← Admin review & decision
  - getApplicationByStudentId(studentId)
  - getApplicationsByStatus(status)
  - listForReview()                           ← Get pending review list

DocumentService:
  - uploadDocument(applicationId, file)       ← Handle file upload
  - validateDocument(documentId)              ← Admin validation
  - annotateDocument(documentId, annotation)  ← AuditAspect intercepted
```

#### Workflow State Machine:
```
                    ┌─────────────┐
                    │    DRAFT    │
                    └────┬────────┘
                         │ SUBMIT
                         ↓
                    ┌──────────────┐
                    │  SUBMITTED   │
                    └────┬─────────┘
                         │ ASSIGN_TO_REVIEWER
                         ↓
                    ┌───────────────┐
        ┌──────────→│ UNDER_REVIEW  │←──────────┐
        │           └───────────────┘           │
        │                 │                     │
    REQUEST_          APPROVE/REFUSE        RESUBMIT
    INCOMPLETE            │                 (event)
        │                 ↓                     │
        │            ┌─────────┐               │
        │            │ACCEPTED/│               │
        │            │REJECTED │               │
        │            └─────────┘               │
        │                                      │
        └──────────────┬───────────────────────┘
                       ↓
                  ┌──────────────┐
                  │  INCOMPLETE  │
                  └──────────────┘
```

#### AOP Intercepted Methods (AuditAspect):
- `review()` → All admin reviews are logged with: actorEmail, action, details
- `assign()` → Assignment to reviewers logged
- `annotate()` → Document annotations logged

---

### 2️⃣ **GRADES MODULE** (`grades/`)

**Purpose:** Manage student grades, module configuration, and calculations.

#### Key Entities:
- **GradeConfig** (Module Grading Template)
  - Fields: moduleCode, moduleName, ccWeight, examWeight, tpWeight, credits, coefficient
  - Defines: How grades are calculated for a module
  - Example: ccMark (30%) + examMark (50%) + tpMark (20%) = finalMark
  
- **StudentGrade** (Student's Grade Record)
  - Fields: student_id (M:1), gradeConfig_id (M:1), ccMark, examMark, tpMark, finalMark
  - Boolean: adminEntered (prevents student override if admin entered)
  - Unique constraint: (student_id, module_code)
  - Pass/Fail: automatic calculation (finalMark >= 10.0)

#### Services:
```java
GradeService:
  // ─ Admin Grade Entry ─
  - enterGrade(request: GradeEntryRequest)
    * Sets ccMark, examMark, tpMark (admin-entered)
    * Calculates finalMark via applyComputed()
    * Sets adminEntered = true (prevents student override)
    * Publishes GradeEnteredEvent
  
  // ─ Student Self-Entry ─
  - enterMyGrade(studentId, request: StudentGradeEntryRequest)
    * Students enter saved grades (self-assessment)
    * Blocks if adminEntered = true
    * Calculates finalMark
  
  // ─ Retrieve ─
  - getGradesForStudent(studentId)              ← All student's grades
  - getGradesForStudentBySemester(studentId)   ← Filter by semester
  
  // ─ Grade Simulation ─
  - simulateGrades(request: SimulationRequest)  ← What-if calculations
    * Student enters hypothetical marks
    * Returns projected finalMark
  
  // ─ Configuration Management ─
  - getConfigs(department, semester)
  - saveConfig(configDTO)
  - updateWeights(configDTO)
  
  // ─ Private Helper ─
  - applyComputed(grade, config)
    * finalMark = (ccMark × ccWeight) + (examMark × examWeight) + (tpMark × tpWeight)
    * passed = finalMark >= 10.0
```

#### Grade Calculation Formula:
```
finalMark = (ccMark × ccWeight/100) 
          + (examMark × examWeight/100) 
          + (tpMark × tpWeight/100)

passed = finalMark >= 10.0

Example:
  ccMark=12, examMark=15, tpMark=14
  ccWeight=30, examWeight=50, tpWeight=20
  
  finalMark = (12 × 0.30) + (15 × 0.50) + (14 × 0.20)
            = 3.6 + 7.5 + 2.8 = 13.9 ✅ PASSED
```

#### WebSocket Real-Time Updates:
```java
GradeWebSocketController:
  - @MessageMapping("/app/grades/subscribe")
  - Broadcasts grade updates to subscribed students
  - Event: GradeEnteredEvent → triggers notification
```

---

### 3️⃣ **INTERNSHIP MODULE** (`internship/`)

**Purpose:** Manage internship offers, student applications, and matching.

#### Key Entities:
- **Company**
  - Fields: id, name, sector, location, website, contactEmail
  
- **Offer** (Internship Opportunity)
  - Fields: company_id (M:1), title, description, durationMonths, applicationDeadline
  - Filters: requiredDepartment, requiredSpeciality, targetYear (who's eligible)
  - Status: DRAFT → PUBLISHED → CLOSED/CANCELLED
  - Relationships: 1:M with InternshipApplication
  
- **InternshipApplication** (Student Application for Offer)
  - Fields: student_id + offer_id (unique composite key)
  - Status: PENDING → ACCEPTED/REJECTED
  - Includes: coverLetter, cvFilePath, cvFileName
  - Relationships: 1:1 with Interview (optional)
  
- **Interview**
  - Fields: application_id (1:1), scheduledAt (LocalDateTime), location, notes

#### Services:
```java
InternshipService:
  // ─ Offer Management (Admin/Company) ─
  - createOffer(offerDTO)
  - publishOffer(offerId)
  - closeOffer(offerId)
  - getOffersByCompany(companyId)
  - getOpenOffers()
  
  // ─ Student Applications ─
  - applyForOffer(studentId, offerId, request: InternshipApplicationDTO)
    * Creates InternshipApplication record
    * Checks eligibility (department, speciality, year)
  - getApplicationsForStudent(studentId)
  - getApplicationsForOffer(offerId)
  
  // ─ Admin Review ─
  - acceptApplication(applicationId)
  - rejectApplication(applicationId, reason)
  - scheduleInterview(applicationId, scheduledAt, location)
  
  // ─ Matching ─
  - findMatchingOffers(studentId)  ← Suggest offers based on profile
```

---

### 4️⃣ **SKILL SWAP MODULE** (`skillswap/`)

**Purpose:** Enable peer-to-peer skill exchange between students.

#### Key Entities:
- **Skill** (Skill Registry)
  - Fields: id, name (unique), category
  - Examples: JavaScript, Python, Drawing, Languages, etc.
  
- **SkillOffer** (Student's Skill Offer)
  - Fields: student_id (M:1), description, availability, active
  - Relationships: M:M with Skill via 2 join tables:
    * `skill_offer_skills` = offered skills
    * `skill_offer_wanted` = wanted skills
  
- **SkillSwap** (Matched Agreement)
  - Fields: requesterOffer_id, providerOffer_id, status, matchScore, message
  - Status: PENDING → ACCEPTED/REJECTED/COMPLETED
  - matchScore: algorithm calculates compatibility
  
- **SwapRating** (Peer Rating)
  - Fields: swap_id, rater_id, ratee_id, score (1-5), comment

#### Services:
```java
SkillSwapService:
  // ─ Offer Management ─
  - createSkillOffer(studentId, offerDTO)
    * Set skills offered & wanted
    * Set availability
  - updateSkillOffer(studentId, offerDTO)
  - deactivateSkillOffer(studentId)
  
  // ─ Matching ─
  - proposeSwap(requesterStudentId, requesterOfferId, providerOfferId)
    * Calculate matchScore (compatibility %)
    * Creates SkillSwap in PENDING status
  - getMatchSuggestions(studentId)  ← AI/Algorithm-based matches
  
  // ─ Swap Management ─
  - acceptSwap(studentId, swapId)
  - rejectSwap(studentId, swapId)
  - completeSwap(swapId)
  
  // ─ Rating ─
  - rateSwap(swapId, rater, score, comment)
  - getStudentRating(studentId)
```

---

### 5️⃣ **ELIGIBILITY MODULE** (`eligibility/`)

**Purpose:** Manage dynamic eligibility rules for exchange/internship eligibility.

#### Key Entities:
- **EligibilityRule** (Configurable Rule)
  - Fields: department, yearLevel, ruleName, conditionType, targetValue, enabled
  - Condition Types: GPA_GTE, CREDITS_GTE, STATUS_EQ
  - Example: "Computer Science students in Year 3 must have GPA ≥ 3.0"

#### Services:
```java
EligibilityService:
  - getRulesForDepartmentYear(department, yearLevel)
  - saveRules(rules: List<EligibilityRule>)           ← Audit logged
  - checkEligibility(studentId, ruleType) → Boolean
  - updateRuleStatus(ruleId, enabled)
```

---

### 6️⃣ **TIMETABLE MODULE** (`timetable/`)

**Purpose:** Manage course schedules and student timetables.

#### Key Entities:
- **Course**
  - Fields: id, code (unique), name, department, credits
  
- **ClassGroup** (Student Section)
  - Fields: id, name, department, year, semester
  
- **TimetableSlot** (Schedule Entry)
  - Fields: course_id (M:1), group_id (M:1), dayOfWeek, startTime, endTime, room, instructor
  - SlotType: LECTURE, TD (Tutorial), TP (Practical)

#### Services:
```java
TimetableService:
  - getStudentTimetable(studentId, week?) ← Filter by week
  - getGroupTimetable(groupId, week?)
  - createSlot(slotDTO)
  - updateSlot(slotId, slotDTO)
  - deleteSlot(slotId)
  - checkConflict(newSlot) → Boolean
```

---

### 7️⃣ **NOTIFICATION & AUDIT MODULE** (`notification/`)

**Purpose:** System notifications and audit logging.

#### Key Entities:
- **Notification** (User Notification)
  - Fields: recipientId (Long FK, not JPA mapped), title, message, type, read
  - Design: Non-JPA recipientId for flexibility
  
- **AuditLog** (Admin Action Audit)
  - Fields: actorEmail, actorRole, action, entityType, entityId, details, createdAt
  - Immutable: No updates, only inserts
  - AOP Source: AuditAspect intercepts admin methods
  
- **RefreshToken** (JWT Token Storage)
  - Fields: user_id (1:1), token (unique), expiryDate
  - Purpose: Token revocation, refresh token rotation

#### Event System:
```java
// Events Published:
- GradeEnteredEvent
  Listeners: Send student notification, log in audit
  
- NewOfferPublishedEvent
  Listeners: Notify eligible students, send email
  
- ApplicationStatusChangedEvent
  Listeners: Notify student of status change

// Event Publisher Pattern:
Service.java:
  eventPublisher.publishEvent(new GradeEnteredEvent(...))

Listener.java:
  @EventListener(GradeEnteredEvent.class)
  public void handleGradeEntered(GradeEnteredEvent event) { ... }
```

---

## DATA MODEL & DATABASE

### Database Diagram (Simplified)

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email (UQ)   │
│ password     │
│ firstName    │
│ lastName     │
│ role (ENUM)  │
└──────────────┘
       △
       │ JOINED Inheritance
       │
┌──────────────┐
│   students   │
├──────────────┤
│ user_id (PK) │ ← FK to users.id
│ class_group  │ ← FK to class_groups.id
└──────────────┘
       │
       │ 1:1
       ↓
┌──────────────────┐
│  applications    │
├──────────────────┤
│ id (PK)          │
│ student_id (UQ)  │ ← FK to students.user_id
│ status (ENUM)    │
│ reviewerComment  │
└──────────────────┘
       │
       │ 1:M
       ↓
┌──────────────────┐
│   documents      │
├──────────────────┤
│ id (PK)          │
│ application_id   │ ← FK
│ type (ENUM)      │
│ status (ENUM)    │
│ filePath         │
└──────────────────┘

┌──────────────────┐
│  student_grades  │
├──────────────────┤
│ student_id (PK)  │ ← FK to students
│ gradeconfig_id   │ ← FK to grade_configs
│ ccMark, examMark │
│ finalMark        │
│ adminEntered     │
└──────────────────┘
       ↑
       │ M:1
       │
┌──────────────────┐
│  grade_configs   │
├──────────────────┤
│ id (PK)          │
│ moduleCode (UQ)  │
│ moduleName       │
│ ccWeight         │
│ examWeight       │
└──────────────────┘

... (other modules follow similar pattern)
```

### Entity Relationship Summary

| Entity | Related Entities | Relationship Type |
|--------|------------------|-------------------|
| User | Student | 1:1 (JOINED inheritance) |
| Student | Application, SkillOffer, StudentGrade | 1:1, 1:M, 1:M |
| Application | Document | 1:M (cascade delete) |
| Course | TimetableSlot | 1:M |
| ClassGroup | Student, TimetableSlot | 1:M, 1:M |
| Company | Offer | 1:M |
| Offer | InternshipApplication, Interview | 1:M, 1:M |
| Skill | SkillOffer (2 M:M tables) | M:M |
| SkillSwap | SkillOffer (2), SwapRating | M:1 (×2), 1:M |

### Inheritance Strategy: JOINED

```sql
-- users table (parent)
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR,
  role VARCHAR,
  ...
);

-- students table (child)
CREATE TABLE students (
  user_id BIGINT PRIMARY KEY,  -- FK to users.id
  class_group_id BIGINT,
  registration_type VARCHAR,
  ...
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- When selecting a Student:
-- JPA joins: SELECT * FROM users u JOIN students s ON u.id = s.user_id
```

---

## SECURITY IMPLEMENTATION

### Authentication Flow

```
1. User logs in with email + password
   POST /api/auth/login
   
2. AuthController validates credentials
   - Load user from UserDetailsServiceImpl
   - Compare password (BCryptPasswordEncoder)
   
3. If valid:
   - Generate JWT token via JwtTokenProvider
   - JWT contains: username, role, expiration
   - Return JWT to frontend
   
4. Frontend stores JWT in localStorage/sessionStorage
   
5. For subsequent requests:
   - Frontend sends: Authorization: Bearer <JWT_TOKEN>
   
6. JwtAuthenticationFilter intercepts request
   - Extract JWT from Authorization header
   - Validate JWT (signature, expiration)
   - Load UserDetails from Security context
   - Create Authentication object
   - Set in SecurityContext
   
7. Request proceeds with authenticated user
```

### Security Configuration (SecurityConfig.java)

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enable @PreAuthorize, @RolesAllowed
public class SecurityConfig {
  
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) {
    return http
      .csrf(disable)                              // Disable CSRF (stateless)
      .cors(corsConfigurationSource)              // Enable CORS
      .sessionManagement(STATELESS)              // No server-side sessions
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/swagger-ui/**").permitAll()
        .requestMatchers("/ws/**").permitAll()
        .requestMatchers(GET, "/api/public/**").permitAll()
        .anyRequest().authenticated()             // All other routes need auth
      )
      .authenticationProvider(provider)           // Our custom auth provider
      .addFilterBefore(jwtFilter, ...)            // Add JWT filter
      .build();
  }
  
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();           // Hash passwords with bcrypt
  }
  
  @Bean
  public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder());
    return provider;
  }
}
```

### JWT Token Details

```java
JwtTokenProvider:
  - Secret: 256-bit base64-encoded string (from application.yml)
  - Algorithm: HS256 (HMAC SHA-256)
  - Expiration: Configurable (default 24 hours)
  - Claims: username (subject), issued-at, expiration, custom claims
  
Token Structure:
  Header.Payload.Signature
  
  Header:
    {
      "alg": "HS256",
      "typ": "JWT"
    }
  
  Payload (Claims):
    {
      "sub": "student@university.edu",
      "iat": 1694000000,
      "exp": 1694086400,
      "custom_role": "STUDENT"
    }
  
  Signature:
    HMACSHA256(
      base64UrlEncode(header) + "." + base64UrlEncode(payload),
      secret
    )
```

### Method-Level Security

```java
// In Controllers:
@PostMapping("/admin/review")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApplicationDTO> review(...) {
  // Only ADMIN role can call this
}

@GetMapping("/my-grades")
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
public ResponseEntity<List<GradeDTO>> getMyGrades() {
  // STUDENT and ADMIN can call this
}
```

### CORS Configuration

```yaml
# Allows:
- Origins: * (all origins in dev)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: * (all headers)
- Credentials: true (send cookies)
```

---

## API ENDPOINTS

### Authentication Endpoints

```
POST /api/auth/login
  Request: { email, password }
  Response: { token, refreshToken, user: { id, email, role } }
  Status: 200 OK or 401 Unauthorized

POST /api/auth/refresh
  Request: { refreshToken }
  Response: { token }
  Status: 200 OK or 401 Unauthorized

POST /api/auth/logout
  Response: 200 OK
```

### Registration Endpoints

```
POST /api/registration/applications
  Create or get application for student
  Authorization: Bearer <JWT>
  Response: ApplicationDTO

PATCH /api/registration/applications/{id}/submit
  Submit application for review
  Response: ApplicationDTO (status = SUBMITTED)

POST /api/registration/applications/{id}/review
  Admin: review application
  Request: { action: "APPROVE|REFUSE|REQUEST_INCOMPLETE", comment, refusalReason }
  Authorization: Bearer <JWT> (ADMIN role required)
  Response: ApplicationDTO

POST /api/registration/applications/{id}/documents
  Upload document
  Content-Type: multipart/form-data
  Response: DocumentDTO

GET /api/registration/applications/{id}/documents/{docId}
  Download document
  Response: file content
```

### Grades Endpoints

```
POST /api/grades/enter
  Admin: enter grade for student
  Request: GradeEntryRequest { studentId, moduleCode, ccMark, examMark }
  Response: GradeDTO

POST /api/grades/my-grades
  Student: self-enter grade
  Request: StudentGradeEntryRequest { moduleCode, ccMark, examMark, tpMark }
  Response: GradeDTO

GET /api/grades/my-grades
  Get student's all grades
  Response: List<GradeDTO>

GET /api/grades/my-grades?semester=1
  Get student's semester-specific grades
  Response: List<GradeDTO>

POST /api/grades/simulate
  What-if grade simulation
  Request: SimulationRequest { ccMark, examMark, tpMark, moduleCode }
  Response: SimulationResult { finalMark, passed }

GET /api/grades/config
  Get module grade configurations
  Response: List<GradeConfigDTO>

POST /api/grades/config
  Admin: save grade configuration
  Request: GradeConfigDTO
  Response: GradeConfigDTO
```

### Internship Endpoints

```
GET /api/internship/offers
  Get all published offers
  Query: ?department=CS&year=3
  Response: List<OfferDTO>

POST /api/internship/offers
  Company/Admin: create offer
  Request: OfferDTO
  Response: OfferDTO

POST /api/internship/applications
  Student: apply for offer
  Request: { offerId, coverLetter, cvFile }
  Response: InternshipApplicationDTO

GET /api/internship/applications?status=PENDING
  Get student's applications
  Response: List<InternshipApplicationDTO>

POST /api/internship/applications/{id}/accept
  Admin: accept application
  Response: InternshipApplicationDTO (status = ACCEPTED)

POST /api/internship/applications/{id}/interview
  Schedule interview
  Request: { scheduledAt, location }
  Response: InterviewDTO
```

### Skill Swap Endpoints

```
POST /api/skillswap/offers
  Student: create skill offer
  Request: { skillsOffered: [id1, id2], skillsWanted: [id3, id4], availability }
  Response: SkillOfferDTO

GET /api/skillswap/offers/suggestions
  Get matching skill offers
  Response: List<SkillOfferDTO>

POST /api/skillswap/swaps/propose
  Propose skill swap
  Request: { requesterOfferId, providerOfferId }
  Response: SkillSwapDTO (status = PENDING)

PATCH /api/skillswap/swaps/{id}/accept
  Accept swap proposal
  Response: SkillSwapDTO (status = ACCEPTED)

POST /api/skillswap/swaps/{id}/rate
  Rate completed swap
  Request: { score: 1-5, comment }
  Response: SwapRatingDTO
```

### Eligibility Endpoints

```
GET /api/eligibility/rules?department=CS&yearLevel=3
  Get rules for department/year
  Response: List<EligibilityRuleDTO>

POST /api/eligibility/rules
  Admin: save rules (AuditAspect logs this)
  Request: List<EligibilityRuleDTO>
  Response: List<EligibilityRuleDTO>

POST /api/eligibility/check
  Check eligibility
  Request: { studentId, ruleType }
  Response: { eligible: boolean, reason: string }
```

### Notification Endpoints

```
GET /api/notifications
  Get user's notifications
  Query: ?read=false (filter unread)
  Response: List<NotificationDTO>

PATCH /api/notifications/{id}/read
  Mark notification as read
  Response: NotificationDTO (read = true)
```

---

## CONFIGURATION & SETUP

### application.yml Configuration

```yaml
spring:
  # Application name
  application:
    name: unigate-backend
  
  # Database (PostgreSQL)
  datasource:
    url: jdbc:postgresql://localhost:5432/unigate_db
    username: unigate_user
    password: unigate_pass_2025
  
  # JPA/Hibernate
  jpa:
    hibernate:
      ddl-auto: update                           # Auto-create/update tables
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    open-in-view: false                          # LazyInitializationException fix
  
  # Email (Gmail)
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${SPRING_MAIL_USERNAME}            # From env var
    password: ${SPRING_MAIL_PASSWORD}
  
  # Caching (Simple in-memory)
  cache:
    type: simple
  
  # File upload
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

# Server Configuration
server:
  port: 8080
  servlet:
    context-path: /

# Application Custom Config
app:
  jwt:
    secret: ${JWT_SECRET}                        # From env var or default
    expiration: 86400000                         # 24 hours (ms)
    refresh-expiration: 604800000                # 7 days (ms)
  upload:
    dir: ./uploads                               # File storage directory
  frontend:
    url: http://localhost:3000
  sla:
    hours: 48                                    # Admin review SLA

# Swagger/OpenAPI
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method

# Logging
logging:
  level:
    com.unigate: DEBUG
    org.springframework.security: WARN
```

### Database Setup

```bash
# 1. Create PostgreSQL database
createdb unigate_db

# 2. Create user
createuser unigate_user
psql -U postgres -c "ALTER USER unigate_user WITH PASSWORD 'unigate_pass_2025';"

# 3. Grant privileges
psql -U postgres -d unigate_db -c "GRANT ALL PRIVILEGES ON DATABASE unigate_db TO unigate_user;"

# 4. Spring Boot will auto-create tables via Hibernate (ddl-auto: update)
```

### Running the Application

```bash
# Backend
cd backend
mvn clean install
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm start

# Access:
- API: http://localhost:8080
- Frontend: http://localhost:3000
- Swagger UI: http://localhost:8080/swagger-ui.html
```

---

## KEY FEATURES IMPLEMENTED

### ✅ 1. User Authentication & Authorization
- JWT token-based authentication (stateless)
- Role-based access control (ADMIN, STUDENT, COORDINATOR)
- Password hashing (BCrypt)
- Method-level security (@PreAuthorize)

### ✅ 2. Student Registration Workflow
- Multi-step application process (DRAFT → SUBMITTED → REVIEWED → APPROVED/REJECTED)
- State machine enforces valid transitions
- Document upload & admin validation
- Application status notifications

### ✅ 3. Grades Management
- Admin grade entry with configurable weights
- Student self-entry (if admin hasn't entered)
- Automatic final mark calculation
- Pass/fail determination (threshold: 10.0)
- Grade simulation (what-if scenarios)
- WebSocket real-time updates

### ✅ 4. Internship Management
- Publish internship offers (with eligibility filters)
- Student applications (with CV upload)
- Admin review & interview scheduling
- Company dashboard

### ✅ 5. Skill Swap (Peer Learning)
- Student skill registry & availability
- Matching algorithm (based on offered/wanted skills)
- Swap agreements with status tracking
- Peer ratings (1-5 stars)

### ✅ 6. Timetable & Scheduling
- Course schedule management
- Student group assignment
- Real-time conflict detection
- Weekly view export

### ✅ 7. Eligibility Rules Engine
- Configurable rules per department & year level
- Dynamic eligibility checking
- Automatic filtering of opportunities

### ✅ 8. Audit & Compliance
- AOP-based audit logging of admin actions
- Complete audit trail (who, what, when, why)
- Non-repudiation: immutable audit logs

### ✅ 9. Notifications & Events
- Event-driven architecture (Spring events)
- Email notifications (Grade entered, Offer published, Status changed)
- In-app notification system
- WebSocket support for real-time updates

### ✅ 10. API Documentation
- Swagger/OpenAPI (auto-generated from code)
- Interactive API testing in Swagger UI
- Clear endpoint documentation

---

## DESIGN PATTERNS USED

### 1. **State Machine Pattern** (Registration Workflow)
- Spring State Machine library
- States: DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED
- Events: SUBMIT, APPROVE, REFUSE, REQUEST_INCOMPLETE
- Enforced valid transitions

### 2. **Event-Driven Architecture**
- Spring ApplicationEventPublisher
- Events: GradeEnteredEvent, OfferPublishedEvent, StatusChangedEvent
- Decoupled listeners (observers)
- Example: Grade entered → notification service listens

### 3. **Aspect-Oriented Programming (AOP)**
- AuditAspect intercepts admin methods
- @Aspect, @AfterReturning pointcuts
- Cross-cutting concern: audit logging

### 4. **Repository Pattern**
- JPA repositories for data access
- Spring Data JPA provides CRUD + custom queries
- Loose coupling: services depend on repositories, not DAOs

### 5. **Service Layer Pattern**
- ApplicationService, GradeService, etc.
- Business logic centralized
- Transaction management (@Transactional)
- Dependency injection

### 6. **DTO (Data Transfer Object) Pattern**
- Controllers accept/return DTOs (not entities)
- Entities remain internal
- Separation of concerns

### 7. **Dependency Injection**
- Spring Container (@Configuration, @Bean)
- Constructor injection (@RequiredArgsConstructor via Lombok)
- Auto-wired dependencies

### 8. **Observer Pattern** (Event Listeners)
- Event publishers (services)
- Event listeners (multiple subscribers)
- Loose coupling

---

## SECURITY CONSIDERATIONS

### 🔒 Implemented:
✅ JWT token-based auth (stateless)
✅ Password hashing (BCrypt)
✅ CORS enabled for cross-origin requests
✅ CSRF disabled (stateless API)
✅ Role-based access control
✅ Audit logging of sensitive actions
✅ Method-level security (@PreAuthorize)

### ⚠️ Recommendations:
- Use HTTPS in production (not HTTP)
- Store JWT secret in environment variables (never in code)
- Implement rate limiting (prevent brute force)
- Use refresh token rotation (revoke old tokens)
- Add request validation (JSR-303 @Valid)
- Encrypt sensitive data fields (SSN, etc.)
- Regular security audits & penetration testing

---

## WHAT'S NEXT?

### Frontend Integration
- React components for each module
- Redux or Context API for state management
- Real-time updates via WebSocket

### Database Optimization
- Add database indexes on frequently queried columns
- Implement caching (Redis) for better performance
- Query optimization & N+1 query prevention

### Testing
- Unit tests (JUnit 5, Mockito)
- Integration tests (TestContainers, PostgreSQL)
- API tests (RestAssured)

### Deployment
- Dockerization (Dockerfile, docker-compose)
- CI/CD pipeline (GitHub Actions, Jenkins)
- Cloud deployment (AWS, Azure, GCP)

---

**Generated:** 2026-05-07 | **Project:** UniGate v1.0.0
