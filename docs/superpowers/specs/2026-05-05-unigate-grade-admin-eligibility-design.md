# UniGate — Grade Management, Admin Isolation & Eligibility Design
**Date:** 2026-05-05  
**Status:** Approved

---

## 1. Scope

Six cohesive changes to the UniGate platform:

1. Remove "View Profile" from Skill Swap
2. Add class levels M1, M2, Exchange Program, Double Diplôme to Eligibility Rules
3. Admin department isolation (each Admin sees only their department)
4. Eligibility auto-verification on document upload (notify student + admin; don't block)
5. Grade management role separation (Admin configures, Student enters raw marks, System calculates)
6. Figma design applied to GradesPage and GradeConfigPage

---

## 2. Simple Changes

### 2.1 Remove "View Profile" from Skill Swap
- Delete the `viewingProfile` state, the profile modal JSX, and the "View Profile" button from `MatchCard` in `SkillSwapPage.js`.
- The "Connect" button remains.

### 2.2 Eligibility Rules — New Class Levels
- Replace `['1st Year', '2nd Year', '3rd Year']` in `EligibilityRulesPage.js` with:
  `['1st Year', '2nd Year', '3rd Year', 'M1', 'M2', 'Exchange Program', 'Double Diplôme']`
- Add sensible default rules for each new level:
  - **M1**: GPA ≥ 12, Credits ≥ 120
  - **M2**: GPA ≥ 12, Research Project Submitted
  - **Exchange Program**: GPA ≥ 13, Language Certificate Level ≥ B2
  - **Double Diplôme**: GPA ≥ 14, Partner University Agreement

---

## 3. Admin Department Isolation

### 3.1 Backend

#### 3.1.1 User Entity
- Add `String department` (nullable) to `User.java`.
- Populated at registration (from request body) or updated by SUPER_ADMIN.
- `Student` already has its own `department` field — these are independent columns (Student's = their academic department; Admin's = the department they manage).

#### 3.1.2 Auth Response
- Add `department` to `AuthResponse.java` so the frontend receives it on login.
- `AuthService` maps `user.getDepartment()` into the response.

#### 3.1.3 AdminController — Application Filtering
- `getApplications()`: if caller is ADMIN (not SUPER_ADMIN), add a filter so only applications where `student.department == admin.department` are returned.
- SUPER_ADMIN bypasses the filter and sees all.

#### 3.1.4 GradeController — Student Grade Access
- `getGradesForStudent(studentId)`: if caller is ADMIN, verify `student.department == admin.department`; throw 403 otherwise.

#### 3.1.5 GradeConfigController (new or existing)
- `GET /api/grades/config`: if ADMIN, return only configs where `gradeConfig.department == admin.department`.
- `POST /api/grades/config`: set `gradeConfig.department = admin.department` automatically (ADMIN cannot set a different department).

#### 3.1.6 InternshipController
- `applicationsForOffer()`: if ADMIN, filter so only applications from students in admin's department are returned.

### 3.2 Frontend
- `AuthContext` stores `user.department`.
- `AdminDashboard` header shows a department badge (e.g., "IT Department").
- No UI change needed for filtering — the API already filters at the backend.

---

## 4. Eligibility Auto-Verification on Document Upload

### 4.1 Backend

#### 4.1.1 EligibilityRule Entity (new)
```
id            Long (PK)
department    String
yearLevel     String   -- "1st Year", "M1", "Exchange Program", etc.
ruleName      String
conditionType String   -- "GPA_GTE" | "CREDITS_GTE" | "STATUS_EQ" | "CERT_LEVEL_GTE"
targetValue   String   -- "10", "120", "B2", "Completed"
enabled       boolean
```
- Table: `eligibility_rules`
- Repository: `findByDepartmentAndYearLevel(String, String)`

#### 4.1.2 EligibilityService (new)
- `saveRules(department, yearLevel, List<EligibilityRuleDTO>)` — upsert rules for a (department, yearLevel) pair
- `getRules(department, yearLevel)` — fetch rules
- `checkStudent(Long studentId)` → `List<EligibilityViolation>`:
  - Resolves student's department and year level from their `Student` record
  - Fetches enabled rules for that (department, yearLevel)
  - Evaluates each rule against available student data (GPA from grades, credits from grades, document statuses)
  - Returns list of failed rules (empty = all pass)

#### 4.1.3 EligibilityController (new)
```
GET  /api/eligibility/rules?department=X&yearLevel=Y   ADMIN/SUPER_ADMIN
PUT  /api/eligibility/rules                             ADMIN/SUPER_ADMIN
```
- ADMIN can only GET/PUT rules for their own department.

#### 4.1.4 DocumentUploadedListener — extend
After existing "Document received" notification:
```java
List<EligibilityViolation> violations = eligibilityService.checkStudent(studentId);
if (!violations.isEmpty()) {
    // notify student
    notificationService.send(studentId, "Eligibility Warning",
        "Document uploaded but you may not meet eligibility: " + formatViolations(violations),
        "ELIGIBILITY_WARNING");
    // notify all admins in this department
    adminUsers.stream()
        .filter(a -> department.equals(a.getDepartment()))
        .forEach(admin -> notificationService.send(admin.getId(),
            "Eligibility Alert — " + studentName,
            studentName + " uploaded a document but failed: " + formatViolations(violations),
            "ELIGIBILITY_ALERT"));
}
```

### 4.2 Frontend

#### 4.2.1 EligibilityRulesPage — wire to real API
- Replace localStorage with `GET /api/eligibility/rules?department=X&yearLevel=Y` on load.
- Save button calls `PUT /api/eligibility/rules`.
- Department param taken from `user.department` (admin context).

#### 4.2.2 AdminDashboard — eligibility alert badge
- Applications list: show a yellow ⚠ badge on rows where the student has recent eligibility violations (inferred from notification records or a new `eligibilityStatus` field in ApplicationDTO).

---

## 5. Grade Management Role Separation

### 5.1 Data Model Changes

#### 5.1.1 GradeConfig — add TP weight
- Add `double tpWeight` (default 0.0, optional — modules without TP keep it 0).
- Add constraint: `ccWeight + examWeight + tpWeight == 1.0` (validated in service).

#### 5.1.2 StudentGrade — add TP mark + computed fields
- Add `Double tpMark` (nullable — null if module has no TP).
- `finalMark` remains computed: `cc*ccWeight + exam*examWeight + (tpMark != null ? tp*tpWeight : 0)`.
- Add `Double requiredExamToPass` (stored/returned): `(10 - ccWeight*cc) / examWeight` or `null` if already passing.

#### 5.1.3 GradeDTO — expose all fields to frontend
Fields: `id`, `studentId`, `moduleCode`, `moduleName`, `department`, `credits`, `semester`, `ccMark`, `examMark`, `tpMark`, `finalMark`, `passed`, `requiredExamToPass`, `ccWeight`, `examWeight`, `tpWeight`.

### 5.2 Backend — New Student Grade Entry

#### 5.2.1 New endpoint
```
POST /api/grades/my    STUDENT role
Body: { moduleCode, ccMark, examMark, tpMark? }
```
- `GradeService.enterMyGrade(Long studentId, StudentGradeEntryRequest)`:
  1. Look up `GradeConfig` by `moduleCode` — must exist (admin must configure module first).
  2. Check: if a `StudentGrade` record already exists for this (student, moduleCode) with `adminEntered = true`, return 409 with message "Official grade already recorded — contact your admin to update it."
  3. Validate marks in range 0–20.
  4. Compute `finalMark` and `requiredExamToPass` using config weights.
  5. Upsert `StudentGrade` with `adminEntered = false`.
  6. Return `GradeDTO`.

#### 5.2.2 Add `adminEntered` flag to StudentGrade
- Add `boolean adminEntered` (default `false`) to `StudentGrade` entity.
- `POST /api/grades` (admin endpoint) sets `adminEntered = true` and **can overwrite** any existing record including student-entered ones.
- `POST /api/grades/my` (student endpoint) sets `adminEntered = false` and **cannot overwrite** admin-entered records (returns 409).
- `GradeDTO` includes `adminEntered` so the frontend can show "Official Grade" vs "My Estimate" labels and make inputs read-only for official grades.

### 5.3 Frontend — GradesPage (Student, Figma Design)

#### Layout
- Page header: "My Grades" + semester selector pills (S1 / S2 / All)
- Summary bar (top): GPA chip, Credits Earned, Credits Lost, Year Status badge (PASS / RATTRAPAGE / FAIL)
- Module cards grid (2 columns on desktop):
  - Module name + department badge + credits chip
  - Three input rows: CC (with weight label), Exam (with weight label), TP (if tpWeight > 0)
  - Calculated section (read-only): Final Mark (color-coded: green ≥10, red <10), Status badge, "Min exam to pass: X.X/20" (shown when not yet passing)
  - Submit button per card (or global submit)
- If admin has entered an official grade: show it prominently, student inputs become read-only for that module

#### State & API
- On mount: `GET /api/grades/my` → load existing student grades + GradeConfig weights
- On submit per module: `POST /api/grades/my` → update + re-render card
- Live calculation (no submit needed for preview): computed client-side using weights from the loaded GradeConfig

### 5.4 Frontend — GradeConfigPage (Admin, enhanced)

#### Layout
- Header: "Grade Configuration — [Department] Admin" + semester selector
- Filter row: department (read-only for ADMIN, dropdown for SUPER_ADMIN) + semester
- Module table: columns = Module Code, Module Name, Credits, CC%, Exam%, TP%, Actions
- Inline editable rows with weight validation (must sum to 100%)
- Add Module button → inline blank row
- Save All Changes button
- Weight error highlight (red border) if weights don't sum to 100%

#### State & API
- On mount: `GET /api/grades/config?department=X&semester=Y`
- Save: `PUT /api/grades/config` (batch upsert)

---

## 6. File Change Index

### Backend (files to create or modify)
| File | Action |
|------|--------|
| `User.java` | Add `department` field |
| `AuthResponse.java` | Add `department` field |
| `AuthService.java` | Map department to response |
| `RegisterRequest.java` | Add optional `department` field |
| `AdminController.java` | Filter by admin department |
| `GradeConfig.java` | Add `tpWeight` |
| `StudentGrade.java` | Add `tpMark`, `requiredExamToPass` |
| `GradeDTO.java` | Add weights, tpMark, requiredExamToPass, moduleName, department |
| `GradeEntryRequest.java` | (keep for admin use) |
| `StudentGrade.java` | Add `tpMark`, `requiredExamToPass`, `adminEntered` |
| `StudentGradeEntryRequest.java` | **NEW** — moduleCode, ccMark, examMark, tpMark? |
| `GradeService.java` | Add `enterMyGrade()`, update compute logic |
| `GradeController.java` | Add `POST /api/grades/my`, dept filter on config endpoints |
| `EligibilityRule.java` | **NEW** entity |
| `EligibilityRuleDTO.java` | **NEW** DTO |
| `EligibilityViolation.java` | **NEW** value object |
| `EligibilityRuleRepository.java` | **NEW** |
| `EligibilityService.java` | **NEW** |
| `EligibilityController.java` | **NEW** |
| `DocumentUploadedListener.java` | Extend to call eligibility check |

### Frontend (files to create or modify)
| File | Action |
|------|--------|
| `SkillSwapPage.js` | Remove "View Profile" button + modal |
| `EligibilityRulesPage.js` | Add new year levels, wire to API |
| `GradesPage.js` | Full redesign per Figma + real API |
| `GradeConfigPage.js` | Add TP weight column, filter by dept, wire to config API |
| `AdminDashboard.js` | Add dept badge, eligibility alert badge on applications |
| `AuthContext.js` | Expose `user.department` |
| `api.js` | Add `gradeApi.enterMyGrades()`, `gradeApi.getConfig()`, `gradeApi.saveConfig()`, `eligibilityApi.*` |

---

## 7. Out of Scope
- Student registration flow changes (department auto-detected, not manually entered by student)
- Email notifications (only in-app notifications used)
- Grade appeals or admin grade override UI
- SUPER_ADMIN user management screen (assumed to exist or is a future task)
