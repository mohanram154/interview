package com.interview.platform.repository;

import com.interview.platform.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    Optional<Answer> findByInterviewQuestionId(Long interviewQuestionId);
    boolean existsByInterviewQuestionId(Long interviewQuestionId);
}
