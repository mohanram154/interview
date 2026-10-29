package com.interview.platform.repository;

import com.interview.platform.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findByInterviewIdOrderBySequenceNumberAsc(Long interviewId);
    Optional<InterviewQuestion> findByIdAndInterviewId(Long id, Long interviewId);
}

