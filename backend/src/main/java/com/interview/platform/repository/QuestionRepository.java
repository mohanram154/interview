package com.interview.platform.repository;

import com.interview.platform.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByJobRoleIdAndActiveTrue(Long jobRoleId);
    List<Question> findByJobRoleIdAndDifficultyIgnoreCaseAndActiveTrue(Long jobRoleId, String difficulty);

    @Query(value = "SELECT * FROM questions WHERE job_role_id = :roleId AND difficulty = :difficulty AND active = true ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomQuestions(@Param("roleId") Long roleId, @Param("difficulty") String difficulty, @Param("limit") int limit);
}
