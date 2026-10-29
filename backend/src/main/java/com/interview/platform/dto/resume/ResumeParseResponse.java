package com.interview.platform.dto.resume;

import java.util.Map;

public class ResumeParseResponse {

    private String filename;
    private String fileType;
    private long fileSize;
    private Map<String, Object> extractedData;

    public ResumeParseResponse() {}

    public ResumeParseResponse(String filename, String fileType, long fileSize, Map<String, Object> extractedData) {
        this.filename = filename;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.extractedData = extractedData;
    }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    public Map<String, Object> getExtractedData() { return extractedData; }
    public void setExtractedData(Map<String, Object> extractedData) { this.extractedData = extractedData; }
}

