package com.interview.platform.repository;

import com.interview.platform.entity.JobRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRoleRepository extends JpaRepository<JobRole, Long> {
    List<JobRole> findByActiveTrue();
    Optional<JobRole> findByNameIgnoreCase(String name);
}
