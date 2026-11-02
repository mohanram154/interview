package com.interview.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_interview_questions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assessment_session_id", "sequence_number"})
})
public class VideoInterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_session_id", nullable = false)
    private AssessmentSession assessmentSession;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "tailored_source", length = 100)
    private String tailoredSource;

    @Column(name = "recording_file_path", length = 255)
    private String recordingFilePath;

    @Column(name = "recording_file_size")
    private Long recordingFileSize;

    @Column(name = "recording_duration_seconds")
    private Integer recordingDurationSeconds;

    @Column(name = "recording_mime_type", length = 100)
    private String recordingMimeType;

    // Transcription & Word Timestamps
    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "transcription_status", length = 50)
    private String transcriptionStatus;

    @Column(name = "transcription_provider", length = 50)
    private String transcriptionProvider;

    @Column(name = "transcription_notes", columnDefinition = "TEXT")
    private String transcriptionNotes;

    @Column(name = "word_timestamps", columnDefinition = "LONGTEXT")
    private String wordTimestamps;

    // Fluency & Hesitation
    @Column(name = "filler_words_count")
    private Integer fillerWordsCount;

    @Column(name = "filler_word_rate")
    private Double fillerWordRate;

    @Column(name = "pause_count")
    private Integer pauseCount;

    @Column(name = "avg_pause_duration")
    private Double avgPauseDuration;

    @Column(name = "longest_pause_duration")
    private Double longestPauseDuration;

    @Column(name = "repeated_words_count")
    private Integer repeatedWordsCount;

    @Column(name = "fluency_score")
    private Double fluencyScore;

    @Column(name = "fluency_notes", columnDefinition = "TEXT")
    private String fluencyNotes;

    @Column(name = "speech_clarity_level", length = 50)
    private String speechClarityLevel;

    // Prosody & Tone
    @Column(name = "prosody_status", length = 50)
    private String prosodyStatus;

    @Column(name = "pitch_variation")
    private Double pitchVariation;

    @Column(name = "vocal_energy_variation")
    private Double vocalEnergyVariation;

    @Column(name = "speech_rhythm_score")
    private Double speechRhythmScore;

    @Column(name = "prosody_notes", columnDefinition = "TEXT")
    private String prosodyNotes;

    // Speech Rate & Sentiment
    @Column(name = "speaking_wpm")
    private Double speakingWpm;

    @Column(name = "total_wpm")
    private Double totalWpm;

    @Column(name = "sentiment_label", length = 50)
    private String sentimentLabel;

    @Column(name = "sentiment_reliability", length = 50)
    private String sentimentReliability;

    @Column(name = "vocal_intensity", length = 50)
    private String vocalIntensity;

    // Role-Specific Technical Competency
    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "relevance_score")
    private Double relevanceScore;

    @Column(name = "completeness_score")
    private Double completenessScore;

    @Column(name = "concept_usage_score")
    private Double conceptUsageScore;

    @Column(name = "matched_key_points", columnDefinition = "LONGTEXT")
    private String matchedKeyPoints;

    @Column(name = "missing_key_points", columnDefinition = "LONGTEXT")
    private String missingKeyPoints;

    @Column(name = "evaluator_model", length = 100)
    private String evaluatorModel;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "improvement_suggestions", columnDefinition = "TEXT")
    private String improvementSuggestions;

    // Contradiction-Weighted Confidence Calibration
    @Column(name = "linguistic_confidence_score")
    private Double linguisticConfidenceScore;

    @Column(name = "confidence_calibration_label", length = 50)
    private String confidenceCalibrationLabel;

    @Column(name = "confidence_delta")
    private Double confidenceDelta;

    @Column(name = "confidence_calibration_explanation", columnDefinition = "TEXT")
    private String confidenceCalibrationExplanation;

    // Composite Question Score
    @Column(name = "question_score")
    private Double questionScore;

    @Column(nullable = false, length = 50)
    private String status = "PENDING";

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "recording_deleted_at")
    private LocalDateTime recordingDeletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public VideoInterviewQuestion() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AssessmentSession getAssessmentSession() {
        return assessmentSession;
    }

    public void setAssessmentSession(AssessmentSession assessmentSession) {
        this.assessmentSession = assessmentSession;
    }

    public int getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(int sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTailoredSource() {
        return tailoredSource;
    }

    public void setTailoredSource(String tailoredSource) {
        this.tailoredSource = tailoredSource;
    }

    public String getRecordingFilePath() {
        return recordingFilePath;
    }

    public void setRecordingFilePath(String recordingFilePath) {
        this.recordingFilePath = recordingFilePath;
    }

    public Long getRecordingFileSize() {
        return recordingFileSize;
    }

    public void setRecordingFileSize(Long recordingFileSize) {
        this.recordingFileSize = recordingFileSize;
    }

    public Integer getRecordingDurationSeconds() {
        return recordingDurationSeconds;
    }

    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) {
        this.recordingDurationSeconds = recordingDurationSeconds;
    }

    public String getRecordingMimeType() {
        return recordingMimeType;
    }

    public void setRecordingMimeType(String recordingMimeType) {
        this.recordingMimeType = recordingMimeType;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getTranscriptionStatus() {
        return transcriptionStatus;
    }

    public void setTranscriptionStatus(String transcriptionStatus) {
        this.transcriptionStatus = transcriptionStatus;
    }

    public String getTranscriptionProvider() {
        return transcriptionProvider;
    }

    public void setTranscriptionProvider(String transcriptionProvider) {
        this.transcriptionProvider = transcriptionProvider;
    }

    public String getTranscriptionNotes() {
        return transcriptionNotes;
    }

    public void setTranscriptionNotes(String transcriptionNotes) {
        this.transcriptionNotes = transcriptionNotes;
    }

    public String getWordTimestamps() {
        return wordTimestamps;
    }

    public void setWordTimestamps(String wordTimestamps) {
        this.wordTimestamps = wordTimestamps;
    }

    public Integer getFillerWordsCount() {
        return fillerWordsCount;
    }

    public void setFillerWordsCount(Integer fillerWordsCount) {
        this.fillerWordsCount = fillerWordsCount;
    }

    public Double getFillerWordRate() {
        return fillerWordRate;
    }

    public void setFillerWordRate(Double fillerWordRate) {
        this.fillerWordRate = fillerWordRate;
    }

    public Integer getPauseCount() {
        return pauseCount;
    }

    public void setPauseCount(Integer pauseCount) {
        this.pauseCount = pauseCount;
    }

    public Double getAvgPauseDuration() {
        return avgPauseDuration;
    }

    public void setAvgPauseDuration(Double avgPauseDuration) {
        this.avgPauseDuration = avgPauseDuration;
    }

    public Double getLongestPauseDuration() {
        return longestPauseDuration;
    }

    public void setLongestPauseDuration(Double longestPauseDuration) {
        this.longestPauseDuration = longestPauseDuration;
    }

    public Integer getRepeatedWordsCount() {
        return repeatedWordsCount;
    }

    public void setRepeatedWordsCount(Integer repeatedWordsCount) {
        this.repeatedWordsCount = repeatedWordsCount;
    }

    public Double getFluencyScore() {
        return fluencyScore;
    }

    public void setFluencyScore(Double fluencyScore) {
        this.fluencyScore = fluencyScore;
    }

    public String getFluencyNotes() {
        return fluencyNotes;
    }

    public void setFluencyNotes(String fluencyNotes) {
        this.fluencyNotes = fluencyNotes;
    }

    public String getSpeechClarityLevel() {
        return speechClarityLevel;
    }

    public void setSpeechClarityLevel(String speechClarityLevel) {
        this.speechClarityLevel = speechClarityLevel;
    }

    public String getProsodyStatus() {
        return prosodyStatus;
    }

    public void setProsodyStatus(String prosodyStatus) {
        this.prosodyStatus = prosodyStatus;
    }

    public Double getPitchVariation() {
        return pitchVariation;
    }

    public void setPitchVariation(Double pitchVariation) {
        this.pitchVariation = pitchVariation;
    }

    public Double getVocalEnergyVariation() {
        return vocalEnergyVariation;
    }

    public void setVocalEnergyVariation(Double vocalEnergyVariation) {
        this.vocalEnergyVariation = vocalEnergyVariation;
    }

    public Double getSpeechRhythmScore() {
        return speechRhythmScore;
    }

    public void setSpeechRhythmScore(Double speechRhythmScore) {
        this.speechRhythmScore = speechRhythmScore;
    }

    public String getProsodyNotes() {
        return prosodyNotes;
    }

    public void setProsodyNotes(String prosodyNotes) {
        this.prosodyNotes = prosodyNotes;
    }

    public Double getSpeakingWpm() {
        return speakingWpm;
    }

    public void setSpeakingWpm(Double speakingWpm) {
        this.speakingWpm = speakingWpm;
    }

    public Double getTotalWpm() {
        return totalWpm;
    }

    public void setTotalWpm(Double totalWpm) {
        this.totalWpm = totalWpm;
    }

    public String getSentimentLabel() {
        return sentimentLabel;
    }

    public void setSentimentLabel(String sentimentLabel) {
        this.sentimentLabel = sentimentLabel;
    }

    public String getSentimentReliability() {
        return sentimentReliability;
    }

    public void setSentimentReliability(String sentimentReliability) {
        this.sentimentReliability = sentimentReliability;
    }

    public String getVocalIntensity() {
        return vocalIntensity;
    }

    public void setVocalIntensity(String vocalIntensity) {
        this.vocalIntensity = vocalIntensity;
    }

    public Double getTechnicalScore() {
        return technicalScore;
    }

    public void setTechnicalScore(Double technicalScore) {
        this.technicalScore = technicalScore;
    }

    public Double getRelevanceScore() {
        return relevanceScore;
    }

    public void setRelevanceScore(Double relevanceScore) {
        this.relevanceScore = relevanceScore;
    }

    public Double getCompletenessScore() {
        return completenessScore;
    }

    public void setCompletenessScore(Double completenessScore) {
        this.completenessScore = completenessScore;
    }

    public Double getConceptUsageScore() {
        return conceptUsageScore;
    }

    public void setConceptUsageScore(Double conceptUsageScore) {
        this.conceptUsageScore = conceptUsageScore;
    }

    public String getMatchedKeyPoints() {
        return matchedKeyPoints;
    }

    public void setMatchedKeyPoints(String matchedKeyPoints) {
        this.matchedKeyPoints = matchedKeyPoints;
    }

    public String getMissingKeyPoints() {
        return missingKeyPoints;
    }

    public void setMissingKeyPoints(String missingKeyPoints) {
        this.missingKeyPoints = missingKeyPoints;
    }

    public String getEvaluatorModel() {
        return evaluatorModel;
    }

    public void setEvaluatorModel(String evaluatorModel) {
        this.evaluatorModel = evaluatorModel;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getImprovementSuggestions() {
        return improvementSuggestions;
    }

    public void setImprovementSuggestions(String improvementSuggestions) {
        this.improvementSuggestions = improvementSuggestions;
    }

    public Double getLinguisticConfidenceScore() {
        return linguisticConfidenceScore;
    }

    public void setLinguisticConfidenceScore(Double linguisticConfidenceScore) {
        this.linguisticConfidenceScore = linguisticConfidenceScore;
    }

    public String getConfidenceCalibrationLabel() {
        return confidenceCalibrationLabel;
    }

    public void setConfidenceCalibrationLabel(String confidenceCalibrationLabel) {
        this.confidenceCalibrationLabel = confidenceCalibrationLabel;
    }

    public Double getConfidenceDelta() {
        return confidenceDelta;
    }

    public void setConfidenceDelta(Double confidenceDelta) {
        this.confidenceDelta = confidenceDelta;
    }

    public String getConfidenceCalibrationExplanation() {
        return confidenceCalibrationExplanation;
    }

    public void setConfidenceCalibrationExplanation(String confidenceCalibrationExplanation) {
        this.confidenceCalibrationExplanation = confidenceCalibrationExplanation;
    }

    public Double getQuestionScore() {
        return questionScore;
    }

    public void setQuestionScore(Double questionScore) {
        this.questionScore = questionScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public LocalDateTime getRecordingDeletedAt() {
        return recordingDeletedAt;
    }

    public void setRecordingDeletedAt(LocalDateTime recordingDeletedAt) {
        this.recordingDeletedAt = recordingDeletedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
