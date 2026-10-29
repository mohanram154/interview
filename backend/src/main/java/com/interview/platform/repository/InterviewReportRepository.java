package com.interview.platform.repository;

import com.interview.platform.entity.InterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewReportRepository extends JpaRepository<InterviewReport, Long> {
    Optional<InterviewReport> findByInterviewId(Long interviewId);

    @Query("SELECT r FROM InterviewReport r JOIN r.interview i WHERE i.user.id = :userId ORDER BY r.createdAt DESC")
    List<InterviewReport> findByUserId(@Param("userId") Long userId);

    @Query("SELECT AVG(r.overallScore) FROM InterviewReport r JOIN r.interview i WHERE i.user.id = :userId")
    Double getAverageScoreByUserId(@Param("userId") Long userId);
}

