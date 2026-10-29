import io
import re
import logging
from typing import Dict, Any, List, Optional
import pypdf
from docx import Document

logger = logging.getLogger("ai_service.resume_parser")

# Regex patterns
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
LINKEDIN_REGEX = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+/?', re.IGNORECASE)

KNOWN_LANGUAGES = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Golang", 
    "Rust", "Ruby", "PHP", "Kotlin", "Swift", "Dart", "Scala", "R", "SQL", "HTML", "CSS"
]

KNOWN_FRAMEWORKS = [
    "React", "React.js", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Node.js", 
    "Express", "Express.js", "Spring Boot", "Spring", "Django", "FastAPI", "Flask", 
    "ASP.NET", ".NET Core", "Laravel", "Ruby on Rails", "Tailwind CSS", "Bootstrap", 
    "Redux", "Zustand", "Hibernate", "PyTorch", "TensorFlow", "Scikit-Learn", "Keras"
]

KNOWN_DATABASES = [
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "Microsoft SQL Server", 
    "Cassandra", "DynamoDB", "Snowflake", "BigQuery", "Firebase", "Neo4j", "Elasticsearch"
]

KNOWN_TOOLS = [
    "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "AWS", "Azure", "GCP", 
    "Google Cloud", "Linux", "Jenkins", "CI/CD", "Maven", "Gradle", "Postman", 
    "JIRA", "Kafka", "RabbitMQ", "GraphQL", "REST APIs", "Power BI", "Tableau"
]

KNOWN_DEGREES = [
    "B.Tech", "B.E.", "Bachelor of Technology", "Bachelor of Engineering", 
    "M.Tech", "M.E.", "Master of Technology", "Master of Engineering", 
    "B.S.", "B.Sc", "Bachelor of Science", "M.S.", "M.Sc", "Master of Science", 
    "BCA", "MCA", "Ph.D", "Diploma in Computer Science", "Associate Degree"
]

class ResumeParsingError(Exception):
    pass

class PasswordProtectedFileError(ResumeParsingError):
    pass

class EmptyOrCorruptFileError(ResumeParsingError):
    pass

class ScannedPdfError(ResumeParsingError):
    pass

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf with corruption and encryption checks."""
    if not file_bytes or len(file_bytes) < 10:
        raise EmptyOrCorruptFileError("Uploaded PDF file is empty or contains insufficient data.")

    # Magic byte check
    if not file_bytes.startswith(b'%PDF'):
        raise EmptyOrCorruptFileError("Uploaded file does not have a valid PDF header (%PDF).")

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        raise EmptyOrCorruptFileError(f"Corrupt or invalid PDF file structure: {str(e)}")

    if reader.is_encrypted:
        try:
            # Check if decrypts with empty password
            decrypted = reader.decrypt("")
            if decrypted == 0:
                raise PasswordProtectedFileError(
                    "The uploaded PDF is password-protected. Please upload an unprotected PDF file."
                )
        except Exception:
            raise PasswordProtectedFileError(
                "The uploaded PDF is password-protected. Please upload an unprotected PDF file."
            )

    text_pages = []
    try:
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            text_pages.append(page_text)
    except Exception as e:
        raise EmptyOrCorruptFileError(f"Error reading pages from PDF: {str(e)}")

    full_text = "\n".join(text_pages).strip()

    # If extracted digital text is negligible (< 30 characters), check for scanned document
    if len(full_text) < 30:
        # Attempt OCR fallback if pytesseract and Pillow are available
        ocr_text = try_ocr_extraction(file_bytes)
        if ocr_text and len(ocr_text.strip()) >= 30:
            return ocr_text.strip()
        raise ScannedPdfError(
            "The uploaded PDF is a scanned image with no extractable digital text layer. "
            "OCR text extraction was unable to process this scan. Please upload a PDF with selectable text or a DOCX document."
        )

    return full_text

def try_ocr_extraction(file_bytes: bytes) -> Optional[str]:
    """Fallback OCR on PDF if pytesseract is installed and operational."""
    try:
        import pytesseract
        from PIL import Image
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        ocr_lines = []
        for page in reader.pages:
            for image_file in page.images:
                try:
                    img = Image.open(io.BytesIO(image_file.data))
                    txt = pytesseract.image_to_string(img)
                    if txt:
                        ocr_lines.append(txt)
                except Exception:
                    continue
        if ocr_lines:
            return "\n".join(ocr_lines)
    except Exception as e:
        logger.warning(f"OCR fallback unavailable: {e}")
    return None

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX document."""
    if not file_bytes or len(file_bytes) < 10:
        raise EmptyOrCorruptFileError("Uploaded DOCX file is empty or corrupted.")

    # Magic byte check: ZIP header PK\x03\x04
    if not (file_bytes.startswith(b'PK\x03\x04') or file_bytes.startswith(b'PK\x05\x06')):
        raise EmptyOrCorruptFileError("Uploaded file does not have a valid DOCX container structure.")

    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception as e:
        # Check for password protected / encrypted zip
        err_msg = str(e).lower()
        if "encrypted" in err_msg or "password" in err_msg:
            raise PasswordProtectedFileError(
                "The uploaded DOCX document is password-protected. Please upload an unprotected file."
            )
        raise EmptyOrCorruptFileError(f"Corrupt or invalid DOCX document: {str(e)}")

    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    
    # Also extract text from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs.append(row_text)

    full_text = "\n".join(paragraphs).strip()
    if not full_text:
        raise EmptyOrCorruptFileError("The uploaded DOCX document contains no readable text.")

    return full_text

