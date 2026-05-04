package com.unigate.common.config;

import com.unigate.grades.entity.GradeConfig;
import com.unigate.grades.entity.StudentGrade;
import com.unigate.grades.repository.GradeConfigRepository;
import com.unigate.grades.repository.StudentGradeRepository;
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
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final GradeConfigRepository gradeConfigRepository;
    private final StudentGradeRepository studentGradeRepository;
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
            ensureAdminUser("Super", "Admin", "superadmin@unigate.com", encoded, Role.SUPER_ADMIN);
            ensureAdminUser("Department", "Admin", "admin@unigate.com", encoded, Role.ADMIN);
            log.info("Admin users ensured — login: admin@unigate.com / Admin@1234");
        };
    }

    private void ensureAdminUser(String first, String last, String email, String pwd, Role role) {
        userRepository.findByEmail(email).ifPresentOrElse(
            u -> {
                // Fix stale rows that were seeded with enabled=false
                if (!u.isEnabled() || !u.isAccountNonLocked()) {
                    u.setEnabled(true);
                    u.setAccountNonLocked(true);
                    userRepository.save(u);
                    log.info("Fixed disabled admin account: {}", email);
                }
            },
            () -> userRepository.save(buildUser(first, last, email, pwd, role))
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

            log.info("Students seeded — login: ahmed.ben.ali@student.unigate.com / Student@1234");
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
                    .name("ING3-CS-A").department("Computer Science").year(3).semester("S5").build());
            ClassGroup g2 = classGroupRepository.save(ClassGroup.builder()
                    .name("ING3-CS-B").department("Computer Science").year(3).semester("S5").build());
            ClassGroup g3 = classGroupRepository.save(ClassGroup.builder()
                    .name("MASTER-AI").department("Computer Science").year(4).semester("S7").build());

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
    @Order(4)
    CommandLineRunner seedGrades() {
        return args -> {
            if (gradeConfigRepository.count() > 0) return;

            // Grade configs
            GradeConfig gc1 = saveGradeConfig("INFO101", "Algorithms & Data Structures", "Computer Science", 0.4, 0.6, 6, 1);
            GradeConfig gc2 = saveGradeConfig("INFO102", "Database Management Systems", "Computer Science", 0.4, 0.6, 5, 1);
            GradeConfig gc3 = saveGradeConfig("INFO103", "Computer Networks", "Computer Science", 0.3, 0.7, 4, 2);
            GradeConfig gc4 = saveGradeConfig("INFO104", "Web Development", "Computer Science", 0.5, 0.5, 4, 2);
            GradeConfig gc5 = saveGradeConfig("INFO201", "Artificial Intelligence", "Computer Science", 0.4, 0.6, 5, 3);
            GradeConfig gc6 = saveGradeConfig("INFO202", "Machine Learning", "Computer Science", 0.4, 0.6, 5, 3);
            GradeConfig gc7 = saveGradeConfig("INFO203", "Operating Systems", "Computer Science", 0.3, 0.7, 4, 3);
            GradeConfig gc8 = saveGradeConfig("INFO301", "Software Engineering", "Computer Science", 0.4, 0.6, 5, 5);
            GradeConfig gc9 = saveGradeConfig("MATH101", "Linear Algebra", "Mathematics", 0.4, 0.6, 4, 1);
            GradeConfig gc10 = saveGradeConfig("MATH102", "Probability & Statistics", "Mathematics", 0.4, 0.6, 4, 2);

            // Seed grades for Ahmed (APPROVED student)
            userRepository.findByEmail("ahmed.ben.ali@student.unigate.com").ifPresent(user -> {
                Student s = (Student) user;
                saveGrade(s, gc1, 14.5, 13.0);
                saveGrade(s, gc2, 16.0, 15.5);
                saveGrade(s, gc3, 12.0, 11.0);
                saveGrade(s, gc4, 18.0, 17.0);
                saveGrade(s, gc5, 13.5, 12.0);
                saveGrade(s, gc6, 15.0, 14.0);
                saveGrade(s, gc7, 11.0, 9.5);
                saveGrade(s, gc8, 17.0, 16.0);
                saveGrade(s, gc9, 14.0, 13.5);
                saveGrade(s, gc10, 15.5, 14.5);
            });

            // Seed grades for Sarra (MASTER student)
            userRepository.findByEmail("sarra.trabelsi@student.unigate.com").ifPresent(user -> {
                Student s = (Student) user;
                saveGrade(s, gc5, 17.0, 16.5);
                saveGrade(s, gc6, 18.5, 17.0);
                saveGrade(s, gc7, 14.0, 13.0);
            });

            log.info("Grade configs and student grades seeded");
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
                    "Computer Science", "Software Engineering", 6, LocalDate.now().plusMonths(1));

            publishOffer(biat, "Data Analyst Intern",
                    "Work with our BI team on real-time financial reporting dashboards. Python and SQL required.",
                    "Computer Science", "Data Science", 4, LocalDate.now().plusDays(20));

            publishOffer(orange, "Network Infrastructure Intern",
                    "Assist in the deployment and monitoring of 5G network infrastructure across Tunis.",
                    "Computer Science", "Networks", 6, LocalDate.now().plusMonths(2));

            publishOffer(orange, "Cybersecurity Intern",
                    "Support the security operations centre (SOC) with threat analysis and incident response.",
                    "Computer Science", "Cybersecurity", 4, LocalDate.now().plusDays(45));

            publishOffer(vermeg, "Backend Java Developer Intern",
                    "Contribute to our flagship financial platform built on Spring Boot microservices and Kafka.",
                    "Computer Science", "Software Engineering", 6, LocalDate.now().plusMonths(2));

            publishOffer(sopra, "Machine Learning Intern",
                    "Build NLP models to automate HR document processing and candidate screening.",
                    "Computer Science", "Artificial Intelligence", 5, LocalDate.now().plusMonths(1));

            publishOffer(amdocs, "Cloud DevOps Intern",
                    "Maintain CI/CD pipelines and migrate legacy services to AWS and Kubernetes.",
                    "Computer Science", "Cloud & DevOps", 6, LocalDate.now().plusDays(60));

            log.info("Companies and internship offers seeded");
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private com.unigate.registration.entity.User buildUser(String first, String last, String email, String pwd, Role role) {
        com.unigate.registration.entity.User u = new com.unigate.registration.entity.User();
        u.setFirstName(first); u.setLastName(last); u.setEmail(email);
        u.setPassword(pwd); u.setRole(role); u.setEnabled(true); u.setAccountNonLocked(true);
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

    private GradeConfig saveGradeConfig(String code, String name, String dept,
                                         double ccW, double examW, int credits, int semester) {
        return gradeConfigRepository.save(GradeConfig.builder()
                .moduleCode(code).moduleName(name).department(dept)
                .ccWeight(ccW).examWeight(examW).credits(credits).semester(semester)
                .build());
    }

    private void saveGrade(Student student, GradeConfig config, double cc, double exam) {
        double finalMark = config.getCcWeight() * cc + config.getExamWeight() * exam;
        studentGradeRepository.save(StudentGrade.builder()
                .student(student).gradeConfig(config)
                .ccMark(cc).examMark(exam)
                .finalMark(Math.round(finalMark * 100.0) / 100.0)
                .passed(finalMark >= 10.0)
                .build());
    }

    private Skill saveSkill(String name, String category) {
        return skillRepository.save(Skill.builder().name(name).category(category).build());
    }

    private void publishOffer(Company company, String title, String description,
                               String dept, String speciality, int durationMonths, LocalDate deadline) {
        offerRepository.save(Offer.builder()
                .company(company).title(title).description(description)
                .requiredDepartment(dept).requiredSpeciality(speciality)
                .durationMonths(durationMonths)
                .status(OfferStatus.PUBLISHED)
                .applicationDeadline(deadline)
                .publishedAt(LocalDateTime.now().minusDays(3))
                .build());
    }
}
