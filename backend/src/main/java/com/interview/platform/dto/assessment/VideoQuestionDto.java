package com.interview.platform.dto.assessment;

import java.time.LocalDateTime;

public class VideoQuestionDto {

    private Long id;
    private Long assessmentSessionId;
    private int sequenceNumber;
    private String questionText;
    private String category;
    private String tailoredSource;
    private String status;
    private boolean hasRecording;
    private Integer recordingDurationSeconds;
    private Long recordingFileSize;
    private String recordingMimeType;

    // Transcription & Word Timestamps
    private String transcript;
    private String transcriptionStatus;
    private String transcriptionProvider;
    private String transcriptionNotes;
    private String wordTimestamps;

    // Fluency & Hesitation
    private Integer fillerWordsCount;
    private Double fillerWordRate;
    private Integer pauseCount;
    private Double avgPauseDuration;
    private Double longestPauseDuration;
    private Integer repeatedWordsCount;
    private Double fluencyScore;
    private String fluencyNotes;
    private String speechClarityLevel;

    // Prosody & Tone
    private String prosodyStatus;
    private Double pitchVariation;
    private Double vocalEnergyVariation;
    private Double speechRhythmScore;
    private String prosodyNotes;

    // Speech Rate & Sentiment
    private Double speakingWpm;
    private Double totalWpm;
    private String sentimentLabel;
    private String sentimentReliability;
    private String vocalIntensity;

    // Role-Specific Technical Competency
    private Double technicalScore;
    private Double relevanceScore;
    private Double completenessScore;
    private Double conceptUsageScore;
    private String matchedKeyPoints;
    private String missingKeyPoints;
    private String evaluatorModel;
    private String feedback;
    private String improvementSuggestions;

    // Contradiction-Weighted Confidence Calibration
    private Double linguisticConfidenceScore;
    private String confidenceCalibrationLabel;
    private Double confidenceDelta;
    private String confidenceCalibrationExplanation;

    // Composite Question Score
    private Double questionScore;

    private LocalDateTime uploadedAt;

    public VideoQuestionDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssessmentSessionId() {
        return assessmentSessionId;
    }

    public void setAssessmentSessionId(Long assessmentSessionId) {
        this.assessmentSessionId = assessmentSessionId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isHasRecording() {
        return hasRecording;
    }

    public void setHasRecording(boolean hasRecording) {
        this.hasRecording = hasRecording;
    }

    public Integer getRecordingDurationSeconds() {
        return recordingDurationSeconds;
    }

    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) {
        this.recordingDurationSeconds = recordingDurationSeconds;
    }

    public Long getRecordingFileSize() {
        return recordingFileSize;
    }

    public void setRecordingFileSize(Long recordingFileSize) {
        this.recordingFileSize = recordingFileSize;
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

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
