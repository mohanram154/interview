package com.interview.platform.service;

import com.interview.platform.dto.profile.ProfileRequest;
import com.interview.platform.dto.profile.ProfileResponse;
import com.interview.platform.entity.CandidateProfile;
import com.interview.platform.entity.User;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.repository.CandidateProfileRepository;
import com.interview.platform.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CandidateProfileService {

    private final CandidateProfileRepository profileRepository;
    private final UserRepository userRepository;

    public CandidateProfileService(CandidateProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProfileResponse getProfile(Long userId) {
        CandidateProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
                    CandidateProfile newProfile = new CandidateProfile(user);
                    return profileRepository.save(newProfile);
                });
        return mapToProfileResponse(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileRequest request) {
        CandidateProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
                    CandidateProfile newProfile = new CandidateProfile(user);
                    return profileRepository.save(newProfile);
                });

        if (request.getEducation() != null) profile.setEducation(request.getEducation().trim());
        if (request.getDegree() != null) profile.setDegree(request.getDegree().trim());
        if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization().trim());
        if (request.getSkills() != null) profile.setSkills(request.getSkills().trim());
        profile.setExperienceYears(Math.max(0, request.getExperienceYears()));
        if (request.getPreferredRole() != null) profile.setPreferredRole(request.getPreferredRole().trim());

        CandidateProfile updated = profileRepository.save(profile);
        return mapToProfileResponse(updated);
    }

    private ProfileResponse mapToProfileResponse(CandidateProfile profile) {
        ProfileResponse response = new ProfileResponse();
        response.setId(profile.getId());
        response.setUserId(profile.getUser().getId());
        response.setName(profile.getUser().getName());
        response.setEmail(profile.getUser().getEmail());
        response.setEducation(profile.getEducation());
        response.setDegree(profile.getDegree());
        response.setSpecialization(profile.getSpecialization());
        response.setSkills(profile.getSkills());
        response.setExperienceYears(profile.getExperienceYears());
        response.setPreferredRole(profile.getPreferredRole());
        response.setUpdatedAt(profile.getUpdatedAt());
        return response;
    }
}
