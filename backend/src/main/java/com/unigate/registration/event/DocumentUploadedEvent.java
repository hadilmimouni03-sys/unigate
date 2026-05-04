package com.unigate.registration.event;

import com.unigate.registration.entity.Document;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DocumentUploadedEvent extends ApplicationEvent {

    private final Document document;

    public DocumentUploadedEvent(Object source, Document document) {
        super(source);
        this.document = document;
    }
}
