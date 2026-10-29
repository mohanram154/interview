package com.interview.platform.repository;

import com.interview.platform.entity.VideoInterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoInterviewQuestionRepository extends JpaRepository<VideoInterviewQuestion, Long> {

    List<VideoInterviewQuestion> findByAssessmentSessionIdOrderBySequenceNumberAsc(Long assessmentSessionId);

    Optional<VideoInterviewQuestion> findByIdAndAssessmentSessionId(Long id, Long assessmentSessionId);

    long countByAssessmentSessionIdAndStatus(Long assessmentSessionId, String status);

    long countByAssessmentSessionId(Long assessmentSessionId);
}

