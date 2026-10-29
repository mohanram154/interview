package com.interview.platform.service;

import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.Question;
import com.interview.platform.exception.ResourceNotFoundException;
import com.interview.platform.repository.JobRoleRepository;
import com.interview.platform.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JobRoleService {

    private final JobRoleRepository jobRoleRepository;
    private final QuestionRepository questionRepository;

    public JobRoleService(JobRoleRepository jobRoleRepository, QuestionRepository questionRepository) {
        this.jobRoleRepository = jobRoleRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public List<JobRole> getAllActiveRoles() {
        return jobRoleRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public JobRole getRoleById(Long id) {
        return jobRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job role not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Question> getQuestionsForRole(Long roleId) {
        if (!jobRoleRepository.existsById(roleId)) {
            throw new ResourceNotFoundException("Job role not found with ID: " + roleId);
        }
        return questionRepository.findByJobRoleIdAndActiveTrue(roleId);
    }
}
