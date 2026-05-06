# Grade Management, Admin Isolation & Eligibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin department isolation, real grade entry/config API, eligibility rule persistence and auto-verification, and redesign the student grades page.

**Architecture:** Backend changes first (entity → service → controller), then frontend API layer, then UI. Each task is independently deployable and tested in isolation.

**Tech Stack:** Spring Boot 3 / JPA / Lombok (backend) · React 18 / Tailwind CSS (frontend) · Axios (HTTP)

---

## File Map

### Backend — modified
| File | Change |
|------|--------|
| `registration/entity/User.java` | Add `String department` |
| `registration/dto/AuthResponse.java` | Add `String department` |
| `registration/dto/RegisterRequest.java` | Add `String department` (already has it for Student, now also for Admin creation) |
| `registration/service/AuthService.java` | Map `department` in `buildResponse()` |
| `registration/controller/AdminController.java` | Inject principal, filter by dept |
| `registration/service/ApplicationService.java` | Add `getAllByDepartment()` / `getByStatusAndDepartment()` |
| `registration/repository/UserRepository.java` | Add `findByRoleAndDepartment()` |
| `grades/entity/GradeConfig.java` | Add `tpWeight` |
| `grades/entity/StudentGrade.java` | Add `tpMark`, `requiredExamToPass`, `adminEntered` |
| `grades/dto/GradeDTO.java` | Add `tpMark`, `tpWeight`, `ccWeight`, `examWeight`, `department`, `adminEntered`, `requiredExamToPass` becomes `String` |
| `grades/dto/GradeConfigDTO.java` | **NEW** — config payload |
| `grades/dto/StudentGradeEntryRequest.java` | **NEW** — student self-entry |
| `grades/repository/GradeConfigRepository.java` | Add dept+semester query |
| `grades/repository/StudentGradeRepository.java` | Add `findByStudentIdAndAdminEnteredTrue()` |
| `grades/service/GradeService.java` | Add `enterMyGrade()`, `getConfigs()`, `saveConfigs()`, update `toDTO()` and `computeFinal()` |
| `grades/controller/GradeController.java` | Add `POST /my`, `GET /config`, `PUT /config` |
| `notification/listener/DocumentUploadedListener.java` | Add eligibility check after upload notification |

### Backend — created (new package `eligibility`)
| File | Purpose |
|------|---------|
| `eligibility/entity/EligibilityRule.java` | DB-persisted rule |
| `eligibility/dto/EligibilityRuleDTO.java` | API payload |
| `eligibility/repository/EligibilityRuleRepository.java` | DB queries |
| `eligibility/service/EligibilityService.java` | CRUD + `checkStudent()` |
| `eligibility/controller/EligibilityController.java` | REST endpoints |

### Frontend — modified
| File | Change |
|------|--------|
| `services/api.js` | Add `gradeApi.getConfig`, `gradeApi.saveConfig`, `gradeApi.enterMyGrades`, `eligibilityApi.*` |
| `pages/skillswap/SkillSwapPage.js` | Remove View Profile button + modal |
| `pages/grades/GradesPage.js` | Full redesign: real API, backend-driven modules |
| `pages/admin/GradeConfigPage.js` | Wire to real API, add TP%, add module code/semester/dept |
| `pages/admin/EligibilityRulesPage.js` | Add new class levels, wire to API |
| `pages/admin/AdminDashboard.js` | Show dept badge in header |

---

## Task 1 — Frontend: Remove View Profile + Add Eligibility Class Levels

**Files:**
- Modify: `frontend/src/pages/skillswap/SkillSwapPage.js`
- Modify: `frontend/src/pages/admin/EligibilityRulesPage.js`

- [ ] **Step 1: Remove View Profile button and modal from SkillSwapPage**

In `SkillSwapPage.js`, delete the `viewingProfile` state and modal. Replace the two-button row with a single Connect button:

```jsx
// In MatchCard, replace the two-button block:
{requestingId === o.id ? (
  <div className="space-y-2">
    <input
      type="text"
      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
      placeholder="Message (optional)"
      value={requestMsg}
      onChange={(e) => setRequestMsg(e.target.value)}
    />
    <div className="flex gap-2">
      <button onClick={() => handleRequest(o.id)}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold transition">
        Send Request
      </button>
      <button onClick={() => setRequestingId(null)}
        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-semibold transition">
        Cancel
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => setRequestingId(o.id)}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
  >
    Connect
  </button>
)}
```

Also remove: `const [viewingProfile, setViewingProfile] = useState(null);` and the entire `{viewingProfile && (...)}` modal JSX block.

- [ ] **Step 2: Add new class levels to EligibilityRulesPage**

Replace the `YEARS` array and `DEFAULT_RULES` object at the top of `EligibilityRulesPage.js`:

```js
const YEARS = ['1st Year', '2nd Year', '3rd Year', 'M1', 'M2', 'Exchange Program', 'Double Diplôme'];

const DEFAULT_RULES = {
  '1st Year': [
    { id: '1', rule: 'Minimum GPA',           condition: 'GPA ≥',     value: '10',        enabled: true  },
    { id: '2', rule: 'Required Credits',       condition: 'Credits ≥', value: '30',        enabled: true  },
    { id: '3', rule: 'No Failed Core Courses', condition: 'Failed ≤',  value: '0',         enabled: false },
  ],
  '2nd Year': [
    { id: '1', rule: 'Minimum GPA',      condition: 'GPA ≥',     value: '10', enabled: true },
    { id: '2', rule: 'Required Credits', condition: 'Credits ≥', value: '60', enabled: true },
  ],
  '3rd Year': [
    { id: '1', rule: 'Minimum GPA',         condition: 'GPA ≥',     value: '12',        enabled: true },
    { id: '2', rule: 'Internship Completed', condition: 'Status =',  value: 'Completed', enabled: true },
    { id: '3', rule: 'Required Credits',     condition: 'Credits ≥', value: '90',        enabled: true },
  ],
  'M1': [
    { id: '1', rule: 'Minimum GPA',      condition: 'GPA ≥',     value: '12',  enabled: true },
    { id: '2', rule: 'Required Credits', condition: 'Credits ≥', value: '120', enabled: true },
  ],
  'M2': [
    { id: '1', rule: 'Minimum GPA',               condition: 'GPA ≥',    value: '12',        enabled: true },
    { id: '2', rule: 'Research Project Submitted', condition: 'Status =', value: 'Submitted', enabled: true },
  ],
  'Exchange Program': [
    { id: '1', rule: 'Minimum GPA',          condition: 'GPA ≥',    value: '13', enabled: true },
    { id: '2', rule: 'Language Certificate', condition: 'Level ≥',  value: 'B2', enabled: true },
  ],
  'Double Diplôme': [
    { id: '1', rule: 'Minimum GPA',                     condition: 'GPA ≥',    value: '14',       enabled: true },
    { id: '2', rule: 'Partner University Agreement',     condition: 'Status =', value: 'Approved', enabled: true },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/skillswap/SkillSwapPage.js frontend/src/pages/admin/EligibilityRulesPage.js
git commit -m "feat: remove view profile from skill swap, add M1/M2/Exchange/DoubleDiplome eligibility levels"
```

