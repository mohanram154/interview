package com.interview.platform.repository;

import com.interview.platform.entity.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Interview> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Interview> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndStatus(Long userId, String status);
}

