package com.interview.platform;

import com.interview.platform.dto.profile.ProfileRequest;
import com.interview.platform.dto.profile.ProfileResponse;
import com.interview.platform.entity.CandidateProfile;
import com.interview.platform.entity.User;
import com.interview.platform.repository.CandidateProfileRepository;
import com.interview.platform.repository.UserRepository;
import com.interview.platform.service.CandidateProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateProfileTest {

    @Mock
    private CandidateProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    private CandidateProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new CandidateProfileService(profileRepository, userRepository);
    }

    @Test
    void testGetAndAutoCreateProfile() {
        User user = new User("Bob", "bob@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(5L);

        when(profileRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        CandidateProfile newProfile = new CandidateProfile(user);
        newProfile.setId(10L);
        when(profileRepository.save(any(CandidateProfile.class))).thenReturn(newProfile);

        ProfileResponse response = profileService.getProfile(5L);

        assertNotNull(response);
        assertEquals(5L, response.getUserId());
        assertEquals("Bob", response.getName());
    }

    @Test
    void testUpdateProfile() {
        User user = new User("Bob", "bob@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(5L);

        CandidateProfile profile = new CandidateProfile(user);
        profile.setId(10L);

        when(profileRepository.findByUserId(5L)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any(CandidateProfile.class))).thenAnswer(i -> i.getArgument(0));

        ProfileRequest req = new ProfileRequest();
        req.setEducation("Stanford University");
        req.setDegree("B.S. in Computer Science");
        req.setSkills("Java, Spring Boot, MySQL, React");
        req.setExperienceYears(3);
        req.setPreferredRole("Backend Developer");

        ProfileResponse updated = profileService.updateProfile(5L, req);

        assertEquals("Stanford University", updated.getEducation());
        assertEquals("B.S. in Computer Science", updated.getDegree());
        assertEquals(3, updated.getExperienceYears());
        assertEquals("Backend Developer", updated.getPreferredRole());
    }
}