---

## Task 2 — Backend: Add `department` to User + AuthResponse

**Files:**
- Modify: `backend/src/main/java/com/unigate/registration/entity/User.java`
- Modify: `backend/src/main/java/com/unigate/registration/dto/AuthResponse.java`
- Modify: `backend/src/main/java/com/unigate/registration/service/AuthService.java`
- Modify: `backend/src/main/java/com/unigate/registration/repository/UserRepository.java`

- [ ] **Step 1: Add `department` field to User entity**

In `User.java`, add after the `role` field:

```java
private String department;
```

The field is nullable — existing admin records get `null` until a SUPER_ADMIN assigns it. Students already have their own `department` field inherited from `Student`.

- [ ] **Step 2: Add `department` to AuthResponse**

Replace the `AuthResponse.java` content:

```java
package com.unigate.registration.dto;

import com.unigate.registration.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private String department;
}
```

- [ ] **Step 3: Map department in AuthService.buildResponse()**

Update `buildResponse()` in `AuthService.java`:

```java
private AuthResponse buildResponse(User user, String accessToken, String refreshToken) {
    // For Students the authoritative department is on Student; for Admins it's on User.
    String dept = (user instanceof Student s) ? s.getDepartment() : user.getDepartment();
    return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .userId(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole())
            .department(dept)
            .build();
}
```

- [ ] **Step 4: Add UserRepository query for finding admins by department**

In `UserRepository.java` (or create it if it extends `JpaRepository<User, Long>`):

```java
import com.unigate.registration.enums.Role;
import java.util.List;

List<User> findByRoleAndDepartment(Role role, String department);
```

- [ ] **Step 5: Restart backend and verify login response includes `department`**

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' | jq '.department'
```

Expected: `"IT"` (or `null` if not yet set)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/unigate/registration/entity/User.java \
        backend/src/main/java/com/unigate/registration/dto/AuthResponse.java \
        backend/src/main/java/com/unigate/registration/service/AuthService.java \
        backend/src/main/java/com/unigate/registration/repository/UserRepository.java
git commit -m "feat: add department field to User and include it in auth response"
```

---

## Task 3 — Backend: Admin Department Isolation in AdminController

**Files:**
- Modify: `backend/src/main/java/com/unigate/registration/controller/AdminController.java`
- Modify: `backend/src/main/java/com/unigate/registration/service/ApplicationService.java`
- Read: `backend/src/main/java/com/unigate/registration/repository/ApplicationRepository.java`

- [ ] **Step 1: Add department-filtered queries to ApplicationService**

Open `ApplicationService.java`. Add two methods alongside the existing `getAll()` and `getByStatus()`:

```java
@Transactional(readOnly = true)
public List<ApplicationDTO> getAllByDepartment(String department) {
    return applicationRepository.findByStudentDepartment(department)
            .stream().map(this::toDTO).collect(Collectors.toList());
}

@Transactional(readOnly = true)
public List<ApplicationDTO> getByStatusAndDepartment(ApplicationStatus status, String department) {
    return applicationRepository.findByStatusAndStudentDepartment(status, department)
            .stream().map(this::toDTO).collect(Collectors.toList());
}
```

- [ ] **Step 2: Add matching queries to ApplicationRepository**

In `ApplicationRepository.java`:

```java
import com.unigate.registration.enums.ApplicationStatus;
import java.util.List;

List<Application> findByStudentDepartment(String department);
List<Application> findByStatusAndStudentDepartment(ApplicationStatus status, String department);
```

(Spring Data JPA derives these from the `Application.student.department` path automatically.)

- [ ] **Step 3: Update AdminController to filter by caller's department**

Replace `AdminController.java`:

```java
package com.unigate.registration.controller;

import com.unigate.registration.dto.ApplicationDTO;
import com.unigate.registration.dto.ReviewRequest;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.Role;
import com.unigate.registration.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ApplicationService applicationService;

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<ApplicationDTO>> listAll(
            @RequestParam(required = false) ApplicationStatus status,
            @AuthenticationPrincipal User user) {

        boolean isSuperAdmin = user.getRole() == Role.SUPER_ADMIN;
        String dept = user.getDepartment();

        List<ApplicationDTO> result;
        if (isSuperAdmin || dept == null) {
            result = (status != null)
                    ? applicationService.getByStatus(status)
                    : applicationService.getAll();
        } else {
            result = (status != null)
                    ? applicationService.getByStatusAndDepartment(status, dept)
                    : applicationService.getAllByDepartment(dept);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/applications/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApplicationDTO> review(@PathVariable Long id,
                                                  @Valid @RequestBody ReviewRequest request) throws Exception {
        return ResponseEntity.ok(applicationService.review(id, request));
    }
}
```

- [ ] **Step 4: Verify — ADMIN with department="IT" only sees IT students**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"it-admin@test.com","password":"password"}' | jq -r '.accessToken')

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/admin/applications | jq '.[].studentDepartment'
```

Expected: all results should be `"IT"` (or whatever dept the admin has).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/unigate/registration/controller/AdminController.java \
        backend/src/main/java/com/unigate/registration/service/ApplicationService.java \
        backend/src/main/java/com/unigate/registration/repository/ApplicationRepository.java
git commit -m "feat: admin department isolation - filter applications by admin's department"
```

---

## Task 4 — Backend: Grade Entity Enhancements (TP + adminEntered)

**Files:**
- Modify: `backend/src/main/java/com/unigate/grades/entity/GradeConfig.java`
- Modify: `backend/src/main/java/com/unigate/grades/entity/StudentGrade.java`
- Modify: `backend/src/main/java/com/unigate/grades/dto/GradeDTO.java`
- Create: `backend/src/main/java/com/unigate/grades/dto/GradeConfigDTO.java`
- Create: `backend/src/main/java/com/unigate/grades/dto/StudentGradeEntryRequest.java`
- Modify: `backend/src/main/java/com/unigate/grades/repository/GradeConfigRepository.java`

- [ ] **Step 1: Add `tpWeight` to GradeConfig**

Replace `GradeConfig.java`:

