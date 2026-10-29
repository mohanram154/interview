package com.interview.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.platform.client.AiServiceClient;
import com.interview.platform.dto.resume.ResumeEvaluationResponse;
import com.interview.platform.dto.resume.ResumeParseResponse;
import com.interview.platform.dto.resume.SubmitResumeEvaluationRequest;
import com.interview.platform.entity.AssessmentSession;
import com.interview.platform.entity.JobRole;
import com.interview.platform.entity.ResumeEvaluation;
import com.interview.platform.entity.User;
import com.interview.platform.exception.BadRequestException;
import com.interview.platform.repository.AssessmentSessionRepository;
import com.interview.platform.repository.ResumeEvaluationRepository;
import com.interview.platform.service.ResumeEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeEvaluationServiceTest {

    @Mock private AssessmentSessionRepository assessmentSessionRepository;
    @Mock private ResumeEvaluationRepository resumeEvaluationRepository;
    @Mock private AiServiceClient aiServiceClient;

    private ResumeEvaluationService resumeEvaluationService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        resumeEvaluationService = new ResumeEvaluationService(
                assessmentSessionRepository,
                resumeEvaluationRepository,
                aiServiceClient,
                objectMapper,
                5242880L // 5 MB
        );
    }

    @Test
    void testValidateResumeFileRejectsEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[0]);
        assertThrows(BadRequestException.class, () -> resumeEvaluationService.validateResumeFile(emptyFile));
    }

    @Test
    void testValidateResumeFileRejectsOversizedFile() {
        byte[] oversizedBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile oversized = new MockMultipartFile("file", "resume.pdf", "application/pdf", oversizedBytes);
        assertThrows(BadRequestException.class, () -> resumeEvaluationService.validateResumeFile(oversized));
    }

    @Test
    void testValidateResumeFileRejectsUnsupportedExtension() {
        byte[] content = "some content".getBytes();
        MockMultipartFile txtFile = new MockMultipartFile("file", "resume.txt", "text/plain", content);
        assertThrows(BadRequestException.class, () -> resumeEvaluationService.validateResumeFile(txtFile));
    }

    @Test
    void testValidateResumeFileRejectsCorruptedHeader() {
        byte[] corruptPdf = "INVALID_HEADER_DATA_12345".getBytes();
        MockMultipartFile corruptFile = new MockMultipartFile("file", "resume.pdf", "application/pdf", corruptPdf);
        assertThrows(BadRequestException.class, () -> resumeEvaluationService.validateResumeFile(corruptFile));
    }

    @Test
    void testValidateResumeFileAcceptsValidPdfHeader() {
        byte[] validPdf = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile pdfFile = new MockMultipartFile("file", "resume.pdf", "application/pdf", validPdf);
        assertDoesNotThrow(() -> resumeEvaluationService.validateResumeFile(pdfFile));
    }

    @Test
    void testValidateResumeFileAcceptsValidDocxHeader() {
        byte[] validDocx = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00};
        MockMultipartFile docxFile = new MockMultipartFile("file", "resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", validDocx);
        assertDoesNotThrow(() -> resumeEvaluationService.validateResumeFile(docxFile));
    }

    @Test
    void testValidateTargetRoleNormalizesAllEightRoles() {
        String[] roles = {
                "Full Stack Developer", "Software Developer", "Java Developer",
                "Frontend Developer", "Backend Developer", "Python Developer",
                "Data Analyst", "AI/ML Engineer"
        };
        for (String role : roles) {
            assertEquals(role, resumeEvaluationService.validateTargetRole(role));
            assertEquals(role, resumeEvaluationService.validateTargetRole(role.toLowerCase()));
        }
    }

    @Test
    void testUploadAndParseKeepsMcqLocked() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setResumeStageStatus("AVAILABLE");
        session.setMcqStageStatus("LOCKED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        byte[] validPdf = "%PDF-1.4 test resume bytes".getBytes();
        MockMultipartFile pdfFile = new MockMultipartFile("file", "alice_resume.pdf", "application/pdf", validPdf);

        Map<String, Object> mockExtracted = new HashMap<>();
        mockExtracted.put("contactDetails", Map.of("name", "Alice", "email", "alice@example.com"));

        when(aiServiceClient.parseResume(any())).thenReturn(mockExtracted);

        ResumeParseResponse resp = resumeEvaluationService.uploadAndParseResume(100L, 10L, pdfFile, "Java Developer");

        assertNotNull(resp);
        assertEquals("alice_resume.pdf", resp.getFilename());
        assertEquals("IN_PROGRESS", session.getResumeStageStatus());
        assertEquals("LOCKED", session.getMcqStageStatus(), "MCQ must remain locked after upload/parse");
    }

    @Test
    void testEvaluateAndPersistUnlocksMcqRound() {
        User user = new User("Alice", "alice@example.com", "pass", "LOCAL", "ROLE_CANDIDATE");
        user.setId(10L);

        JobRole role = new JobRole("Java Developer", "Description");
        role.setId(1L);

        AssessmentSession session = new AssessmentSession();
        session.setId(100L);
        session.setUser(user);
        session.setJobRole(role);
        session.setResumeStageStatus("IN_PROGRESS");
        session.setMcqStageStatus("LOCKED");

        when(assessmentSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(resumeEvaluationRepository.findByAssessmentSessionId(100L)).thenReturn(Optional.empty());
        when(resumeEvaluationRepository.save(any(ResumeEvaluation.class))).thenAnswer(i -> {
            ResumeEvaluation e = i.getArgument(0);
            e.setId(50L);
            return e;
        });

        Map<String, Object> mockAiResult = new HashMap<>();
        mockAiResult.put("overallMatchScore", 86.5);
        mockAiResult.put("breakdown", Map.of(
                "technicalSkillScore", 90.0,
                "projectExperienceScore", 85.0,
                "internshipWorkScore", 80.0,
                "educationCertScore", 85.0,
                "practicalEvidenceScore", 90.0,
                "roleAlignmentScore", 88.0
        ));
        mockAiResult.put("evaluationBenchmark", "Standard Industry Profile for Java Developer");

        when(aiServiceClient.evaluateResume(any())).thenReturn(mockAiResult);

        SubmitResumeEvaluationRequest req = new SubmitResumeEvaluationRequest();
        req.setTargetRole("Java Developer");
        req.setCorrectedData(Map.of("technicalSkills", Map.of("languages", List.of("Java", "SQL"))));

        ResumeEvaluationResponse resp = resumeEvaluationService.evaluateAndPersist(100L, 10L, req);

        assertNotNull(resp);
        assertEquals(86.5, resp.getOverallMatchScore());
        assertEquals("COMPLETED", session.getResumeStageStatus());
        assertEquals("AVAILABLE", session.getMcqStageStatus(), "MCQ must be unlocked after successful persistence");
        assertEquals("MCQ_ASSESSMENT", session.getCurrentStage());
    }
}

