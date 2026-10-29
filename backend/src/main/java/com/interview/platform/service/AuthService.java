package com.interview.platform.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.interview.platform.dto.auth.*;
import com.interview.platform.entity.CandidateProfile;
import com.interview.platform.entity.User;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.repository.CandidateProfileRepository;
import com.interview.platform.repository.UserRepository;
import com.interview.platform.security.GoogleTokenVerifierService;
import com.interview.platform.security.JwtService;
import com.interview.platform.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            CandidateProfileRepository candidateProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifierService googleTokenVerifierService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.candidateProfileRepository = candidateProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists.");
        }

        User user = new User(
                request.getName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                "LOCAL",
                "ROLE_CANDIDATE"
        );
        user.setEmailVerified(true);
        User savedUser = userRepository.save(user);

        // Create initial candidate profile
        CandidateProfile profile = new CandidateProfile(savedUser);
        candidateProfileRepository.save(profile);

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());
        return new AuthResponse(token, mapToUserResponse(savedUser));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, mapToUserResponse(user));
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleTokenRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifierService.verify(request.getIdToken());

        String googleSubject = payload.getSubject();
        String email = payload.getEmail().trim().toLowerCase();
        String rawName = (String) payload.get("name");
        final String finalName = (rawName != null && !rawName.isBlank()) ? rawName.trim() : email.split("@")[0];

        User user = userRepository.findByGoogleSubject(googleSubject)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existingUser -> {
                            // Link existing account
                            existingUser.setGoogleSubject(googleSubject);
                            existingUser.setEmailVerified(true);
                            return userRepository.save(existingUser);
                        })
                        .orElseGet(() -> {
                            // Create new user
                            User newUser = new User(finalName, email, null, "GOOGLE", "ROLE_CANDIDATE");
                            newUser.setGoogleSubject(googleSubject);
                            newUser.setEmailVerified(true);
                            User saved = userRepository.save(newUser);

                            CandidateProfile profile = new CandidateProfile(saved);
                            candidateProfileRepository.save(profile);
                            return saved;
                        })
                );

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, mapToUserResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));
        return mapToUserResponse(user);
    }

    public UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAuthProvider(),
                user.isEmailVerified(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
