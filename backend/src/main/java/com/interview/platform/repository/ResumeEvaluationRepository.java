package com.interview.platform.repository;

import com.interview.platform.entity.ResumeEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeEvaluationRepository extends JpaRepository<ResumeEvaluation, Long> {

    Optional<ResumeEvaluation> findByAssessmentSessionId(Long assessmentSessionId);

    Optional<ResumeEvaluation> findByAssessmentSessionIdAndUserId(Long assessmentSessionId, Long userId);
}
