package com.unigate.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NewOfferPublishedEvent extends ApplicationEvent {

    private final Long offerId;
    private final String offerTitle;
    private final String company;

    public NewOfferPublishedEvent(Object source, Long offerId, String offerTitle, String company) {
        super(source);
        this.offerId = offerId;
        this.offerTitle = offerTitle;
        this.company = company;
    }
}
