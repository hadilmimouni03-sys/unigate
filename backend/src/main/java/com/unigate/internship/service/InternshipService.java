package com.unigate.internship.service;

import com.unigate.exception.BusinessException;
import com.unigate.exception.ResourceNotFoundException;
import com.unigate.internship.dto.InternshipApplicationDTO;
import com.unigate.internship.dto.OfferDTO;
import com.unigate.internship.entity.Company;
import com.unigate.internship.entity.InternshipApplication;
import com.unigate.internship.entity.Offer;
import com.unigate.internship.enums.ApplicationInternshipStatus;
import com.unigate.internship.enums.OfferStatus;
import com.unigate.internship.repository.CompanyRepository;
import com.unigate.internship.repository.InternshipApplicationRepository;
import com.unigate.internship.repository.OfferRepository;
import com.unigate.notification.event.NewOfferPublishedEvent;
import com.unigate.registration.entity.Student;
import com.unigate.registration.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternshipService {

    private final OfferRepository offerRepository;
    private final CompanyRepository companyRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<OfferDTO> getPublishedOffers(String department) {
        List<Offer> offers = (department != null && !department.isBlank())
                ? offerRepository.findByStatusAndRequiredDepartment(OfferStatus.PUBLISHED, department)
                : offerRepository.findByStatus(OfferStatus.PUBLISHED);
        return offers.stream().map(this::toOfferDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfferDTO> getAllOffers() {
        return offerRepository.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toOfferDTO).collect(Collectors.toList());
    }

    @Transactional
    public OfferDTO publishOffer(Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer", offerId));
        if (offer.getStatus() != OfferStatus.DRAFT) {
            throw new BusinessException("Only DRAFT offers can be published");
        }
        offer.setStatus(OfferStatus.PUBLISHED);
        offer.setPublishedAt(LocalDateTime.now());
        offer = offerRepository.save(offer);

        eventPublisher.publishEvent(
                new NewOfferPublishedEvent(this, offer.getId(), offer.getTitle(), offer.getCompany().getName()));
        return toOfferDTO(offer);
    }

    @Transactional
    public OfferDTO createOffer(OfferDTO dto) {
        Company company;
        if (dto.getCompanyId() != null) {
            company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", dto.getCompanyId()));
        } else {
            String name = (dto.getCompanyName() != null && !dto.getCompanyName().isBlank())
                    ? dto.getCompanyName().trim() : "Unknown Company";
            company = companyRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> companyRepository.save(
                            Company.builder().name(name).build()));
        }
        Offer offer = Offer.builder()
                .company(company)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .requiredDepartment(dto.getRequiredDepartment())
                .requiredSpeciality(dto.getRequiredSpeciality())
                .internshipType(dto.getInternshipType())
                .targetYear(dto.getTargetYear())
                .durationMonths(dto.getDurationMonths())
                .applicationDeadline(dto.getApplicationDeadline())
                .minGpa(dto.getMinGpa())
                .linkedInUrl(dto.getLinkedInUrl())
                .build();
        return toOfferDTO(offerRepository.save(offer));
    }

    @Transactional
    public InternshipApplicationDTO apply(Long studentId, Long offerId, String coverLetter,
                                          MultipartFile cvFile) throws IOException {
        if (applicationRepository.existsByStudentIdAndOfferId(studentId, offerId)) {
            throw new BusinessException("You have already applied to this offer");
        }
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer", offerId));
        if (offer.getStatus() != OfferStatus.PUBLISHED) {
            throw new BusinessException("This offer is not open for applications");
        }
        if (offer.getApplicationDeadline() != null && offer.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new BusinessException("Application deadline has passed");
        }
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        String cvFilePath = null;
        String cvFileName = null;
        if (cvFile != null && !cvFile.isEmpty()) {
            Path dir = Paths.get(uploadDir, "cv", String.valueOf(studentId));
            Files.createDirectories(dir);
            cvFileName = UUID.randomUUID() + "_" + cvFile.getOriginalFilename();
            Path dest = dir.resolve(cvFileName);
            cvFile.transferTo(dest);
            cvFilePath = dest.toString();
        }

        InternshipApplication app = InternshipApplication.builder()
                .student(student)
                .offer(offer)
                .coverLetter(coverLetter)
                .cvFilePath(cvFilePath)
                .cvFileName(cvFileName)
                .build();
        return toAppDTO(applicationRepository.save(app));
    }

    @Transactional
    public InternshipApplicationDTO updateStatus(Long appId, ApplicationInternshipStatus newStatus, String note) {
        InternshipApplication app = applicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException("InternshipApplication", appId));
        app.setStatus(newStatus);
        app.setAdminNote(note);
        return toAppDTO(applicationRepository.save(app));
    }

    @Transactional(readOnly = true)
    public List<InternshipApplicationDTO> getMyApplications(Long studentId) {
        return applicationRepository.findByStudentId(studentId)
                .stream().map(this::toAppDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InternshipApplicationDTO> getApplicationsForOffer(Long offerId) {
        return applicationRepository.findByOfferId(offerId)
                .stream().map(this::toAppDTO).collect(Collectors.toList());
    }

    /** Daily at midnight — expire offers past their deadline */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireDeadlinedOffers() {
        List<Offer> expired = offerRepository.findExpiredOffers(LocalDate.now());
        expired.forEach(o -> o.setStatus(OfferStatus.EXPIRED));
        offerRepository.saveAll(expired);
        if (!expired.isEmpty()) {
            log.info("Expired {} internship offer(s)", expired.size());
        }
    }

    private OfferDTO toOfferDTO(Offer o) {
        return OfferDTO.builder()
                .id(o.getId())
                .companyId(o.getCompany().getId())
                .companyName(o.getCompany().getName())
                .title(o.getTitle())
                .description(o.getDescription())
                .requiredDepartment(o.getRequiredDepartment())
                .requiredSpeciality(o.getRequiredSpeciality())
                .internshipType(o.getInternshipType())
                .targetYear(o.getTargetYear())
                .durationMonths(o.getDurationMonths())
                .status(o.getStatus())
                .applicationDeadline(o.getApplicationDeadline())
                .publishedAt(o.getPublishedAt())
                .location(o.getCompany().getLocation())
                .contactEmail(o.getCompany().getContactEmail())
                .companyWebsite(o.getCompany().getWebsite())
                .minGpa(o.getMinGpa())
                .linkedInUrl(o.getLinkedInUrl())
                .build();
    }

    private InternshipApplicationDTO toAppDTO(InternshipApplication a) {
        return InternshipApplicationDTO.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullName())
                .offerId(a.getOffer().getId())
                .offerTitle(a.getOffer().getTitle())
                .companyName(a.getOffer().getCompany().getName())
                .status(a.getStatus())
                .coverLetter(a.getCoverLetter())
                .cvFileName(a.getCvFileName())
                .cvDownloadUrl(a.getCvFileName() != null ? "/api/internships/applications/" + a.getId() + "/cv" : null)
                .adminNote(a.getAdminNote())
                .appliedAt(a.getAppliedAt())
                .build();
    }
}