```java
package com.unigate.grades.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grade_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) private String moduleCode;
    @Column(nullable = false) private String moduleName;
    private String department;

    @Column(nullable = false) private double ccWeight;
    @Column(nullable = false) private double examWeight;
    @Builder.Default private double tpWeight = 0.0;

    private int credits;
    private int semester;
}
```

- [ ] **Step 2: Add `tpMark`, `requiredExamToPass`, `adminEntered` to StudentGrade**

Replace `StudentGrade.java`:

```java
package com.unigate.grades.entity;

import com.unigate.registration.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_grades",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "module_code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentGrade {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_config_id", nullable = false)
    private GradeConfig gradeConfig;

    private Double ccMark;
    private Double examMark;
    private Double tpMark;
    private Double finalMark;
    private Boolean passed;
    private String requiredExamToPass;

    /** True when an admin entered this grade — students cannot overwrite admin-entered grades. */
    @Builder.Default private boolean adminEntered = false;

    @Column(updatable = false)
    private LocalDateTime enteredAt;

    @PrePersist protected void onCreate() { enteredAt = LocalDateTime.now(); }
}
```

- [ ] **Step 3: Update GradeDTO**

Replace `GradeDTO.java`:

```java
package com.unigate.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GradeDTO {
    private Long id;
    private Long studentId;
    private String moduleCode;
    private String moduleName;
    private String department;
    private int credits;
    private int semester;
    private double ccWeight;
    private double examWeight;
    private double tpWeight;
    private Double ccMark;
    private Double examMark;
    private Double tpMark;
    private Double finalMark;
    private Boolean passed;
    private String requiredExamToPass;
    private boolean adminEntered;
}
```

- [ ] **Step 4: Create GradeConfigDTO**

Create `backend/src/main/java/com/unigate/grades/dto/GradeConfigDTO.java`:

```java
package com.unigate.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GradeConfigDTO {
    private Long id;
    private String moduleCode;
    private String moduleName;
    private String department;
    private double ccWeight;
    private double examWeight;
    private double tpWeight;
    private int credits;
    private int semester;
}
```

- [ ] **Step 5: Create StudentGradeEntryRequest**

Create `backend/src/main/java/com/unigate/grades/dto/StudentGradeEntryRequest.java`:

```java
package com.unigate.grades.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StudentGradeEntryRequest {
    @NotBlank private String moduleCode;
    @Min(0) @Max(20) private Double ccMark;
    @Min(0) @Max(20) private Double examMark;
    @Min(0) @Max(20) private Double tpMark;
}
```

- [ ] **Step 6: Add dept+semester query to GradeConfigRepository**

In `GradeConfigRepository.java`:

```java
import java.util.List;
import java.util.Optional;

List<GradeConfig> findByDepartment(String department);
List<GradeConfig> findByDepartmentAndSemester(String department, int semester);
Optional<GradeConfig> findByModuleCode(String moduleCode);
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/unigate/grades/
git commit -m "feat: add tpWeight/tpMark/adminEntered to grade entities, add GradeConfigDTO and StudentGradeEntryRequest"
```

---

## Task 5 — Backend: GradeService — enterMyGrade + config methods + updated toDTO

**Files:**
- Modify: `backend/src/main/java/com/unigate/grades/service/GradeService.java`

- [ ] **Step 1: Replace GradeService.java**

