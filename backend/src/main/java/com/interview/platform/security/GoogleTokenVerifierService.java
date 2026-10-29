package com.interview.platform.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.interview.platform.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;


import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    private final String configuredClientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierService(@Value("${app.google.client-id:}") String configuredClientId) {
        this.configuredClientId = configuredClientId != null ? configuredClientId.trim() : "";
        if (StringUtils.hasText(this.configuredClientId)) {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.configuredClientId))
                    .build();
            log.info("GoogleIdTokenVerifier initialized with Client ID: {}", this.configuredClientId);
        } else {
            this.verifier = null;
            log.warn("GOOGLE_CLIENT_ID is not configured. Google Sign-In verification will require GOOGLE_CLIENT_ID in backend configuration.");
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(this.configuredClientId) && this.verifier != null;
    }

    public GoogleIdToken.Payload verify(String idTokenString) {
        if (!isConfigured()) {
            throw new BadRequestException("Google Authentication is not configured on this server. Please configure GOOGLE_CLIENT_ID in your environment variables.");
        }

        if (!StringUtils.hasText(idTokenString)) {
            throw new BadRequestException("Google ID token cannot be empty.");
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                log.warn("Google ID token verification failed: null token returned by GoogleIdTokenVerifier");
                throw new BadRequestException("Invalid or expired Google ID token.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                throw new BadRequestException("Google account email is not verified.");
            }

            return payload;
        } catch (GeneralSecurityException | IOException e) {
            log.error("Exception during Google ID token verification: {}", e.getMessage());
            throw new BadRequestException("Google token verification failed: " + e.getMessage());
        }
    }
}

