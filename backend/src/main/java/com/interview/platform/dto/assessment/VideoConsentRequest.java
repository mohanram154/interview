package com.interview.platform.dto.assessment;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public class VideoConsentRequest {

    @NotNull(message = "Consent flag is required")
    @AssertTrue(message = "Explicit candidate consent is required before commencing the video interview recording")
    private Boolean consentGiven;

    private String notes;

    public VideoConsentRequest() {}

    public VideoConsentRequest(Boolean consentGiven) {
        this.consentGiven = consentGiven;
    }

    public Boolean getConsentGiven() {
        return consentGiven;
    }

    public void setConsentGiven(Boolean consentGiven) {
        this.consentGiven = consentGiven;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
