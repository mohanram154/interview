import pytest
from app.resume_parser import (
    parse_resume_text,
    extract_text_from_pdf,
    EmptyOrCorruptFileError,
    PasswordProtectedFileError
)
from app.resume_evaluator import evaluate_resume
from app.role_profiles import get_role_benchmark, ROLE_BENCHMARKS

SAMPLE_RESUME_TEXT = """
Jane Doe
jane.doe@example.com | (555) 123-4567 | linkedin.com/in/janedoe | github.com/janedoe

Professional Summary
Passionate Java and Spring Boot engineer with 2 years of experience developing RESTful microservices.

Education
B.Tech in Computer Science and Engineering
Indian Institute of Technology, 2024, CGPA: 8.8/10

Technical Skills
Programming Languages: Java, Python, SQL, JavaScript
Frameworks & Libraries: Spring Boot, Hibernate, Spring Data JPA, React
Databases: MySQL, PostgreSQL, Redis
Developer Tools: Git, Docker, Maven, Postman

Key Projects
E-Commerce Microservices Backend
Tech Stack: Java, Spring Boot, MySQL, Docker, Redis
Designed and implemented an asynchronous microservices platform using Spring Boot and Docker. Integrated MySQL database with JPA and Redis caching layer to handle 1000+ RPS.

Task Management Dashboard
Tech Stack: React, JavaScript, REST APIs
Developed an interactive responsive dashboard in React to manage daily sprint tasks.

Work Experience
Backend Engineering Intern | TechCorp Inc. (2023 - 2024)
- Developed and maintained RESTful APIs in Spring Boot and Java.
- Optimized MySQL database queries and implemented database indexing.

Certifications
- Oracle Certified Associate, Java SE 8 Programmer
- AWS Certified Cloud Practitioner
"""

def test_all_eight_mandatory_roles_exist():
    expected_roles = [
        "Full Stack Developer",
        "Software Developer",
        "Java Developer",
        "Frontend Developer",
        "Backend Developer",
        "Python Developer",
        "Data Analyst",
        "AI/ML Engineer"
    ]
    for role in expected_roles:
        benchmark = get_role_benchmark(role)
        assert benchmark is not None
        assert benchmark["title"] == role
        assert len(benchmark["core_skills"]) >= 5

def test_resume_parser_extracts_all_sections():
    parsed = parse_resume_text(SAMPLE_RESUME_TEXT, "jane_resume.pdf", "PDF")
    
    # Contact
    assert parsed["contactDetails"]["name"] == "Jane Doe"
    assert parsed["contactDetails"]["email"] == "jane.doe@example.com"
    assert "github.com/janedoe" in parsed["contactDetails"]["github"]

    # Education
    assert parsed["education"] != "Not found in resume"
    assert isinstance(parsed["education"], list)
    assert any("B.Tech" in e["degree"] for e in parsed["education"])

    # Skills
    skills = parsed["technicalSkills"]
    assert "Java" in skills["programmingLanguages"]
    assert "Spring Boot" in skills["frameworks"]
    assert "MySQL" in skills["databases"]

    # Projects
    projects = parsed["projects"]
    assert len(projects) >= 1
    assert any("E-Commerce" in p["title"] for p in projects)

    # Contextual Evidence Mapping
    evidenced = parsed["evidencedSkills"]
    assert "Java" in evidenced
    assert "Spring Boot" in evidenced
    assert "MySQL" in evidenced

def test_resume_parser_never_invents_missing_sections():
    minimal_text = "John Smith\njohn@example.com\nSkills: Java, SQL"
    parsed = parse_resume_text(minimal_text, "minimal.txt", "PDF")
    
    assert parsed["summary"] == "Not found in resume"
    assert parsed["education"] == "Not found in resume"
    assert parsed["projects"] == "Not found in resume"
    assert parsed["experience"] == "Not found in resume"
    assert parsed["certifications"] == "Not found in resume"

def test_evaluate_resume_standard_profile_weights():
    parsed = parse_resume_text(SAMPLE_RESUME_TEXT, "jane_resume.pdf", "PDF")
    evaluation = evaluate_resume(parsed, target_role="Java Developer")

    assert "overallMatchScore" in evaluation
    assert 0 <= evaluation["overallMatchScore"] <= 100
    
    breakdown = evaluation["breakdown"]
    assert breakdown["technicalSkillScore"] > 60
    assert breakdown["projectExperienceScore"] > 60
    assert breakdown["internshipWorkScore"] > 60
    
    # Check standard industry label and disclaimer
    assert "Standard Industry Profile for Java Developer" in evaluation["evaluationBenchmark"]
    assert "does not claim internal company hiring criteria" in evaluation["benchmarkNote"]

    # Check that matched skills include evidence indicators
    assert len(evaluation["matchedSkills"]) > 0
    java_match = next((m for m in evaluation["matchedSkills"] if m["skill"] == "Java"), None)
    assert java_match is not None
    assert java_match["evidencedInProjects"] is True

def test_evaluate_resume_custom_job_description():
    parsed = parse_resume_text(SAMPLE_RESUME_TEXT, "jane_resume.pdf", "PDF")
    evaluation = evaluate_resume(
        parsed,
        target_role="Java Developer",
        company_name="Acme Corp",
        job_description="We need a Java engineer with Spring Boot, Docker, and MySQL experience."
    )
    assert evaluation["hasCustomJobDescription"] is True
    assert "Acme Corp" in evaluation["evaluationBenchmark"]
    assert evaluation["companyName"] == "Acme Corp"

def test_empty_or_corrupt_file_handling():
    with pytest.raises(EmptyOrCorruptFileError):
        extract_text_from_pdf(b"")

    with pytest.raises(EmptyOrCorruptFileError):
        extract_text_from_pdf(b"not a valid pdf header")

