package com.interview.platform.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class GoogleTokenRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    public GoogleTokenRequest() {}

    public GoogleTokenRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}

