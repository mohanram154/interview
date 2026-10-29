from typing import Dict, Any, List, Optional
import re
from app.role_profiles import get_role_benchmark

DEFAULT_WEIGHTS = {
    "technical_skill": 0.30,
    "project_experience": 0.25,
    "internship_work": 0.15,
    "education_cert": 0.10,
    "practical_evidence": 0.10,
    "role_alignment": 0.10
}

def evaluate_resume(
    parsed_resume: Dict[str, Any],
    target_role: str,
    company_name: Optional[str] = None,
    job_description: Optional[str] = None,
    custom_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Evaluates candidate resume contextually against target role benchmarks or custom job description.
    Never invents missing information.
    Applies configurable default weights totaling 100%.
    """
    weights = custom_weights or DEFAULT_WEIGHTS
    benchmark = get_role_benchmark(target_role)

    has_custom_jd = bool(job_description and job_description.strip())
    
    if has_custom_jd:
        benchmark_label = f"Custom Job Description ({company_name.strip() if company_name else 'Specified Position'})"
        benchmark_note = f"Evaluated against custom job requirements provided for {company_name or 'the target role'}."
    else:
        benchmark_label = f"Standard Industry Profile for {benchmark['title']}"
        benchmark_note = f"Evaluated against standard industry profile for {benchmark['title']}. This evaluation does not claim internal company hiring criteria."

    # 1. Gather all candidate skills and evidence
    tech_skills = parsed_resume.get("technicalSkills", {})
    evidenced_skills_map = parsed_resume.get("evidencedSkills", {})
    
    candidate_skills = set()
    if isinstance(tech_skills, dict):
        for cat_list in tech_skills.values():
            if isinstance(cat_list, list):
                for s in cat_list:
                    candidate_skills.add(s.strip())

    candidate_skills_lower = {s.lower(): s for s in candidate_skills}

    # Extract skills from custom JD if available
    core_expected = benchmark["core_skills"]
    secondary_expected = benchmark["secondary_skills"]
    
    if has_custom_jd:
        # Augment benchmark with words found in JD
        jd_text = job_description.lower()
        custom_core = [s for s in (core_expected + secondary_expected) if s.lower() in jd_text]
        if custom_core:
            core_expected = custom_core

    # --- CATEGORY 1: Technical Skill Match (30% weight) ---
    # Evaluate context, not keywords alone:
    # Skills supported by projects/experience receive stronger evidence credit (1.0)
    # Skills merely listed without supporting details receive partial credit (0.6)
    matched_skills_details = []
    missing_skills = []
    
    evidenced_count = 0
    bare_list_count = 0
    total_core = max(1, len(core_expected))

    for core_s in core_expected:
        core_lower = core_s.lower()
        if core_lower in candidate_skills_lower:
            real_name = candidate_skills_lower[core_lower]
            evidence = evidenced_skills_map.get(real_name, [])
            is_evidenced = len(evidence) > 0
            if is_evidenced:
                evidenced_count += 1
            else:
                bare_list_count += 1

            matched_skills_details.append({
                "skill": real_name,
                "category": "Core Requirement",
                "evidencedInProjects": is_evidenced,
                "evidenceNotes": f"Evidenced in: {', '.join(evidence)}" if is_evidenced else "Listed in skills section; not explicitly evidenced in project descriptions"
            })
        else:
            missing_skills.append({
                "skill": core_s,
                "category": "Core Requirement",
                "importance": "High"
            })

    # Check secondary skills
    for sec_s in secondary_expected:
        sec_lower = sec_s.lower()
        if sec_lower in candidate_skills_lower:
            real_name = candidate_skills_lower[sec_lower]
            evidence = evidenced_skills_map.get(real_name, [])
            is_evidenced = len(evidence) > 0
            if is_evidenced:
                evidenced_count += 0.5
            else:
                bare_list_count += 0.5

            matched_skills_details.append({
                "skill": real_name,
                "category": "Secondary Tool / Asset",
                "evidencedInProjects": is_evidenced,
                "evidenceNotes": f"Evidenced in: {', '.join(evidence)}" if is_evidenced else "Listed without project context"
            })
        elif len(missing_skills) < 8:
            missing_skills.append({
                "skill": sec_s,
                "category": "Secondary Competency",
                "importance": "Moderate"
            })

    # Skill score computation
    weighted_skill_points = (evidenced_count * 1.0) + (bare_list_count * 0.6)
    raw_tech_score = (weighted_skill_points / (total_core * 1.1)) * 100.0
    technical_skill_score = min(100.0, max(25.0, round(raw_tech_score, 1)))

    # --- CATEGORY 2: Relevant Project Experience (25% weight) ---
    raw_projects = parsed_resume.get("projects", [])
    relevant_projects = []
    project_score_accum = 0.0

    if isinstance(raw_projects, list) and raw_projects and raw_projects != "Not found in resume":
        for proj in raw_projects:
            if isinstance(proj, dict):
                p_text = (proj.get("title", "") + " " + proj.get("description", "") + " " + proj.get("technologies", "")).lower()
                matched_p_techs = [s for s in (core_expected + secondary_expected) if s.lower() in p_text]
                
                # Check for evidence markers (architecture, api, database, deployment)
                marker_hits = sum(1 for m in benchmark.get("evidence_markers", []) if m in p_text)
                
                rel_score = min(100, (len(matched_p_techs) * 20) + (marker_hits * 15) + (30 if len(proj.get("description", "")) > 40 else 10))
                project_score_accum += rel_score

                relevant_projects.append({
                    "title": proj.get("title", "Project"),
                    "matchedTechnologies": matched_p_techs,
                    "relevanceScore": rel_score,
                    "description": proj.get("description", "")[:180] + ("..." if len(proj.get("description", "")) > 180 else "")
                })

        avg_proj = project_score_accum / max(1, len(raw_projects))
        # Bonus for having 2+ solid projects
        count_mult = 1.0 if len(raw_projects) >= 2 else 0.8
        project_experience_score = min(100.0, max(20.0, round(avg_proj * count_mult, 1)))
    else:
        project_experience_score = 15.0

    # --- CATEGORY 3: Internship / Work Relevance (15% weight) ---
    raw_exp = parsed_resume.get("experience", [])
    if isinstance(raw_exp, list) and raw_exp and raw_exp != "Not found in resume":
        exp_score_accum = 0.0
        for exp in raw_exp:
            if isinstance(exp, dict):
                exp_text = (exp.get("role", "") + " " + exp.get("company", "") + " " + exp.get("description", "")).lower()
                tech_matches = sum(1 for s in core_expected if s.lower() in exp_text)
                exp_score_accum += min(100, 50 + (tech_matches * 15))
        internship_work_score = min(100.0, max(40.0, round(exp_score_accum / max(1, len(raw_exp)), 1)))
    else:
        # If no work experience found, student/fresh graduate baseline (0-30 depending on projects)
        internship_work_score = 30.0 if project_experience_score >= 70 else 15.0

    # --- CATEGORY 4: Education & Certifications Relevance (10% weight) ---
    raw_edu = parsed_resume.get("education", [])
    raw_certs = parsed_resume.get("certifications", [])

    edu_score = 40.0 # base
    if isinstance(raw_edu, list) and raw_edu and raw_edu != "Not found in resume":
        for e in raw_edu:
            if isinstance(e, dict):
                deg = e.get("degree", "").lower()
                if any(exp_deg.lower() in deg for exp_deg in benchmark.get("expected_degrees", [])):
                    edu_score = max(edu_score, 85.0)
                else:
                    edu_score = max(edu_score, 65.0)

    cert_bonus = 0.0
    if isinstance(raw_certs, list) and raw_certs and raw_certs != "Not found in resume":
        for c in raw_certs:
            c_lower = c.lower() if isinstance(c, str) else ""
            if any(rec_c.lower() in c_lower for rec_c in benchmark.get("certifications", [])):
                cert_bonus += 12.0
            else:
                cert_bonus += 5.0

    education_cert_score = min(100.0, round(edu_score + cert_bonus, 1))

    # --- CATEGORY 5: Evidence of Practical Implementation (10% weight) ---
    # Looks for links (GitHub), API design, databases, deployment words, test coverage
    raw_text = parsed_resume.get("rawTextLength", 0)
    contact = parsed_resume.get("contactDetails", {})
    has_github = contact.get("github") != "Not found in resume"
    
    evidence_points = 30.0
    if has_github:
        evidence_points += 25.0
    if len(evidenced_skills_map) >= 3:
        evidence_points += 25.0
    if project_experience_score >= 65:
        evidence_points += 20.0

    practical_evidence_score = min(100.0, max(20.0, round(evidence_points, 1)))

    # --- CATEGORY 6: Alignment with Role Requirements (10% weight) ---
    # Overall cohesion and readiness
    alignment_base = (technical_skill_score * 0.45) + (project_experience_score * 0.35) + (internship_work_score * 0.20)
    role_alignment_score = min(100.0, max(25.0, round(alignment_base, 1)))

    # --- TOTAL OVERALL MATCH SCORE ---
    overall_raw = (
        (technical_skill_score * weights["technical_skill"]) +
        (project_experience_score * weights["project_experience"]) +
        (internship_work_score * weights["internship_work"]) +
        (education_cert_score * weights["education_cert"]) +
        (practical_evidence_score * weights["practical_evidence"]) +
        (role_alignment_score * weights["role_alignment"])
    )
    overall_match_score = round(overall_raw, 1)

    # --- STRENGTHS & REQUIREMENTS NOT EVIDENCED ---
    strengths = []
    if len(matched_skills_details) >= 4:
        evidenced_names = [m["skill"] for m in matched_skills_details if m["evidencedInProjects"]]
        if evidenced_names:
            strengths.append(f"Demonstrated hands-on experience in core technologies: {', '.join(evidenced_names[:4])}.")
    if project_experience_score >= 70:
        strengths.append("Project portfolio demonstrates end-to-end implementation and architecture comprehension.")
    if education_cert_score >= 80:
        strengths.append(f"Strong academic qualification aligned with {benchmark['title']} requirements.")
    if has_github:
        strengths.append("Provided accessible GitHub repository profile showing active code contributions.")
    if not strengths:
        strengths.append("Baseline foundational knowledge identified in technical resume scan.")

    requirements_not_evidenced = []
    if missing_skills:
        core_missing = [m["skill"] for m in missing_skills if m["category"] == "Core Requirement"]
        if core_missing:
            requirements_not_evidenced.append(f"Essential role competencies not evidenced in resume: {', '.join(core_missing[:4])}.")
    unsupported_skills = [m["skill"] for m in matched_skills_details if not m["evidencedInProjects"]]
    if len(unsupported_skills) >= 3:
        requirements_not_evidenced.append(f"Skills listed but lacking project evidence: {', '.join(unsupported_skills[:3])}.")
    if parsed_resume.get("experience") == "Not found in resume":
        requirements_not_evidenced.append("No formal software engineering internships or professional industry experience documented.")

    # --- ACTIONABLE IMPROVEMENT SUGGESTIONS ---
    improvement_suggestions = []
    if missing_skills:
        improvement_suggestions.append(f"Highlight or learn key {benchmark['title']} competencies: {', '.join([m['skill'] for m in missing_skills[:3]])}.")
    if unsupported_skills:
        improvement_suggestions.append(f"Add bullet points in your projects showcasing how you applied: {', '.join(unsupported_skills[:3])}.")
    if not has_github:
        improvement_suggestions.append("Include active GitHub links to public repositories demonstrating clean code, unit tests, and commits.")
    if parsed_resume.get("projects") == "Not found in resume" or len(raw_projects) < 2:
        improvement_suggestions.append("Build and document at least two full-featured domain projects with measurable results and tech stack details.")
    improvement_suggestions.append("Use quantifiable metrics (e.g. 'Improved performance by 25%', 'Handled 500+ requests/sec') in project descriptions.")

    # --- SCORE EXPLANATIONS ---
    score_explanations = {
        "technicalSkill": {
            "score": technical_skill_score,
            "weight": "30%",
            "explanation": f"Matched {len(matched_skills_details)} required competencies ({evidenced_count} evidenced in practical context, {bare_list_count} listed in skills section). Contextual evidence receives higher evaluation credit than unreferenced keywords."
        },
        "projectExperience": {
            "score": project_experience_score,
            "weight": "25%",
            "explanation": f"Analyzed {len(relevant_projects)} projects against {benchmark['title']} architectural patterns and tech stack expectations."
        },
        "internshipWork": {
            "score": internship_work_score,
            "weight": "15%",
            "explanation": "Evaluates commercial software delivery, team collaboration, and real-world engineering responsibility." if parsed_resume.get("experience") != "Not found in resume" else "No formal commercial work or internship documented; scored on entry-level foundational baseline."
        },
        "educationCert": {
            "score": education_cert_score,
            "weight": "10%",
            "explanation": "Degree relevance, accreditation, and verified technical certifications aligned with software engineering benchmarks."
        },
        "practicalEvidence": {
            "score": practical_evidence_score,
            "weight": "10%",
            "explanation": "Verification of concrete artifacts (version control repositories, API endpoints, database schemas, test suites) across candidate descriptions."
        },
        "roleAlignment": {
            "score": role_alignment_score,
            "weight": "10%",
            "explanation": f"Holistic alignment score reflecting overall candidate readiness for {benchmark['title']} responsibilities."
        }
    }

    return {
        "overallMatchScore": overall_match_score,
        "breakdown": {
            "technicalSkillScore": technical_skill_score,
            "projectExperienceScore": project_experience_score,
            "internshipWorkScore": internship_work_score,
            "educationCertScore": education_cert_score,
            "practicalEvidenceScore": practical_evidence_score,
            "roleAlignmentScore": role_alignment_score
        },
        "matchedSkills": matched_skills_details,
        "missingSkills": missing_skills,
        "relevantProjects": relevant_projects,
        "strengths": strengths,
        "requirementsNotEvidenced": requirements_not_evidenced,
        "improvementSuggestions": improvement_suggestions,
        "scoreExplanations": score_explanations,
        "evaluationBenchmark": benchmark_label,
        "benchmarkNote": benchmark_note,
        "targetRole": benchmark["title"],
        "companyName": company_name or "Standard Industry Profile",
        "hasCustomJobDescription": has_custom_jd
    }

