package com.interview.platform.controller;

import com.interview.platform.dto.common.ApiResponse;
import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.Question;
import com.interview.platform.service.JobRoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/job-roles")
public class JobRoleController {

    private final JobRoleService jobRoleService;

    public JobRoleController(JobRoleService jobRoleService) {
        this.jobRoleService = jobRoleService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobRole>>> getAllJobRoles() {
        List<JobRole> roles = jobRoleService.getAllActiveRoles();
        return ResponseEntity.ok(ApiResponse.success("Job roles retrieved", roles));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobRole>> getJobRoleById(@PathVariable Long id) {
        JobRole role = jobRoleService.getRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("Job role retrieved", role));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<List<Question>>> getQuestionsForJobRole(@PathVariable Long id) {
        List<Question> questions = jobRoleService.getQuestionsForRole(id);
        return ResponseEntity.ok(ApiResponse.success("Questions retrieved for job role", questions));
    }
}

