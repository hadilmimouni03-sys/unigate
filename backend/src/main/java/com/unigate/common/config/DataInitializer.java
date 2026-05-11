package com.unigate.common.config;

import com.unigate.internship.entity.Company;
import com.unigate.internship.entity.Offer;
import com.unigate.internship.enums.OfferStatus;
import com.unigate.internship.repository.CompanyRepository;
import com.unigate.internship.repository.OfferRepository;
import com.unigate.registration.entity.Application;
import com.unigate.registration.entity.Student;
import com.unigate.registration.enums.ApplicationStatus;
import com.unigate.registration.enums.RegistrationType;
import com.unigate.registration.enums.Role;
import com.unigate.registration.repository.ApplicationRepository;
import com.unigate.registration.repository.UserRepository;
import com.unigate.skillswap.entity.Skill;
import com.unigate.skillswap.entity.SkillOffer;
import com.unigate.skillswap.repository.SkillOfferRepository;
import com.unigate.skillswap.repository.SkillRepository;
import com.unigate.timetable.entity.ClassGroup;
import com.unigate.timetable.entity.Course;
import com.unigate.timetable.entity.TimetableSlot;
import com.unigate.timetable.repository.ClassGroupRepository;
import com.unigate.timetable.repository.CourseRepository;
import com.unigate.timetable.repository.TimetableSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final CourseRepository courseRepository;
    private final ClassGroupRepository classGroupRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final SkillRepository skillRepository;
    private final SkillOfferRepository skillOfferRepository;
    private final CompanyRepository companyRepository;
    private final OfferRepository offerRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Order(0)
    CommandLineRunner repairDisabledAccounts() {
        return args -> {
            // Fix any stale rows regardless of column naming conventions
            userRepository.findAll().stream()
                .filter(u -> !u.isEnabled() || !u.isAccountNonLocked())
                .forEach(u -> {
                    u.setEnabled(true);
                    u.setAccountNonLocked(true);
                    userRepository.save(u);
                    log.info("Repaired account: {}", u.getEmail());
                });
        };
    }

    @Bean
    @Order(1)
    CommandLineRunner seedDefaultUsers() {
        return args -> {
            String encoded = passwordEncoder.encode("Admin@1234");
            ensureAdminUser("Super",  "Admin", "superadmin@unigate.com", encoded, Role.SUPER_ADMIN, null);
            ensureAdminUser("Admin",  "CS",    "admin.cs@unigate.com",   encoded, Role.ADMIN, "Computer Science");
            ensureAdminUser("Admin",  "GI",    "admin.gi@unigate.com",   encoded, Role.ADMIN, "Génie Industriel");
            log.info("Admins — superadmin@unigate.com | admin.cs@unigate.com | admin.gi@unigate.com — pwd: Admin@1234");
        };
    }

    private void ensureAdminUser(String first, String last, String email, String pwd, Role role, String department) {
        userRepository.findByEmail(email).ifPresentOrElse(
            u -> {
                // Always sync password/state so Docker rebuilds never get stale credentials
                u.setPassword(pwd);
                u.setEnabled(true);
                u.setAccountNonLocked(true);
                if (department != null) u.setDepartment(department);
                userRepository.save(u);
                log.info("Synced admin account: {}", email);
            },
            () -> userRepository.save(buildUser(first, last, email, pwd, role, department))
        );
    }

    @Bean
    @Order(2)
    CommandLineRunner seedStudentsAndApplications() {
        return args -> {
            if (userRepository.existsByEmail("ahmed.ben.ali@student.unigate.com")) return;

            String pwd = passwordEncoder.encode("Student@1234");

            // Student 1: 3rd year Ing — APPROVED
            Student s1 = buildStudent("Ahmed", "Ben Ali", "ahmed.ben.ali@student.unigate.com", pwd,
                    RegistrationType.THIRD_YEAR_ING, "Computer Science", "Software Engineering", null, null, null);
            userRepository.save(s1);
            Application a1 = Application.builder()
                    .student(s1).registrationType(RegistrationType.THIRD_YEAR_ING)
                    .status(ApplicationStatus.APPROVED)
                    .submittedAt(LocalDateTime.now().minusDays(20))
                    .reviewStartedAt(LocalDateTime.now().minusDays(18))
                    .decidedAt(LocalDateTime.now().minusDays(10))
                    .build();
            applicationRepository.save(a1);

            // Student 2: Master M1 — UNDER_REVIEW
            Student s2 = buildStudent("Sarra", "Trabelsi", "sarra.trabelsi@student.unigate.com", pwd,
                    RegistrationType.MASTER_M1, "Computer Science", "Artificial Intelligence", null, null, null);
            userRepository.save(s2);
            Application a2 = Application.builder()
                    .student(s2).registrationType(RegistrationType.MASTER_M1)
                    .status(ApplicationStatus.UNDER_REVIEW)
                    .submittedAt(LocalDateTime.now().minusDays(5))
                    .reviewStartedAt(LocalDateTime.now().minusDays(3))
                    .build();
            applicationRepository.save(a2);

            // Student 3: Exchange — SUBMITTED
            Student s3 = buildStudent("Lucas", "Dupont", "lucas.dupont@student.unigate.com", pwd,
                    RegistrationType.EXCHANGE_PROGRAM, "Computer Science", "Networks", "University of Lyon", "France", "S5");
            userRepository.save(s3);
            Application a3 = Application.builder()
                    .student(s3).registrationType(RegistrationType.EXCHANGE_PROGRAM)
                    .status(ApplicationStatus.SUBMITTED)
                    .submittedAt(LocalDateTime.now().minusDays(2))
                    .build();
            applicationRepository.save(a3);

            // Student 4: 1st year Ing — DRAFT
            Student s4 = buildStudent("Mariam", "Khelifi", "mariam.khelifi@student.unigate.com", pwd,
                    RegistrationType.FIRST_YEAR_ING, "Computer Science", null, null, null, null);
            userRepository.save(s4);
            Application a4 = Application.builder()
                    .student(s4).registrationType(RegistrationType.FIRST_YEAR_ING)
                    .status(ApplicationStatus.DRAFT)
                    .build();
            applicationRepository.save(a4);

            // Student 5: Master M2 — INCOMPLETE
            Student s5 = buildStudent("Yassine", "Gharbi", "yassine.gharbi@student.unigate.com", pwd,
                    RegistrationType.MASTER_M2, "Computer Science", "Cybersecurity", null, null, null);
            userRepository.save(s5);
            Application a5 = Application.builder()
                    .student(s5).registrationType(RegistrationType.MASTER_M2)
                    .status(ApplicationStatus.INCOMPLETE)
                    .submittedAt(LocalDateTime.now().minusDays(12))
                    .reviewStartedAt(LocalDateTime.now().minusDays(10))
                    .reviewerComment("Your diploma document is illegible. Please re-upload a clear scan.")
                    .build();
            applicationRepository.save(a5);

            log.info("CS students seeded — login: ahmed.ben.ali@student.unigate.com / Student@1234");
        };
    }

    @Bean
    @Order(4)
    CommandLineRunner seedGIStudents() {
        return args -> {
            if (userRepository.existsByEmail("karim.hamdi@student.unigate.com")) return;

            String pwd = passwordEncoder.encode("Student@1234");

            // GI Student 1: 3rd year — APPROVED
            Student gi1 = buildStudent("Karim", "Hamdi", "karim.hamdi@student.unigate.com", pwd,
                    RegistrationType.THIRD_YEAR_ING, "Génie Industriel", "Production Industrielle", null, null, null);
            userRepository.save(gi1);
            applicationRepository.save(Application.builder()
                    .student(gi1).registrationType(RegistrationType.THIRD_YEAR_ING)
                    .status(ApplicationStatus.APPROVED)
                    .submittedAt(LocalDateTime.now().minusDays(15))
                    .reviewStartedAt(LocalDateTime.now().minusDays(13))
                    .decidedAt(LocalDateTime.now().minusDays(7))
                    .build());

            // GI Student 2: Master M1 — APPROVED
            Student gi2 = buildStudent("Nadia", "Slama", "nadia.slama@student.unigate.com", pwd,
                    RegistrationType.MASTER_M1, "Génie Industriel", "Logistique", null, null, null);
            userRepository.save(gi2);
            applicationRepository.save(Application.builder()
                    .student(gi2).registrationType(RegistrationType.MASTER_M1)
                    .status(ApplicationStatus.APPROVED)
                    .submittedAt(LocalDateTime.now().minusDays(10))
                    .reviewStartedAt(LocalDateTime.now().minusDays(8))
                    .decidedAt(LocalDateTime.now().minusDays(3))
                    .build());

            // GI Student 3: 1st year — SUBMITTED (for admin review testing)
            Student gi3 = buildStudent("Amine", "Belkadi", "amine.belkadi@student.unigate.com", pwd,
                    RegistrationType.FIRST_YEAR_ING, "Génie Industriel", "Production Industrielle", null, null, null);
            userRepository.save(gi3);
            applicationRepository.save(Application.builder()
                    .student(gi3).registrationType(RegistrationType.FIRST_YEAR_ING)
                    .status(ApplicationStatus.SUBMITTED)
                    .submittedAt(LocalDateTime.now().minusDays(1))
                    .build());

            log.info("GI students seeded — karim.hamdi@student.unigate.com / amine.belkadi@student.unigate.com — pwd: Student@1234");
        };
    }

    @Bean
    @Order(7)
    CommandLineRunner seedGIClassGroups() {
        return args -> {
            if (!classGroupRepository.findByDepartmentAndYear("Génie Industriel", 3).isEmpty()) return;

            // GI courses
            Course prod  = saveCourse("GI101", "Production Management",    "Génie Industriel", 5);
            Course qual  = saveCourse("GI102", "Quality Control",           "Génie Industriel", 4);
            Course maint = saveCourse("GI103", "Industrial Maintenance",    "Génie Industriel", 4);
            Course logi  = saveCourse("GI201", "Logistics & Supply Chain",  "Génie Industriel", 5);
            Course lean  = saveCourse("GI202", "Lean Manufacturing",        "Génie Industriel", 4);

            // GI class groups
            ClassGroup giG1 = classGroupRepository.save(ClassGroup.builder()
                    .name("GI3-Production-A").department("Génie Industriel").year(3).semester("S5").yearLevel("3rd Year").build());
            ClassGroup giM1 = classGroupRepository.save(ClassGroup.builder()
                    .name("GIM1-Logistique").department("Génie Industriel").year(4).semester("S7").yearLevel("M1").build());

            // Timetable for GI 3rd year group
            saveSlot(prod,  giG1, DayOfWeek.MONDAY,    "08:00", "10:00", "D101", "Dr. Bensaad", "LECTURE");
            saveSlot(qual,  giG1, DayOfWeek.MONDAY,    "10:00", "12:00", "D102", "Dr. Ferhat",  "LECTURE");
            saveSlot(prod,  giG1, DayOfWeek.WEDNESDAY, "14:00", "16:00", "Lab6", "Dr. Bensaad", "TD");
            saveSlot(maint, giG1, DayOfWeek.TUESDAY,   "08:00", "10:00", "D103", "Dr. Ayari",   "LECTURE");
            saveSlot(maint, giG1, DayOfWeek.THURSDAY,  "10:00", "12:00", "Lab7", "Dr. Ayari",   "TP");

            // Timetable for GI Master Logistique group
            saveSlot(logi, giM1, DayOfWeek.MONDAY,    "10:00", "12:00", "D201", "Dr. Jlassi",  "LECTURE");
            saveSlot(lean, giM1, DayOfWeek.TUESDAY,   "08:00", "10:00", "D202", "Dr. Miled",   "LECTURE");
            saveSlot(logi, giM1, DayOfWeek.THURSDAY,  "14:00", "16:00", "Lab8", "Dr. Jlassi",  "TP");
            saveSlot(lean, giM1, DayOfWeek.FRIDAY,    "10:00", "12:00", "D203", "Dr. Miled",   "TD");

            log.info("GI class groups and timetable seeded — GI3-Production-A, GIM1-Logistique");
        };
    }

    @Bean
    @Order(8)
    CommandLineRunner assignApprovedStudentsClassGroups() {
        return args -> {
            List.of(
                "ahmed.ben.ali@student.unigate.com",
                "karim.hamdi@student.unigate.com",
                "nadia.slama@student.unigate.com"
            ).forEach(email -> userRepository.findByEmail(email).ifPresent(u -> {
                Student s = (Student) u;
                if (s.getClassGroup() != null) return;
                Integer year = mapRegistrationTypeToYear(s.getRegistrationType());
                Optional<ClassGroup> group = (year != null)
                        ? classGroupRepository.findFirstByDepartmentAndYearOrderByNameAsc(s.getDepartment(), year)
                        : classGroupRepository.findFirstByDepartmentOrderByNameAsc(s.getDepartment());
                group.ifPresent(g -> {
                    s.setClassGroup(g);
                    userRepository.save(s);
                    log.info("Startup: assigned {} to class group {}", s.getEmail(), g.getName());
                });
            }));
        };
    }

    private Integer mapRegistrationTypeToYear(RegistrationType type) {
        if (type == null) return null;
        return switch (type) {
            case FIRST_YEAR_ING -> 1;
            case SECOND_YEAR_ING -> 2;
            case THIRD_YEAR_ING -> 3;
            case MASTER_M1 -> 4;
            case MASTER_M2 -> 5;
            case EXCHANGE_PROGRAM, DOUBLE_DIPLOMA -> null;
        };
    }

    private String mapYearToYearLevel(int year) {
        return switch (year) {
            case 1 -> "1st Year";
            case 2 -> "2nd Year";
            case 3 -> "3rd Year";
            case 4 -> "M1";
            case 5 -> "M2";
            default -> "Year " + year;
        };
    }

    @Bean
    @Order(9)
    CommandLineRunner backfillOfferFields() {
        return args -> {
            java.util.Map<String, String[]> knownOffers = java.util.Map.of(
                "Full-Stack Developer Intern",   new String[]{"3rd Year", "Final Year"},
                "Data Analyst Intern",           new String[]{"3rd Year", "Summer"},
                "Network Infrastructure Intern", new String[]{"3rd Year", "Final Year"},
                "Cybersecurity Intern",          new String[]{"M1",       "Summer"},
                "Backend Java Developer Intern", new String[]{"3rd Year", "Final Year"},
                "Machine Learning Intern",       new String[]{"M1",       "Worker"},
                "Cloud DevOps Intern",           new String[]{"M2",       "Final Year"}
            );
            offerRepository.findAll().forEach(o -> {
                if (o.getTargetYear() == null || o.getInternshipType() == null) {
                    String[] vals = knownOffers.get(o.getTitle());
                    if (vals != null) {
                        o.setTargetYear(vals[0]);
                        o.setInternshipType(vals[1]);
                        offerRepository.save(o);
                        log.info("Backfilled offer '{}': targetYear={}, internshipType={}", o.getTitle(), vals[0], vals[1]);
                    }
                }
            });
        };
    }

    @Bean
    @Order(10)
    CommandLineRunner backfillClassGroupYearLevels() {
        return args -> {
            classGroupRepository.findAll().forEach(g -> {
                if (g.getYearLevel() == null) {
                    g.setYearLevel(mapYearToYearLevel(g.getYear()));
                    classGroupRepository.save(g);
                    log.info("Backfilled yearLevel='{}' for group '{}'", g.getYearLevel(), g.getName());
                }
            });
        };
    }

    @Bean
    @Order(3)
    CommandLineRunner seedCoursesAndTimetable() {
        return args -> {
            if (courseRepository.count() > 0) return;

            // Courses
            Course algo = saveCourse("INFO101", "Algorithms & Data Structures", "Computer Science", 6);
            Course dbms = saveCourse("INFO102", "Database Management Systems", "Computer Science", 5);
            Course networks = saveCourse("INFO103", "Computer Networks", "Computer Science", 4);
            Course webdev = saveCourse("INFO104", "Web Development", "Computer Science", 4);
            Course ai = saveCourse("INFO201", "Artificial Intelligence", "Computer Science", 5);
            Course ml = saveCourse("INFO202", "Machine Learning", "Computer Science", 5);
            saveCourse("INFO203", "Operating Systems", "Computer Science", 4);
            Course security = saveCourse("INFO204", "Cybersecurity Fundamentals", "Computer Science", 4);
            saveCourse("INFO301", "Software Engineering", "Computer Science", 5);
            Course cloud = saveCourse("INFO302", "Cloud Computing", "Computer Science", 4);
            Course maths = saveCourse("MATH101", "Linear Algebra", "Mathematics", 4);
            Course stats = saveCourse("MATH102", "Probability & Statistics", "Mathematics", 4);

            // Class Groups
            ClassGroup g1 = classGroupRepository.save(ClassGroup.builder()
                    .name("ING3-CS-A").department("Computer Science").year(3).semester("S5").yearLevel("3rd Year").build());
            ClassGroup g2 = classGroupRepository.save(ClassGroup.builder()
                    .name("ING3-CS-B").department("Computer Science").year(3).semester("S5").yearLevel("3rd Year").build());
            ClassGroup g3 = classGroupRepository.save(ClassGroup.builder()
                    .name("MASTER-AI").department("Computer Science").year(4).semester("S7").yearLevel("M1").build());

            // Timetable for Group 1 (ING3-CS-A)
            saveSlot(algo, g1, DayOfWeek.MONDAY, "08:00", "10:00", "A101", "Dr. Mansouri", "LECTURE");
            saveSlot(algo, g1, DayOfWeek.WEDNESDAY, "14:00", "16:00", "Lab1", "Dr. Mansouri", "TD");
            saveSlot(dbms, g1, DayOfWeek.MONDAY, "10:00", "12:00", "A102", "Dr. Zouari", "LECTURE");
            saveSlot(dbms, g1, DayOfWeek.THURSDAY, "08:00", "10:00", "Lab2", "Dr. Zouari", "TP");
            saveSlot(networks, g1, DayOfWeek.TUESDAY, "08:00", "10:00", "B201", "Dr. Fersi", "LECTURE");
            saveSlot(networks, g1, DayOfWeek.FRIDAY, "10:00", "12:00", "Lab3", "Dr. Fersi", "TP");
            saveSlot(webdev, g1, DayOfWeek.WEDNESDAY, "08:00", "10:00", "Lab4", "Dr. Riahi", "TP");
            saveSlot(maths, g1, DayOfWeek.TUESDAY, "14:00", "16:00", "A103", "Prof. Chaabane", "LECTURE");
            saveSlot(stats, g1, DayOfWeek.THURSDAY, "14:00", "16:00", "A104", "Prof. Chaabane", "LECTURE");

            // Timetable for Group 2 (ING3-CS-B) - offset times
            saveSlot(algo, g2, DayOfWeek.MONDAY, "10:00", "12:00", "A101", "Dr. Mansouri", "LECTURE");
            saveSlot(algo, g2, DayOfWeek.THURSDAY, "14:00", "16:00", "Lab1", "Dr. Mansouri", "TD");
            saveSlot(dbms, g2, DayOfWeek.TUESDAY, "08:00", "10:00", "A102", "Dr. Zouari", "LECTURE");
            saveSlot(dbms, g2, DayOfWeek.FRIDAY, "08:00", "10:00", "Lab2", "Dr. Zouari", "TP");
            saveSlot(networks, g2, DayOfWeek.WEDNESDAY, "10:00", "12:00", "B201", "Dr. Fersi", "LECTURE");
            saveSlot(webdev, g2, DayOfWeek.FRIDAY, "14:00", "16:00", "Lab4", "Dr. Riahi", "TP");

            // Timetable for Group 3 (MASTER-AI)
            saveSlot(ai, g3, DayOfWeek.MONDAY, "08:30", "10:30", "C301", "Dr. Baccouche", "LECTURE");
            saveSlot(ml, g3, DayOfWeek.MONDAY, "10:30", "12:30", "C301", "Dr. Baccouche", "LECTURE");
            saveSlot(ai, g3, DayOfWeek.WEDNESDAY, "14:00", "17:00", "Lab5", "Dr. Baccouche", "TP");
            saveSlot(security, g3, DayOfWeek.TUESDAY, "08:30", "10:30", "C302", "Dr. Hamdi", "LECTURE");
            saveSlot(cloud, g3, DayOfWeek.THURSDAY, "08:30", "10:30", "C303", "Dr. Ben Salah", "LECTURE");

            log.info("Courses and timetable seeded — use Group IDs {} (ING3-CS-A), {} (ING3-CS-B), {} (MASTER-AI)",
                    g1.getId(), g2.getId(), g3.getId());
        };
    }

    @Bean
    @Order(5)
    CommandLineRunner seedSkills() {
        return args -> {
            if (skillRepository.count() > 0) return;

            Skill java   = saveSkill("Java",              "Programming");
            Skill python = saveSkill("Python",            "Programming");
            Skill react  = saveSkill("React",             "Web");
            Skill sql    = saveSkill("SQL",               "Database");
            Skill ml     = saveSkill("Machine Learning",  "AI");
            Skill dl     = saveSkill("Deep Learning",     "AI");
            Skill linux  = saveSkill("Linux",             "Systems");
            Skill docker = saveSkill("Docker",            "DevOps");
            Skill git    = saveSkill("Git",               "DevOps");
            Skill spring = saveSkill("Spring Boot",       "Programming");
            Skill cyber  = saveSkill("Cybersecurity",     "Security");
            saveSkill("Algorithms",        "CS Fundamentals");
            Skill node   = saveSkill("Node.js",           "Web");
            Skill ts     = saveSkill("TypeScript",        "Web");
            Skill net    = saveSkill("Computer Networks", "Systems");

            // Skill offers for Ahmed
            userRepository.findByEmail("ahmed.ben.ali@student.unigate.com").ifPresent(user -> {
                Student s = (Student) user;
                SkillOffer offer = SkillOffer.builder()
                        .student(s)
                        .skillsOffered(Set.of(java, spring, sql, git))
                        .skillsWanted(Set.of(ml, python, docker))
                        .description("3rd-year CS student with strong Java/Spring experience. Looking to learn ML & DevOps tools.")
                        .availability("Tue/Thu 14:00–16:00")
                        .build();
                skillOfferRepository.save(offer);
            });

            // Skill offers for Sarra
            userRepository.findByEmail("sarra.trabelsi@student.unigate.com").ifPresent(user -> {
                Student s = (Student) user;
                SkillOffer offer = SkillOffer.builder()
                        .student(s)
                        .skillsOffered(Set.of(python, ml, dl))
                        .skillsWanted(Set.of(react, node, ts))
                        .description("AI Master student specialising in deep learning. Want to improve front-end skills.")
                        .availability("Mon/Wed 10:00–12:00")
                        .build();
                skillOfferRepository.save(offer);
            });

            // Skill offers for Yassine
            userRepository.findByEmail("yassine.gharbi@student.unigate.com").ifPresent(user -> {
                Student s = (Student) user;
                SkillOffer offer = SkillOffer.builder()
                        .student(s)
                        .skillsOffered(Set.of(cyber, linux, net))
                        .skillsWanted(Set.of(python, ml, docker))
                        .description("Cybersecurity enthusiast, solid in networking and Linux administration.")
                        .availability("Fri 10:00–12:00")
                        .build();
                skillOfferRepository.save(offer);
            });

            log.info("Skills and skill offers seeded");
        };
    }

    @Bean
    @Order(6)
    CommandLineRunner seedInternships() {
        return args -> {
            if (companyRepository.count() > 0) return;

            Company biat = companyRepository.save(Company.builder()
                    .name("BIAT Bank").sector("Finance & Banking").location("Tunis, Tunisia")
                    .website("https://www.biat.com.tn").contactEmail("rh@biat.com.tn").build());

            Company orange = companyRepository.save(Company.builder()
                    .name("Orange Tunisie").sector("Telecommunications").location("Tunis, Tunisia")
                    .website("https://www.orange.tn").contactEmail("careers@orange.tn").build());

            Company vermeg = companyRepository.save(Company.builder()
                    .name("Vermeg").sector("Financial Software").location("Tunis, Tunisia")
                    .website("https://www.vermeg.com").contactEmail("talent@vermeg.com").build());

            Company sopra = companyRepository.save(Company.builder()
                    .name("Sopra HR Software").sector("HR Technology").location("Ariana, Tunisia")
                    .website("https://www.soprahrSoftware.com").contactEmail("hr@soprahr.tn").build());

            Company amdocs = companyRepository.save(Company.builder()
                    .name("Amdocs Tunisia").sector("Telecom Software").location("Tunis, Tunisia")
                    .website("https://www.amdocs.com").contactEmail("recruiting@amdocs.com.tn").build());

            // Published offers
            publishOffer(biat, "Full-Stack Developer Intern",
                    "Join our Digital Transformation team to build modern web banking interfaces using React and Spring Boot.",
                    "Computer Science", "Software Engineering", 6, LocalDate.now().plusMonths(1),
                    "3rd Year", "Final Year");

            publishOffer(biat, "Data Analyst Intern",
                    "Work with our BI team on real-time financial reporting dashboards. Python and SQL required.",
                    "Computer Science", "Data Science", 4, LocalDate.now().plusDays(20),
                    "3rd Year", "Summer");

            publishOffer(orange, "Network Infrastructure Intern",
                    "Assist in the deployment and monitoring of 5G network infrastructure across Tunis.",
                    "Computer Science", "Networks", 6, LocalDate.now().plusMonths(2),
                    "3rd Year", "Final Year");

            publishOffer(orange, "Cybersecurity Intern",
                    "Support the security operations centre (SOC) with threat analysis and incident response.",
                    "Computer Science", "Cybersecurity", 4, LocalDate.now().plusDays(45),
                    "M1", "Summer");

            publishOffer(vermeg, "Backend Java Developer Intern",
                    "Contribute to our flagship financial platform built on Spring Boot microservices and Kafka.",
                    "Computer Science", "Software Engineering", 6, LocalDate.now().plusMonths(2),
                    "3rd Year", "Final Year");

            publishOffer(sopra, "Machine Learning Intern",
                    "Build NLP models to automate HR document processing and candidate screening.",
                    "Computer Science", "Artificial Intelligence", 5, LocalDate.now().plusMonths(1),
                    "M1", "Worker");

            publishOffer(amdocs, "Cloud DevOps Intern",
                    "Maintain CI/CD pipelines and migrate legacy services to AWS and Kubernetes.",
                    "Computer Science", "Cloud & DevOps", 6, LocalDate.now().plusDays(60),
                    "M2", "Final Year");

            log.info("Companies and internship offers seeded");
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private com.unigate.registration.entity.User buildUser(String first, String last, String email, String pwd, Role role, String department) {
        com.unigate.registration.entity.User u = new com.unigate.registration.entity.User();
        u.setFirstName(first); u.setLastName(last); u.setEmail(email);
        u.setPassword(pwd); u.setRole(role); u.setDepartment(department);
        u.setEnabled(true); u.setAccountNonLocked(true);
        return u;
    }

    private Student buildStudent(String first, String last, String email, String pwd,
                                  RegistrationType type, String dept, String speciality,
                                  String partnerUni, String partnerCountry, String targetSem) {
        Student s = new Student();
        s.setFirstName(first); s.setLastName(last); s.setEmail(email);
        s.setPassword(pwd); s.setRole(Role.STUDENT); s.setEnabled(true); s.setAccountNonLocked(true);
        s.setRegistrationType(type); s.setDepartment(dept); s.setSpeciality(speciality);
        s.setPartnerUniversity(partnerUni); s.setPartnerCountry(partnerCountry);
        s.setTargetSemester(targetSem);
        return s;
    }

    private Course saveCourse(String code, String name, String dept, int credits) {
        return courseRepository.save(Course.builder().code(code).name(name).department(dept).credits(credits).build());
    }

    private void saveSlot(Course course, ClassGroup group, DayOfWeek day,
                          String start, String end, String room, String instructor, String type) {
        timetableSlotRepository.save(TimetableSlot.builder()
                .course(course).classGroup(group)
                .dayOfWeek(day)
                .startTime(LocalTime.parse(start))
                .endTime(LocalTime.parse(end))
                .room(room).instructor(instructor).slotType(type)
                .build());
    }

    private Skill saveSkill(String name, String category) {
        return skillRepository.save(Skill.builder().name(name).category(category).build());
    }

    private void publishOffer(Company company, String title, String description,
                               String dept, String speciality, int durationMonths, LocalDate deadline,
                               String targetYear, String internshipType) {
        offerRepository.save(Offer.builder()
                .company(company).title(title).description(description)
                .requiredDepartment(dept).requiredSpeciality(speciality)
                .durationMonths(durationMonths)
                .targetYear(targetYear)
                .internshipType(internshipType)
                .status(OfferStatus.PUBLISHED)
                .applicationDeadline(deadline)
                .publishedAt(LocalDateTime.now().minusDays(3))
                .build());
    }
}
