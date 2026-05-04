package com.unigate.registration.validation;

import com.unigate.registration.enums.DocumentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DocumentValidatorFactory {

    private final DiplomaValidator diplomaValidator;
    private final TranscriptValidator transcriptValidator;
    private final IDCardValidator idCardValidator;
    private final PhotoValidator photoValidator;
    private final MedicalCertValidator medicalCertValidator;
    private final AgreementValidator agreementValidator;

    private Map<DocumentType, DocumentValidator> validatorMap;

    @jakarta.annotation.PostConstruct
    private void init() {
        validatorMap = new EnumMap<>(DocumentType.class);
        validatorMap.put(DocumentType.DIPLOMA, diplomaValidator);
        validatorMap.put(DocumentType.TRANSCRIPT, transcriptValidator);
        validatorMap.put(DocumentType.ID_CARD, idCardValidator);
        validatorMap.put(DocumentType.PHOTO, photoValidator);
        validatorMap.put(DocumentType.MEDICAL_CERT, medicalCertValidator);
        validatorMap.put(DocumentType.AGREEMENT, agreementValidator);
    }

    public DocumentValidator getValidator(DocumentType type) {
        DocumentValidator validator = validatorMap.get(type);
        if (validator == null) {
            throw new IllegalArgumentException("No validator found for document type: " + type);
        }
        return validator;
    }
}
