package com.interview.platform;

import com.interview.platform.dto.auth.AuthResponse;
import com.interview.platform.dto.auth.GoogleTokenRequest;
import com.interview.platform.dto.auth.RegisterRequest;
import com.interview.platform.entity.User;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.repository.CandidateProfileRepository;
import com.interview.platform.repository.UserRepository;
import com.interview.platform.security.GoogleTokenVerifierService;
import com.interview.platform.security.JwtService;
import com.interview.platform.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CandidateProfileRepository candidateProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                candidateProfileRepository,
                passwordEncoder,
                jwtService,
                googleTokenVerifierService,
                authenticationManager
        );
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest();
        req.setName("John Doe");
        req.setEmail("john@example.com");
        req.setPassword("secret123");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashedPassword");

        User savedUser = new User("John Doe", "john@example.com", "hashedPassword", "LOCAL", "ROLE_CANDIDATE");
        savedUser.setId(1L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(1L, "john@example.com", "ROLE_CANDIDATE")).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("john@example.com", response.getUser().getEmail());
        assertEquals("John Doe", response.getUser().getName());
        verify(candidateProfileRepository, times(1)).save(any());
    }

    @Test
    void testRegisterDuplicateEmailThrowsBadRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setName("John Doe");
        req.setEmail("existing@example.com");
        req.setPassword("secret123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testGoogleLoginWithoutConfigurationThrowsException() {
        GoogleTokenRequest req = new GoogleTokenRequest("sample-token");
        when(googleTokenVerifierService.verify("sample-token"))
                .thenThrow(new BadRequestException("Google Authentication is not configured on this server. Please configure GOOGLE_CLIENT_ID in your environment variables."));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.loginWithGoogle(req));
        assertTrue(ex.getMessage().contains("GOOGLE_CLIENT_ID"));
    }
}