def parse_resume_bytes(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parses PDF or DOCX file bytes and extracts structured resume information."""
    lower_name = filename.lower()
    if lower_name.endswith('.pdf'):
        raw_text = extract_text_from_pdf(file_bytes)
        file_type = "PDF"
    elif lower_name.endswith('.docx') or lower_name.endswith('.doc'):
        raw_text = extract_text_from_docx(file_bytes)
        file_type = "DOCX"
    else:
        raise EmptyOrCorruptFileError("Unsupported file type. Only PDF (.pdf) and DOCX (.docx) documents are supported.")

    return parse_resume_text(raw_text, filename, file_type)

def parse_resume_text(raw_text: str, filename: str, file_type: str) -> Dict[str, Any]:
    """
    Extracts structured fields from raw resume text:
    - Name & Contact Details
    - Summary & Objective
    - Education
    - Technical Skills (Languages, Frameworks, Databases, Tools)
    - Projects
    - Internships & Experience
    - Certifications & Achievements
    - Contextual evidence mapping between skills and projects/experience
    Rule: Never invent missing information. Any missing section is explicitly 'Not found in resume'.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    # 1. Contact Details
    emails = EMAIL_REGEX.findall(raw_text)
    phones = PHONE_REGEX.findall(raw_text)
    linkedin_matches = LINKEDIN_REGEX.findall(raw_text)
    github_matches = GITHUB_REGEX.findall(raw_text)

    email = emails[0] if emails else "Not found in resume"
    phone = phones[0] if phones else "Not found in resume"
    linkedin = linkedin_matches[0] if linkedin_matches else "Not found in resume"
    github = github_matches[0] if github_matches else "Not found in resume"

    # Candidate Name Extraction (heuristic: first non-header, non-contact line)
    name = "Not found in resume"
    for line in lines[:8]:
        cleaned_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        word_count = len(cleaned_line.split())
        lower_line = line.lower()
        if (1 <= word_count <= 4 and 
            not any(hdr in lower_line for hdr in ['resume', 'curriculum', 'cv', 'email', 'phone', 'contact', 'profile', 'summary', 'education', 'skills']) and
            not EMAIL_REGEX.search(line) and
            not PHONE_REGEX.search(line)):
            name = cleaned_line.title()
            break

    # 2. Section Segmentation
    sections = segment_sections(lines)

    # 3. Summary
    summary_text = sections.get("summary", "")
    summary = summary_text.strip() if summary_text else "Not found in resume"

    # 4. Education
    education_entries = extract_education(sections.get("education", ""), raw_text)

    # 5. Technical Skills
    skills_extracted = extract_skills(raw_text, sections.get("skills", ""))

    # 6. Projects
    projects_extracted = extract_projects(sections.get("projects", ""), raw_text)

    # 7. Experience / Internships
    experience_extracted = extract_experience(sections.get("experience", ""), raw_text)

    # 8. Certifications & Achievements
    certifications_extracted = extract_certifications(sections.get("certifications", ""), raw_text)

    # 9. Contextual Evidence Mapping: Skills evidenced in Projects or Experience
    all_context_text = (sections.get("projects", "") + " " + sections.get("experience", "")).lower()
    evidenced_skills = {}
    for cat_name, skill_list in skills_extracted.items():
        if isinstance(skill_list, list):
            for skill in skill_list:
                # Check occurrences in projects/experience
                skill_lower = skill.lower()
                evidence_found = []
                for p in projects_extracted:
                    if isinstance(p, dict):
                        p_desc = (p.get("title", "") + " " + p.get("description", "") + " " + p.get("technologies", "")).lower()
                        if skill_lower in p_desc:
                            evidence_found.append(p.get("title", "Project"))
                for exp in experience_extracted:
                    if isinstance(exp, dict):
                        exp_desc = (exp.get("company", "") + " " + exp.get("role", "") + " " + exp.get("description", "")).lower()
                        if skill_lower in exp_desc:
                            evidence_found.append(exp.get("company", "Work Experience"))
                if evidence_found:
                    evidenced_skills[skill] = list(set(evidence_found))

    return {
        "filename": filename,
        "fileType": file_type,
        "rawTextLength": len(raw_text),
        "contactDetails": {
            "name": name,
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "github": github
        },
        "summary": summary,
        "education": education_entries if education_entries else "Not found in resume",
        "technicalSkills": skills_extracted,
        "projects": projects_extracted if projects_extracted else "Not found in resume",
        "experience": experience_extracted if experience_extracted else "Not found in resume",
        "certifications": certifications_extracted if certifications_extracted else "Not found in resume",
        "evidencedSkills": evidenced_skills
    }

def segment_sections(lines: List[str]) -> Dict[str, str]:
    """Segment resume lines into standardized categories using heading heuristics."""
    section_map = {}
    current_section = "header"
    buffer = []

    header_patterns = {
        "summary": re.compile(r'^(professional\s+)?(summary|profile|about\s+me|objective)', re.I),
        "education": re.compile(r'^(education|academic|qualifications|degrees)', re.I),
        "skills": re.compile(r'^(technical\s+)?(skills|competencies|technologies|proficiencies|tools)', re.I),
        "projects": re.compile(r'^(academic\s+)?(projects|key\s+projects|personal\s+projects)', re.I),
        "experience": re.compile(r'^(work\s+)?(experience|employment|internships|work\s+history)', re.I),
        "certifications": re.compile(r'^(certifications|certificates|achievements|awards|publications|licenses)', re.I)
    }

    for line in lines:
        matched_section = None
        for sec_name, pattern in header_patterns.items():
            if pattern.search(line.strip()):
                matched_section = sec_name
                break
        
        if matched_section:
            if buffer:
                section_map[current_section] = "\n".join(buffer)
                buffer = []
            current_section = matched_section
        else:
            buffer.append(line)

    if buffer:
        section_map[current_section] = "\n".join(buffer)

    return section_map

def extract_education(sec_text: str, full_text: str) -> List[Dict[str, str]]:
    """Extract education records."""
    text_to_search = sec_text if sec_text else full_text
    entries = []
    
    # Check degree matches
    found_degrees = []
    for deg in KNOWN_DEGREES:
        if re.search(r'\b' + re.escape(deg) + r'\b', text_to_search, re.IGNORECASE):
            found_degrees.append(deg)

    if not found_degrees:
        return []

    lines = [l.strip() for l in text_to_search.splitlines() if l.strip()]
    for idx, deg in enumerate(found_degrees[:3]):
        # Extract surrounding context for institution and year
        institution = "Institution name not found"
        year = "Year not specified"
        gpa = "Not specified"

        for line in lines:
            if deg.lower() in line.lower():
                # Check for year
                year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                if year_match:
                    year = year_match.group(0)
                # Check for GPA / Percentage
                gpa_match = re.search(r'(?:gpa|cgpa|percentage|score)?\s*[:\-]?\s*(\d+(?:\.\d+)?(?:\s*/\s*10|\s*/\s*4|%))', line, re.I)
                if gpa_match:
                    gpa = gpa_match.group(0)
                # Institution heuristic
                words = line.split(',')
                if len(words) > 1:
                    institution = words[0].strip()
                break

        entries.append({
            "degree": deg,
            "institution": institution,
            "year": year,
            "gpaOrScore": gpa
        })

    return entries

def extract_skills(full_text: str, skills_sec: str) -> Dict[str, List[str]]:
    """Extract and categorize technical skills."""
    text_to_scan = (skills_sec + "\n" + full_text)
    
    found_languages = []
    for lang in KNOWN_LANGUAGES:
        if re.search(r'\b' + re.escape(lang) + r'\b', text_to_scan, re.IGNORECASE):
            found_languages.append(lang)

    found_frameworks = []
    for fw in KNOWN_FRAMEWORKS:
        if re.search(r'\b' + re.escape(fw) + r'\b', text_to_scan, re.IGNORECASE):
            found_frameworks.append(fw)

    found_databases = []
    for db in KNOWN_DATABASES:
        if re.search(r'\b' + re.escape(db) + r'\b', text_to_scan, re.IGNORECASE):
            found_databases.append(db)

    found_tools = []
    for tool in KNOWN_TOOLS:
        if re.search(r'\b' + re.escape(tool) + r'\b', text_to_scan, re.IGNORECASE):
            found_tools.append(tool)

    return {
        "programmingLanguages": list(set(found_languages)),
        "frameworks": list(set(found_frameworks)),
        "databases": list(set(found_databases)),
        "toolsAndPlatforms": list(set(found_tools))
    }

def extract_projects(projects_sec: str, full_text: str) -> List[Dict[str, str]]:
    """Extract individual project items."""
    target_text = projects_sec if projects_sec else ""
    if not target_text:
        return []

    lines = [l.strip() for l in target_text.splitlines() if l.strip()]
    projects = []
    current_proj = None

    for line in lines:
        is_tech_stack_line = bool(re.search(r'^(tech\s+stack|technologies|tools|built\s+with)\s*:', line, re.I))
        is_bullet = line.startswith(('-', '•', '*', '–', '>')) or (len(line) > 2 and line[0].isdigit() and line[1] in ('.', ')'))
        
        if is_tech_stack_line and current_proj:
            current_proj["technologies"] = re.sub(r'^(tech\s+stack|technologies|tools|built\s+with)\s*:', '', line, flags=re.I).strip()
        elif not is_bullet and not is_tech_stack_line and len(line) < 80 and not line.endswith('.'):
            if current_proj and (current_proj["description"] or current_proj["technologies"]):
                projects.append(current_proj)
            current_proj = {
                "title": line,
                "technologies": "",
                "description": ""
            }
        elif current_proj:
            current_proj["description"] = (current_proj["description"] + " " + line).strip()

    if current_proj and current_proj["title"]:
        projects.append(current_proj)

    return projects[:5]

def extract_experience(exp_sec: str, full_text: str) -> List[Dict[str, str]]:
    """Extract internships or work experience."""
    target_text = exp_sec if exp_sec else ""
    if not target_text:
        return []

    lines = [l.strip() for l in target_text.splitlines() if l.strip()]
    experiences = []
    current_exp = None

    for line in lines:
        is_bullet = line.startswith(('-', '•', '*', '–', '>'))
        if not is_bullet and len(line) < 90 and not line.endswith('.'):
            if current_exp:
                experiences.append(current_exp)
            current_exp = {
                "company": line,
                "role": "Role specified in details",
                "duration": "Duration not specified",
                "description": ""
            }
            # Year / Duration heuristic
            dur_match = re.search(r'\b(20\d{2}\s*[-–to]+\s*(?:20\d{2}|present|current))\b', line, re.I)
            if dur_match:
                current_exp["duration"] = dur_match.group(0)
        elif current_exp:
            current_exp["description"] += (" " + line)

    if current_exp:
        experiences.append(current_exp)

    return experiences[:4]

def extract_certifications(cert_sec: str, full_text: str) -> List[str]:
    """Extract certificates and achievements."""
    target_text = cert_sec if cert_sec else ""
    if not target_text:
        return []

    certs = []
    for line in target_text.splitlines():
        cleaned = re.sub(r'^[-•*–>]\s*', '', line).strip()
        if cleaned and len(cleaned) > 5 and len(cleaned) < 120:
            certs.append(cleaned)

    return certs[:6]
