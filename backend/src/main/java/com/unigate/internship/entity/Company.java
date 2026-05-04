package com.unigate.internship.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String name;
    private String sector;
    private String location;
    private String website;
    private String contactEmail;
}
