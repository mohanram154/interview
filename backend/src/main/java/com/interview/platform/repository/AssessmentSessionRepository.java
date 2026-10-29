package com.interview.platform.repository;

import com.interview.platform.entity.AssessmentSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentSessionRepository extends JpaRepository<AssessmentSession, Long> {
    List<AssessmentSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<AssessmentSession> findByIdAndUserId(Long id, Long userId);
    Optional<AssessmentSession> findFirstByUserIdAndSessionStatusOrderByCreatedAtDesc(Long userId, String sessionStatus);
}