```java
package com.unigate.grades.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.grades.dto.*;
import com.unigate.grades.entity.GradeConfig;
import com.unigate.grades.entity.StudentGrade;
import com.unigate.grades.repository.GradeConfigRepository;
import com.unigate.grades.repository.StudentGradeRepository;
import com.unigate.notification.event.GradeEnteredEvent;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeService {

    private static final double PASSING_MARK = 10.0;

    private final StudentGradeRepository gradeRepository;
    private final GradeConfigRepository configRepository;
    private final StudentRepository studentRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ── Admin: enter official grade for a student ──────────────────────────
    @Transactional
    public GradeDTO enterGrade(GradeEntryRequest request) {
        GradeConfig config = configRepository.findByModuleCode(request.getModuleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Module " + request.getModuleCode() + " not found"));
        var student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        StudentGrade grade = gradeRepository
                .findByStudentIdAndGradeConfigModuleCode(request.getStudentId(), request.getModuleCode())
                .orElse(StudentGrade.builder().student(student).gradeConfig(config).build());

        grade.setCcMark(request.getCcMark());
        grade.setExamMark(request.getExamMark());
        grade.setTpMark(null);
        grade.setAdminEntered(true);
        applyComputed(grade, config);
        grade = gradeRepository.save(grade);

        if (grade.getFinalMark() != null) {
            eventPublisher.publishEvent(
                    new GradeEnteredEvent(this, student.getId(), config.getModuleName(), grade.getFinalMark()));
        }
        return toDTO(grade);
    }

    // ── Student: self-enter simulation grades ─────────────────────────────
    @Transactional
    public GradeDTO enterMyGrade(Long studentId, StudentGradeEntryRequest request) {
        GradeConfig config = configRepository.findByModuleCode(request.getModuleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Module " + request.getModuleCode() + " not found"));
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        StudentGrade existing = gradeRepository
                .findByStudentIdAndGradeConfigModuleCode(studentId, request.getModuleCode())
                .orElse(null);

        if (existing != null && existing.isAdminEntered()) {
            throw new BusinessException("Official grade already recorded for this module. Contact your admin to update it.");
        }

        StudentGrade grade = (existing != null) ? existing
                : StudentGrade.builder().student(student).gradeConfig(config).adminEntered(false).build();

        grade.setCcMark(request.getCcMark());
        grade.setExamMark(request.getExamMark());
        grade.setTpMark(config.getTpWeight() > 0 ? request.getTpMark() : null);
        applyComputed(grade, config);
        return toDTO(gradeRepository.save(grade));
    }

    // ── Student: fetch own grades ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<GradeDTO> getGradesForStudent(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GradeDTO> getGradesForStudentBySemester(Long studentId, int semester) {
        return gradeRepository.findByStudentIdAndGradeConfigSemester(studentId, semester)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Config management (admin) ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<GradeConfigDTO> getConfigs(String department, Integer semester) {
        List<GradeConfig> configs = (semester != null)
                ? configRepository.findByDepartmentAndSemester(department, semester)
                : configRepository.findByDepartment(department);
        return configs.stream().map(this::toConfigDTO).collect(Collectors.toList());
    }

    @Transactional
    public List<GradeConfigDTO> saveConfigs(List<GradeConfigDTO> dtos, String department) {
        return dtos.stream().map(dto -> {
            GradeConfig config = configRepository.findByModuleCode(dto.getModuleCode())
                    .orElse(GradeConfig.builder().moduleCode(dto.getModuleCode()).build());
            config.setModuleName(dto.getModuleName());
            config.setDepartment(department);
            config.setCcWeight(dto.getCcWeight() / 100.0);
            config.setExamWeight(dto.getExamWeight() / 100.0);
            config.setTpWeight(dto.getTpWeight() / 100.0);
            config.setCredits(dto.getCredits());
            config.setSemester(dto.getSemester());
            return toConfigDTO(configRepository.save(config));
        }).collect(Collectors.toList());
    }

    // ── Simulation (public) ───────────────────────────────────────────────
    public Map<String, Object> simulate(String moduleCode, double ccMark, double examMark) {
        GradeConfig config = configRepository.findByModuleCode(moduleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Module " + moduleCode + " not found"));
        double finalMark = config.getCcWeight() * ccMark + config.getExamWeight() * examMark;
        return Map.of(
                "finalMark", Math.round(finalMark * 100.0) / 100.0,
                "passed", finalMark >= PASSING_MARK,
                "requiredExamToPass", computeRequiredExam(config, ccMark)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private void applyComputed(StudentGrade grade, GradeConfig config) {
        Double cc = grade.getCcMark();
        Double exam = grade.getExamMark();
        Double tp = grade.getTpMark();
        if (cc == null || exam == null) {
            grade.setFinalMark(null);
            grade.setPassed(null);
            grade.setRequiredExamToPass(null);
            return;
        }
        double tpContrib = (config.getTpWeight() > 0 && tp != null) ? config.getTpWeight() * tp : 0;
        double finalMark = config.getCcWeight() * cc + config.getExamWeight() * exam + tpContrib;
        finalMark = Math.round(finalMark * 100.0) / 100.0;
        grade.setFinalMark(finalMark);
        grade.setPassed(finalMark >= PASSING_MARK);
        grade.setRequiredExamToPass(computeRequiredExam(config, cc));
    }

    private String computeRequiredExam(GradeConfig config, double ccMark) {
        double required = (PASSING_MARK - config.getCcWeight() * ccMark) / config.getExamWeight();
        if (required > 20.0) return "IMPOSSIBLE";
        if (required < 0.0) return "0.00";
        return String.format("%.2f", required);
    }

    private GradeDTO toDTO(StudentGrade g) {
        GradeConfig c = g.getGradeConfig();
        return GradeDTO.builder()
                .id(g.getId())
                .studentId(g.getStudent().getId())
                .moduleCode(c.getModuleCode())
                .moduleName(c.getModuleName())
                .department(c.getDepartment())
                .credits(c.getCredits())
                .semester(c.getSemester())
                .ccWeight(c.getCcWeight() * 100)
                .examWeight(c.getExamWeight() * 100)
                .tpWeight(c.getTpWeight() * 100)
                .ccMark(g.getCcMark())
                .examMark(g.getExamMark())
                .tpMark(g.getTpMark())
                .finalMark(g.getFinalMark())
                .passed(g.getPassed())
                .requiredExamToPass(g.getRequiredExamToPass())
                .adminEntered(g.isAdminEntered())
                .build();
    }

    private GradeConfigDTO toConfigDTO(GradeConfig c) {
        return GradeConfigDTO.builder()
                .id(c.getId())
                .moduleCode(c.getModuleCode())
                .moduleName(c.getModuleName())
                .department(c.getDepartment())
                .ccWeight(c.getCcWeight() * 100)
                .examWeight(c.getExamWeight() * 100)
                .tpWeight(c.getTpWeight() * 100)
                .credits(c.getCredits())
                .semester(c.getSemester())
                .build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/unigate/grades/service/GradeService.java
git commit -m "feat: grade service - student self-entry, config CRUD, TP support"
```

---

## Task 6 — Backend: GradeController — new endpoints

**Files:**
- Modify: `backend/src/main/java/com/unigate/grades/controller/GradeController.java`

- [ ] **Step 1: Replace GradeController.java**

```java
package com.unigate.grades.controller;

import com.unigate.grades.dto.*;
import com.unigate.grades.service.GradeService;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    /** Admin enters official grade for a specific student */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<GradeDTO> enterGrade(@Valid @RequestBody GradeEntryRequest request) {
        return ResponseEntity.ok(gradeService.enterGrade(request));
    }

    /** Student enters their own CC/Exam/TP grades */
    @PostMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GradeDTO> enterMyGrade(
            @Valid @RequestBody StudentGradeEntryRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.enterMyGrade(user.getId(), request));
    }

    /** Student fetches their own grades */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeDTO>> myGrades(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gradeService.getGradesForStudent(user.getId()));
    }

    /** Admin fetches grades for a specific student */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeDTO>> studentGrades(
            @PathVariable Long studentId,
            @RequestParam(required = false) Integer semester) {
        List<GradeDTO> grades = (semester != null)
                ? gradeService.getGradesForStudentBySemester(studentId, semester)
                : gradeService.getGradesForStudent(studentId);
        return ResponseEntity.ok(grades);
    }

    /** Admin fetches module configs for their department */
    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeConfigDTO>> getConfig(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @AuthenticationPrincipal User user) {
        String dept = (user.getRole() == Role.SUPER_ADMIN && department != null)
                ? department : user.getDepartment();
        return ResponseEntity.ok(gradeService.getConfigs(dept, semester));
    }

    /** Admin saves (upsert) module configs for their department */
    @PutMapping("/config")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<GradeConfigDTO>> saveConfig(
            @RequestBody List<GradeConfigDTO> dtos,
            @AuthenticationPrincipal User user) {
        String dept = user.getRole() == Role.SUPER_ADMIN
                ? (dtos.isEmpty() ? user.getDepartment() : dtos.get(0).getDepartment())
                : user.getDepartment();
        return ResponseEntity.ok(gradeService.saveConfigs(dtos, dept));
    }

    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulate(@Valid @RequestBody SimulationRequest request) {
        return ResponseEntity.ok(gradeService.simulate(
                request.getModuleCode(), request.getCcMark(), request.getExamMark()));
    }
}
```

- [ ] **Step 2: Test — student can POST /api/grades/my**

```bash
STUDENT_TOKEN=<student-login-token>
curl -s -X POST http://localhost:8080/api/grades/my \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moduleCode":"MATH101","ccMark":14.0,"examMark":12.0}' | jq '.finalMark,.adminEntered'
```

