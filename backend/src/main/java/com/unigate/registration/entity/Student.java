package com.unigate.registration.entity;

import com.unigate.registration.enums.RegistrationType;
import com.unigate.timetable.entity.ClassGroup;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "students")
@PrimaryKeyJoinColumn(name = "user_id")
@Getter @Setter @NoArgsConstructor
public class Student extends User {

    @Enumerated(EnumType.STRING)
    private RegistrationType registrationType;

    private String speciality;
    private String partnerUniversity;
    private String partnerCountry;
    private String targetSemester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_group_id")
    private ClassGroup classGroup;

    @OneToOne(mappedBy = "student", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Application application;
}
