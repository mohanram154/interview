package com.interview.platform.repository;

import com.interview.platform.entity.AssessmentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentReportRepository extends JpaRepository<AssessmentReport, Long> {

    Optional<AssessmentReport> findByAssessmentSessionId(Long assessmentSessionId);

    List<AssessmentReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByAssessmentSessionId(Long assessmentSessionId);
}