Expected: `finalMark` is computed, `adminEntered` is `false`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/unigate/grades/controller/GradeController.java
git commit -m "feat: grade controller - student self-entry endpoint + config CRUD endpoints"
```

---

## Task 7 — Backend: Eligibility System (entity + service + controller)

**Files:**
- Create: `backend/src/main/java/com/unigate/eligibility/entity/EligibilityRule.java`
- Create: `backend/src/main/java/com/unigate/eligibility/dto/EligibilityRuleDTO.java`
- Create: `backend/src/main/java/com/unigate/eligibility/repository/EligibilityRuleRepository.java`
- Create: `backend/src/main/java/com/unigate/eligibility/service/EligibilityService.java`
- Create: `backend/src/main/java/com/unigate/eligibility/controller/EligibilityController.java`

- [ ] **Step 1: Create EligibilityRule entity**

```java
package com.unigate.eligibility.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "eligibility_rules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EligibilityRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String department;
    @Column(nullable = false) private String yearLevel;
    @Column(nullable = false) private String ruleName;
    /** GPA_GTE | CREDITS_GTE | STATUS_EQ */
    @Column(nullable = false) private String conditionType;
    @Column(nullable = false) private String targetValue;
    @Builder.Default private boolean enabled = true;
}
```

- [ ] **Step 2: Create EligibilityRuleDTO**

```java
package com.unigate.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EligibilityRuleDTO {
    private Long id;
    private String department;
    private String yearLevel;
    private String ruleName;
    private String conditionType;
    private String targetValue;
    private boolean enabled;
}
```

- [ ] **Step 3: Create EligibilityRuleRepository**

```java
package com.unigate.eligibility.repository;

import com.unigate.eligibility.entity.EligibilityRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EligibilityRuleRepository extends JpaRepository<EligibilityRule, Long> {
    List<EligibilityRule> findByDepartmentAndYearLevel(String department, String yearLevel);
    List<EligibilityRule> findByDepartment(String department);
    void deleteByDepartmentAndYearLevel(String department, String yearLevel);
}
```

- [ ] **Step 4: Create EligibilityService**

```java
package com.unigate.eligibility.service;

import com.unigate.eligibility.dto.EligibilityRuleDTO;
import com.unigate.eligibility.entity.EligibilityRule;
import com.unigate.eligibility.repository.EligibilityRuleRepository;
import com.unigate.grades.repository.StudentGradeRepository;
import com.unigate.registration.entity.Student;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final EligibilityRuleRepository ruleRepository;
    private final StudentRepository studentRepository;
    private final StudentGradeRepository gradeRepository;

    @Transactional(readOnly = true)
    public List<EligibilityRuleDTO> getRules(String department, String yearLevel) {
        List<EligibilityRule> rules = (yearLevel != null && !yearLevel.isBlank())
                ? ruleRepository.findByDepartmentAndYearLevel(department, yearLevel)
                : ruleRepository.findByDepartment(department);
        return rules.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public List<EligibilityRuleDTO> saveRules(String department, String yearLevel,
                                               List<EligibilityRuleDTO> dtos) {
        ruleRepository.deleteByDepartmentAndYearLevel(department, yearLevel);
        ruleRepository.flush();
        List<EligibilityRule> saved = dtos.stream().map(dto -> EligibilityRule.builder()
                .department(department)
                .yearLevel(yearLevel)
                .ruleName(dto.getRuleName())
                .conditionType(dto.getConditionType() != null ? dto.getConditionType() : "GPA_GTE")
                .targetValue(dto.getTargetValue())
                .enabled(dto.isEnabled())
                .build()
        ).collect(Collectors.toList());
        return ruleRepository.saveAll(saved).stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Checks a student against eligibility rules for their department + year level.
     * Returns a list of human-readable violation messages (empty = all pass).
     */
    @Transactional(readOnly = true)
    public List<String> checkStudent(Long studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return List.of();

        String dept = student.getDepartment();
        // Year level is not stored on Student in current model — use a placeholder.
        // When the student's year level is available, replace with the real field.
        String yearLevel = "1st Year";

        List<EligibilityRule> rules = ruleRepository.findByDepartmentAndYearLevel(dept, yearLevel)
                .stream().filter(EligibilityRule::isEnabled).collect(Collectors.toList());

        List<String> violations = new ArrayList<>();
        for (EligibilityRule rule : rules) {
            if (!evaluateRule(rule, studentId)) {
                violations.add(rule.getRuleName() + " (" + rule.getConditionType()
                        + " " + rule.getTargetValue() + ")");
            }
        }
        return violations;
    }

    private boolean evaluateRule(EligibilityRule rule, Long studentId) {
        try {
            double target = Double.parseDouble(rule.getTargetValue());
            switch (rule.getConditionType()) {
                case "GPA_GTE": {
                    var grades = gradeRepository.findByStudentId(studentId);
                    if (grades.isEmpty()) return false;
                    double gpa = grades.stream()
                            .filter(g -> g.getFinalMark() != null)
                            .mapToDouble(g -> g.getFinalMark())
                            .average().orElse(0.0);
                    return gpa >= target;
                }
                case "CREDITS_GTE": {
                    var grades = gradeRepository.findByStudentId(studentId);
                    int credits = grades.stream()
                            .filter(g -> Boolean.TRUE.equals(g.getPassed()))
                            .mapToInt(g -> g.getGradeConfig().getCredits())
                            .sum();
                    return credits >= target;
                }
                default:
                    return true;
            }
        } catch (NumberFormatException e) {
            return true;
        }
    }

    private EligibilityRuleDTO toDTO(EligibilityRule r) {
        return EligibilityRuleDTO.builder()
                .id(r.getId())
                .department(r.getDepartment())
                .yearLevel(r.getYearLevel())
                .ruleName(r.getRuleName())
                .conditionType(r.getConditionType())
                .targetValue(r.getTargetValue())
                .enabled(r.isEnabled())
                .build();
    }
}
```

- [ ] **Step 5: Create EligibilityController**

```java
package com.unigate.eligibility.controller;

import com.unigate.eligibility.dto.EligibilityRuleDTO;
import com.unigate.eligibility.service.EligibilityService;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eligibility")
@RequiredArgsConstructor
public class EligibilityController {

    private final EligibilityService eligibilityService;

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<EligibilityRuleDTO>> getRules(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String yearLevel,
            @AuthenticationPrincipal User user) {
        String dept = (user.getRole() == Role.SUPER_ADMIN && department != null)
                ? department : user.getDepartment();
        return ResponseEntity.ok(eligibilityService.getRules(dept, yearLevel));
    }

    @PutMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<List<EligibilityRuleDTO>> saveRules(
            @RequestParam String yearLevel,
            @RequestBody List<EligibilityRuleDTO> rules,
            @AuthenticationPrincipal User user) {
        String dept = user.getRole() == Role.SUPER_ADMIN
                ? (rules.isEmpty() ? user.getDepartment() : rules.get(0).getDepartment())
                : user.getDepartment();
        return ResponseEntity.ok(eligibilityService.saveRules(dept, yearLevel, rules));
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/unigate/eligibility/
git commit -m "feat: eligibility rule system - entity, service, REST controller"
```

---

## Task 8 — Backend: DocumentUploadedListener — add eligibility check

**Files:**
- Modify: `backend/src/main/java/com/unigate/notification/listener/DocumentUploadedListener.java`
- Read: `backend/src/main/java/com/unigate/notification/service/NotificationService.java`

- [ ] **Step 1: Update DocumentUploadedListener**

```java
package com.unigate.notification.listener;

import com.unigate.eligibility.service.EligibilityService;
import com.unigate.notification.service.NotificationService;
import com.unigate.registration.entity.Document;
import com.unigate.registration.entity.User;
import com.unigate.registration.enums.Role;
import com.unigate.registration.event.DocumentUploadedEvent;
import com.unigate.registration.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DocumentUploadedListener {

    private final NotificationService notificationService;
    private final EligibilityService eligibilityService;
    private final UserRepository userRepository;

    @Async
    @EventListener
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        Document doc = event.getDocument();
        Long studentId = doc.getApplication().getStudent().getId();
        String studentName = doc.getApplication().getStudent().getFullName();
        String department = doc.getApplication().getStudent().getDepartment();

        // 1. Notify student: document received
        notificationService.send(
                studentId,
                "Document received",
                "Your document \"" + doc.getType() + "\" has been uploaded and is pending review.",
                "DOCUMENT");

        // 2. Check eligibility rules
        List<String> violations = eligibilityService.checkStudent(studentId);
        if (violations.isEmpty()) return;

        String violationText = String.join(", ", violations);

        // 3a. Warn the student
        notificationService.send(
                studentId,
                "Eligibility Warning",
                "You uploaded a document but may not meet eligibility requirements: " + violationText,
                "SYSTEM");

        // 3b. Alert all admins in this department
        if (department != null) {
            userRepository.findByRoleAndDepartment(Role.ADMIN, department).forEach(admin ->
                notificationService.send(
                        admin.getId(),
                        "Eligibility Alert — " + studentName,
                        studentName + " uploaded a document but failed: " + violationText,
                        "SYSTEM")
            );
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/main/java/com/unigate/notification/listener/DocumentUploadedListener.java
git commit -m "feat: eligibility auto-check on document upload, notify student + dept admins"
```

---

## Task 9 — Frontend: api.js — new endpoints

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Add grade config, student grade entry, and eligibility API calls**

Add these exports at the end of `api.js` (replace the existing `gradeApi` object):

```js
export const gradeApi = {
  myGrades: () => api.get('/api/grades/my'),
  enterMyGrade: (data) => api.post('/api/grades/my', data),
  studentGrades: (studentId, semester) =>
    api.get(`/api/grades/student/${studentId}`, { params: semester ? { semester } : {} }),
  enter: (data) => api.post('/api/grades', data),
  simulate: (data) => api.post('/api/grades/simulate', data),
  getConfig: (department, semester) =>
    api.get('/api/grades/config', { params: { department, semester } }),
  saveConfig: (configs) => api.put('/api/grades/config', configs),
};

export const eligibilityApi = {
  getRules: (department, yearLevel) =>
    api.get('/api/eligibility/rules', { params: { department, yearLevel } }),
  saveRules: (yearLevel, rules) =>
    api.put('/api/eligibility/rules', rules, { params: { yearLevel } }),
};
```

Also update the existing `gradeApi` import references — `gradeApi.myGrades` replaces the old `gradeApi.myGrades()` pattern (same name, so no other files need updating).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add gradeApi config endpoints and eligibilityApi to api service"
```

---

## Task 10 — Frontend: GradesPage — Redesign with Real API

**Files:**
- Modify: `frontend/src/pages/grades/GradesPage.js`

- [ ] **Step 1: Replace GradesPage.js with real-API version**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PASS = 10;

const markColor = (m) =>
  m == null ? 'text-slate-400'
  : m >= 14 ? 'text-green-600'
  : m >= PASS ? 'text-blue-600'
  : 'text-red-500';

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const StatusBadge = ({ passed, final: finalMark }) => {
  if (finalMark == null) return null;
  if (passed) {
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Pass</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Fail</span>;
};

const ModuleCard = ({ grade, onSave, saving }) => {
  const isOfficial = grade.adminEntered;
  const hasTp = grade.tpWeight > 0;

  const [cc, setCc]     = useState(grade.ccMark   != null ? String(grade.ccMark)   : '');
  const [exam, setExam] = useState(grade.examMark != null ? String(grade.examMark) : '');
  const [tp, setTp]     = useState(grade.tpMark   != null ? String(grade.tpMark)   : '');

  // live preview (client-side)
  const ccVal   = parseFloat(cc)   || 0;
  const examVal = parseFloat(exam) || 0;
  const tpVal   = parseFloat(tp)   || 0;
  const hasAllRequired = cc !== '' && exam !== '' && (!hasTp || tp !== '');
  const preview = hasAllRequired
    ? Math.round((grade.ccWeight / 100 * ccVal + grade.examWeight / 100 * examVal + grade.tpWeight / 100 * tpVal) * 100) / 100
    : grade.finalMark;
  const previewPassed = preview != null && preview >= PASS;

  const reqExam = hasAllRequired && !previewPassed && grade.examWeight > 0
    ? Math.min(20, Math.max(0, (PASS - grade.ccWeight / 100 * ccVal) / (grade.examWeight / 100)))
    : null;

  const borderCls = preview == null
    ? 'border-slate-200'
    : previewPassed ? 'border-green-200' : 'border-red-200';

  const handleSubmit = () => {
    onSave({ moduleCode: grade.moduleCode, ccMark: parseFloat(cc), examMark: parseFloat(exam), tpMark: hasTp ? parseFloat(tp) : undefined });
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${borderCls}`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">{grade.moduleName}</h3>
            {isOfficial && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shrink-0">
                Official
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {grade.department && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{grade.department}</span>
            )}
            <span className="text-xs text-slate-400">{grade.credits} credits · S{grade.semester}</span>
          </div>
        </div>
        <StatusBadge passed={previewPassed} final={preview} />
      </div>

      {/* Grade inputs */}
      <div className="px-5 py-4 space-y-3">
        {/* CC */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">CC</span>
          <input
            type="number" min="0" max="20" step="0.25"
            disabled={isOfficial}
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="—"
            className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-slate-400">/20</span>
          <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.ccWeight}%</span>
        </div>

        {/* Exam */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">Exam</span>
          <input
            type="number" min="0" max="20" step="0.25"
            disabled={isOfficial}
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            placeholder="—"
            className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-slate-400">/20</span>
          <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.examWeight}%</span>
        </div>

        {/* TP (only if configured) */}
        {hasTp && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">TP</span>
            <input
              type="number" min="0" max="20" step="0.25"
              disabled={isOfficial}
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="—"
              className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-slate-400">/20</span>
            <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.tpWeight}%</span>
          </div>
        )}

        {/* Min exam needed */}
        {reqExam != null && !isOfficial && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Min exam to pass: <strong>{reqExam.toFixed(2)}/20</strong>
          </p>
        )}
        {grade.requiredExamToPass === 'IMPOSSIBLE' && !isOfficial && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Cannot pass with current CC mark
          </p>
        )}
      </div>

      {/* Result bar */}
      {preview != null && (
        <div className={`px-5 py-2.5 flex items-center justify-between border-t ${
          previewPassed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <span className="text-sm font-bold text-slate-700">
            Final: <span className={markColor(preview)}>{preview.toFixed(2)}/20</span>
          </span>
          {!isOfficial && hasAllRequired && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1 rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      )}
      {preview == null && !isOfficial && (
        <div className="px-5 py-2.5 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!hasAllRequired || saving}
            className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1.5 rounded-lg transition"
          >
            {saving ? 'Saving…' : 'Save Grades'}
          </button>
        </div>
      )}
    </div>
  );
};

const STATUS_CFG = {
  PASS:       { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  label: 'You pass the year',               icon: '✓' },
  RATTRAPAGE: { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  label: 'Rattrapage — retake failed exams', icon: '⚠' },
  FAIL:       { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    label: 'You fail the year',               icon: '✗' },
};

const GradesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [grades, setGrades]     = useState([]);
  const [semester, setSemester] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    gradeApi.myGrades()
      .then(({ data }) => setGrades(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async (moduleCode, payload) => {
    setSavingId(moduleCode);
    try {
      const { data } = await gradeApi.enterMyGrade(payload);
      setGrades((prev) => prev.map((g) => g.moduleCode === moduleCode ? data : g));
      notify('Grades saved!');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save grades.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = semester === 'all'
    ? grades
    : grades.filter((g) => g.semester === parseInt(semester));

  // Summary calculations
  const withFinal   = filtered.filter((g) => g.finalMark != null);
  const passing     = withFinal.filter((g) => g.passed);
  const failing     = withFinal.filter((g) => !g.passed);
  const totalCredits  = filtered.reduce((s, g) => s + g.credits, 0);
  const earnedCredits = passing.reduce((s, g) => s + g.credits, 0);
  const lostCredits   = failing.reduce((s, g) => s + g.credits, 0);
  const gpa = withFinal.length > 0
    ? Math.round(withFinal.reduce((s, g) => s + g.finalMark * g.credits, 0)
        / withFinal.reduce((s, g) => s + g.credits, 0) * 100) / 100
    : null;
  const status = gpa == null ? null : gpa < PASS ? 'FAIL' : lostCredits > 0 ? 'RATTRAPAGE' : 'PASS';
  const scfg = status ? STATUS_CFG[status] : null;

  // Semester options derived from loaded grades
  const semesters = [...new Set(grades.map((g) => g.semester))].sort();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Grades</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Grade overview' : 'Enter your CC, Exam, and TP marks — the system calculates your final result'}
          </p>
        </div>

        {/* Semester pills */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setSemester('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${semester === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >All</button>
          {semesters.map((s) => (
            <button
              key={s}
              onClick={() => setSemester(String(s))}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${semester === String(s) ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >S{s}</button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Summary bar */}
      {gpa != null && scfg && (
        <div className={`rounded-2xl border-2 p-5 ${scfg.bg}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">GPA</p>
              <p className={`text-2xl font-bold ${markColor(gpa)}`}>
                {gpa.toFixed(2)}<span className="text-sm font-normal text-slate-400">/20</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Credits Earned</p>
              <p className="text-2xl font-bold text-slate-800">
                {earnedCredits}<span className="text-sm font-normal text-slate-400">/{totalCredits}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Credits Lost</p>
              <p className={`text-2xl font-bold ${lostCredits > 0 ? 'text-red-500' : 'text-slate-400'}`}>{lostCredits}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Year Result</p>
              <p className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${scfg.text}`}>
                <span>{scfg.icon}</span>{scfg.label}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Module cards */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No modules configured yet</p>
          <p className="text-slate-400 text-sm mt-1">Your admin hasn't set up grade configurations for your department</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <ModuleCard
              key={g.moduleCode}
              grade={g}
              saving={savingId === g.moduleCode}
              onSave={(payload) => handleSave(g.moduleCode, payload)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {!isAdmin && filtered.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-500">Official</strong> — Grade entered by your admin. Read-only.</p>
          <p><strong className="text-slate-500">CC</strong> — Continuous assessment · <strong className="text-slate-500">TP</strong> — Practical work (shown when applicable)</p>
          <p>Weights are set by your department admin and shown as % on each row.</p>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/grades/GradesPage.js
git commit -m "feat: redesign GradesPage with real API, per-module inputs, live calculation, official grade display"
```

---

## Task 11 — Frontend: GradeConfigPage — Real API + TP% Column

**Files:**
- Modify: `frontend/src/pages/admin/GradeConfigPage.js`

- [ ] **Step 1: Replace GradeConfigPage.js**

```jsx
import React, { useState, useEffect } from 'react';
import { gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const uid = () => Math.random().toString(36).slice(2);

const Toggle = ({ on, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`}/>
  </button>
);

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const GradeConfigPage = () => {
  const { user } = useAuth();
  const [courses, setCourses]       = useState([]);
  const [semester, setSemester]     = useState('all');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [feedback, setFeedback]     = useState(null);

  const dept = user?.department;

  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    gradeApi.getConfig(dept, semester !== 'all' ? parseInt(semester) : undefined)
      .then(({ data }) => {
        setCourses(data.map((c) => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dept, semester]);

  const update = (key, field, value) => {
    setCourses((prev) => prev.map((c) => c._key === key ? { ...c, [field]: value } : c));
    setSaved(false);
  };

  const addCourse = () => {
    setCourses((prev) => [...prev, {
      _key: uid(), id: null, moduleCode: '', moduleName: '',
      department: dept, ccWeight: 40, examWeight: 60, tpWeight: 0,
      hasTP: false, credits: 3, semester: semester !== 'all' ? parseInt(semester) : 1,
    }]);
    setSaved(false);
  };

  const removeCourse = (key) => {
    setCourses((prev) => prev.filter((c) => c._key !== key));
    setSaved(false);
  };

  const totalWeight = (c) => c.ccWeight + c.examWeight + (c.hasTP ? c.tpWeight : 0);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    const invalid = courses.some((c) => Math.abs(totalWeight(c) - 100) > 0.1 || !c.moduleCode || !c.moduleName);
    if (invalid) {
      notify('Fix validation errors before saving (weights must sum to 100%, module code and name required).', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = courses.map((c) => ({
        id: c.id || undefined,
        moduleCode: c.moduleCode,
        moduleName: c.moduleName,
        department: dept,
        ccWeight: c.ccWeight,
        examWeight: c.examWeight,
        tpWeight: c.hasTP ? c.tpWeight : 0,
        credits: c.credits,
        semester: c.semester,
      }));
      const { data } = await gradeApi.saveConfig(payload);
      setCourses(data.map((c) => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      setSaved(true);
      notify('Configuration saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      notify('Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grade Configuration</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {dept ? `Department: ${dept}` : 'Configure assessment weights and credits per module'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Semester filter */}
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
            }`}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Module Weights</h2>
            <button onClick={addCourse}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Add Module
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Code', 'Module Name', 'Credits', 'Sem.', 'CC %', 'Exam %', 'Has TP', 'TP %', 'Total', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {courses.map((c) => {
                  const total = totalWeight(c);
                  const ok = Math.abs(total - 100) < 0.1;
                  return (
                    <tr key={c._key} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <input type="text" value={c.moduleCode} onChange={(e) => update(c._key, 'moduleCode', e.target.value)}
                          placeholder="MATH101"
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={c.moduleName} onChange={(e) => update(c._key, 'moduleName', e.target.value)}
                          placeholder="Mathematics"
                          className="w-36 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="1" max="30" value={c.credits} onChange={(e) => update(c._key, 'credits', parseInt(e.target.value) || 1)}
                          className="w-14 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <select value={c.semester} onChange={(e) => update(c._key, 'semester', parseInt(e.target.value))}
                          className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                          <option value={1}>S1</option>
                          <option value={2}>S2</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.ccWeight} onChange={(e) => update(c._key, 'ccWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.examWeight} onChange={(e) => update(c._key, 'examWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <Toggle on={c.hasTP} onToggle={() => update(c._key, 'hasTP', !c.hasTP)}/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.tpWeight} disabled={!c.hasTP}
                          onChange={(e) => update(c._key, 'tpWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"/>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>{total}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeCourse(c._key)}
                          className="text-slate-300 hover:text-red-400 transition p-1 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {courses.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No modules configured. Click "Add Module" to get started.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex gap-3">
        <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-xs text-blue-700">
          CC + Exam + TP weights must sum to 100% per module. Students in your department will see these modules and can enter their CC/Exam/TP grades.
        </p>
      </div>
    </div>
  );
};

export default GradeConfigPage;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/GradeConfigPage.js
git commit -m "feat: GradeConfigPage wired to real API with TP weight, module code/semester/dept support"
```

---

## Task 12 — Frontend: EligibilityRulesPage — wire to real API

**Files:**
- Modify: `frontend/src/pages/admin/EligibilityRulesPage.js`

- [ ] **Step 1: Add API calls to EligibilityRulesPage**

Add these changes to `EligibilityRulesPage.js`:

Add imports at top:
```js
import { useEffect } from 'react';
import { eligibilityApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
```

Inside `EligibilityRulesPage`, add before `return`:
```js
const { user } = useAuth();
const dept = user?.department;

// Load rules from API when year or dept changes
useEffect(() => {
  if (!dept) return;
  eligibilityApi.getRules(dept, activeYear).then(({ data }) => {
    if (data.length > 0) {
      setRules((prev) => ({
        ...prev,
        [activeYear]: data.map((r) => ({
          id: r.id ? String(r.id) : uid(),
          rule: r.ruleName,
          condition: r.conditionType,
          value: r.targetValue,
          enabled: r.enabled,
        })),
      }));
    }
  }).catch(() => {});
}, [dept, activeYear]);
```

Replace `handleSave`:
```js
const handleSave = async () => {
  if (!dept) return;
  const payload = currentRules.map((r) => ({
    ruleName: r.rule,
    conditionType: r.condition,
    targetValue: r.value,
    enabled: r.enabled,
  }));
  try {
    await eligibilityApi.saveRules(activeYear, payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } catch {
    // keep existing saved-false state
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/EligibilityRulesPage.js
git commit -m "feat: EligibilityRulesPage wired to real API - load and save rules per dept+yearLevel"
```

---

## Task 13 — Frontend: AdminDashboard — Department Badge

**Files:**
- Modify: `frontend/src/pages/admin/AdminDashboard.js`

- [ ] **Step 1: Add dept import and badge to AdminDashboard**

Add to imports:
```js
import { useAuth } from '../../context/AuthContext';
```

Inside `AdminDashboard`, before `return`:
```js
const { user } = useAuth();
const dept = user?.department;
```

In the header JSX, add after the existing `<p>` description line:
```jsx
{dept && (
  <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white">
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
    {dept} Department
  </span>
)}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminDashboard.js
git commit -m "feat: show department badge in AdminDashboard header"
```

---

## Self-Review

**Spec coverage:**
- §2.1 Remove View Profile → Task 1 ✓
- §2.2 New class levels → Task 1 ✓
- §3 Admin dept isolation → Tasks 2 + 3 ✓
- §4 Eligibility auto-verify → Tasks 7 + 8 ✓
- §4.2.1 EligibilityRulesPage wire to API → Task 12 ✓
- §5.1 GradeConfig tpWeight → Task 4 ✓
- §5.1.2 StudentGrade tpMark + adminEntered → Task 4 ✓
- §5.2 enterMyGrade endpoint → Tasks 5 + 6 ✓
- §5.3 GradesPage redesign + real API → Task 10 ✓
- §5.4 GradeConfigPage API + TP → Task 11 ✓
- §6 File change index → fully covered across all tasks ✓

**Type consistency:**
- `GradeConfigDTO` used in Tasks 4, 5, 6, 9, 11 — all fields consistent
- `EligibilityRuleDTO` used in Tasks 7, 8, 9, 12 — consistent
- `gradeApi.saveConfig` sends `GradeConfigDTO[]` (percentage weights) → `GradeService.saveConfigs` divides by 100 before storing → `toConfigDTO` multiplies by 100 on read → consistent round-trip ✓
- `StudentGradeEntryRequest.tpMark` is optional (null for non-TP modules) ✓
