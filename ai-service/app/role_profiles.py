"""
Standard Industry Role Benchmark Profiles for 8 core developer roles:
- Full Stack Developer
- Software Developer
- Java Developer
- Frontend Developer
- Backend Developer
- Python Developer
- Data Analyst
- AI/ML Engineer
"""

ROLE_BENCHMARKS = {
    "Full Stack Developer": {
        "title": "Full Stack Developer",
        "description": "End-to-end web engineering covering responsive frontend UI, server-side REST/GraphQL APIs, database integration, and deployment.",
        "core_skills": [
            "JavaScript", "TypeScript", "React", "Node.js", "HTML", "CSS", 
            "REST APIs", "SQL", "Git", "State Management"
        ],
        "secondary_skills": [
            "Next.js", "Vue", "Express", "Spring Boot", "PostgreSQL", "MongoDB", 
            "Docker", "Tailwind CSS", "Redis", "JWT", "AWS"
        ],
        "frameworks": ["React", "Node.js", "Express", "Spring Boot", "Next.js"],
        "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
        "expected_degrees": ["Computer Science", "Information Technology", "Computer Engineering", "B.Tech", "B.E.", "BCA", "MCA"],
        "evidence_markers": ["full stack", "frontend and backend", "api integration", "database design", "state management", "crud", "jwt", "deployed", "responsive"],
        "certifications": ["AWS Certified Developer", "Meta Frontend Developer", "Meta Backend Developer", "Full Stack Web Development"]
    },
    "Software Developer": {
        "title": "Software Developer",
        "description": "Generalist software engineering emphasizing algorithms, data structures, object-oriented design, clean code, and unit testing.",
        "core_skills": [
            "Data Structures", "Algorithms", "Object-Oriented Programming", 
            "Git", "Debugging", "Testing", "Problem Solving", "System Design"
        ],
        "secondary_skills": [
            "Java", "Python", "C++", "C#", "SQL", "Linux", "REST APIs", "CI/CD", "Design Patterns"
        ],
        "frameworks": ["Spring Boot", "Django", "FastAPI", ".NET Core"],
        "databases": ["MySQL", "PostgreSQL", "SQLite"],
        "expected_degrees": ["Computer Science", "Software Engineering", "B.Tech", "B.E.", "Information Technology"],
        "evidence_markers": ["unit test", "refactoring", "oop", "design pattern", "complexity", "multithreading", "modular", "clean code"],
        "certifications": ["Oracle Certified Professional", "AWS Certified Developer", "Google Cloud Associate Engineer"]
    },
    "Java Developer": {
        "title": "Java Developer",
        "description": "Enterprise server-side backend development utilizing Modern Java, Spring Boot, Hibernate, microservices architecture, and SQL.",
        "core_skills": [
            "Java", "Spring Boot", "Spring Data JPA", "Hibernate", "REST APIs", 
            "SQL", "Maven", "Git", "Object-Oriented Programming"
        ],
        "secondary_skills": [
            "Microservices", "Docker", "PostgreSQL", "MySQL", "Redis", "JUnit", 
            "Mockito", "Kafka", "Spring Security", "Liquibase", "Flyway", "JVM Internals"
        ],
        "frameworks": ["Spring Boot", "Spring Framework", "Hibernate", "JUnit"],
        "databases": ["MySQL", "PostgreSQL", "Oracle", "Redis"],
        "expected_degrees": ["Computer Science", "Information Technology", "Computer Engineering", "B.Tech", "MCA"],
        "evidence_markers": ["spring boot", "jpa", "hibernate", "microservice", "multithreading", "stream api", "dependency injection", "transactional"],
        "certifications": ["Oracle Certified Java Developer", "Spring Certified Professional", "AWS Certified Developer"]
    },
    "Frontend Developer": {
        "title": "Frontend Developer",
        "description": "Client-side web application engineering focusing on interactive UI, responsive layouts, web performance, and modern JavaScript frameworks.",
        "core_skills": [
            "JavaScript", "TypeScript", "React", "HTML5", "CSS3", 
            "Responsive Design", "Git", "State Management"
        ],
        "secondary_skills": [
            "Next.js", "Redux", "Zustand", "Tailwind CSS", "Webpack", "Vite", 
            "Web Vitals", "Accessibility", "Jest", "REST API Consumption"
        ],
        "frameworks": ["React", "Vue", "Angular", "Next.js"],
        "databases": ["IndexedDB", "LocalStorage"],
        "expected_degrees": ["Computer Science", "Information Technology", "Web Development", "B.Tech", "BCA"],
        "evidence_markers": ["responsive", "component lifecycle", "hooks", "custom hook", "tailwind", "ui ux", "css grid", "accessibility", "lighthouse"],
        "certifications": ["Meta Frontend Developer", "JavaScript Algorithms and Data Structures", "React Certification"]
    },
    "Backend Developer": {
        "title": "Backend Developer",
        "description": "Server-side architecture, scalable RESTful APIs, distributed microservices, database modeling, authentication, and caching.",
        "core_skills": [
            "REST APIs", "SQL", "Database Design", "Authentication", "Git", 
            "Data Modeling", "API Security", "Server Architecture"
        ],
        "secondary_skills": [
            "Java", "Python", "Go", "Node.js", "Spring Boot", "FastAPI", 
            "PostgreSQL", "Redis", "Docker", "Microservices", "Kafka", "RabbitMQ"
        ],
        "frameworks": ["Spring Boot", "FastAPI", "Express", "Django REST Framework"],
        "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
        "expected_degrees": ["Computer Science", "Information Technology", "Software Engineering", "B.Tech", "MCA"],
        "evidence_markers": ["api design", "database indexing", "caching", "jwt", "microservices", "concurrency", "docker", "scalability"],
        "certifications": ["AWS Certified Solutions Architect", "Meta Backend Developer", "Oracle Certified Associate"]
    },
    "Python Developer": {
        "title": "Python Developer",
        "description": "Python application development, asynchronous programming, web APIs (FastAPI/Django), automation, and database interaction.",
        "core_skills": [
            "Python", "FastAPI", "Django", "REST APIs", "SQL", 
            "Git", "Object-Oriented Programming", "Asyncio"
        ],
        "secondary_skills": [
            "PostgreSQL", "Docker", "Redis", "Celery", "Pandas", 
            "Pytest", "Pydantic", "SQLAlchemy", "Linux", "Web Scraping"
        ],
        "frameworks": ["FastAPI", "Django", "Flask", "Pytest"],
        "databases": ["PostgreSQL", "MySQL", "SQLite", "Redis"],
        "expected_degrees": ["Computer Science", "Information Technology", "Data Science", "B.Tech", "BCA"],
        "evidence_markers": ["fastapi", "django", "asyncio", "pydantic", "sqlalchemy", "orm", "virtualenv", "pip", "generator"],
        "certifications": ["Python Institute Certified Associate (PCAP)", "Python Institute Certified Professional (PCPP)"]
    },
    "Data Analyst": {
        "title": "Data Analyst",
        "description": "Data wrangling, exploratory data analysis, SQL querying, reporting dashboards, and actionable business intelligence.",
        "core_skills": [
            "SQL", "Python", "Data Visualization", "Excel", 
            "Data Cleaning", "Exploratory Data Analysis", "Statistics"
        ],
        "secondary_skills": [
            "Pandas", "NumPy", "Power BI", "Tableau", "Matplotlib", 
            "Seaborn", "PostgreSQL", "Jupyter", "ETL", "A/B Testing"
        ],
        "frameworks": ["Pandas", "NumPy", "Matplotlib", "Seaborn"],
        "databases": ["PostgreSQL", "MySQL", "Snowflake", "BigQuery"],
        "expected_degrees": ["Data Science", "Statistics", "Computer Science", "Mathematics", "Economics", "B.Tech"],
        "evidence_markers": ["sql queries", "dashboard", "power bi", "tableau", "pandas", "exploratory data analysis", "eda", "kpi", "reporting"],
        "certifications": ["Google Data Analytics Professional Certificate", "Microsoft Power BI Data Analyst", "IBM Data Analyst"]
    },
    "AI/ML Engineer": {
        "title": "AI/ML Engineer",
        "description": "Machine learning modeling, deep neural networks, NLP/Computer Vision, feature engineering, and model deployment.",
        "core_skills": [
            "Python", "Machine Learning", "Data Preprocessing", "Model Evaluation", 
            "Mathematics/Statistics", "Git", "Deep Learning"
        ],
        "secondary_skills": [
            "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", 
            "NLP", "Computer Vision", "Hugging Face", "Docker", "MLflow", "FastAPI"
        ],
        "frameworks": ["PyTorch", "TensorFlow", "Scikit-Learn", "Hugging Face", "FastAPI"],
        "databases": ["PostgreSQL", "Pinecone", "ChromaDB", "MongoDB"],
        "expected_degrees": ["Computer Science", "Artificial Intelligence", "Data Science", "B.Tech", "M.Tech", "MS"],
        "evidence_markers": ["model training", "accuracy", "f1 score", "pytorch", "tensorflow", "neural network", "transformer", "scikit-learn", "embedding"],
        "certifications": ["DeepLearning.AI TensorFlow Developer", "AWS Machine Learning Specialty", "Google Cloud Professional ML Engineer"]
    }
}

def get_role_benchmark(role_name: str) -> dict:
    """Case-insensitive matching for standard benchmark profiles."""
    if not role_name:
        return ROLE_BENCHMARKS["Full Stack Developer"]
        
    cleaned = role_name.strip()
    for key, benchmark in ROLE_BENCHMARKS.items():
        if key.lower() == cleaned.lower():
            return benchmark
            
    # Fuzzy match keywords
    cleaned_lower = cleaned.lower()
    if "java" in cleaned_lower:
        return ROLE_BENCHMARKS["Java Developer"]
    if "python" in cleaned_lower:
        return ROLE_BENCHMARKS["Python Developer"]
    if "frontend" in cleaned_lower or "front-end" in cleaned_lower or "react" in cleaned_lower:
        return ROLE_BENCHMARKS["Frontend Developer"]
    if "backend" in cleaned_lower or "back-end" in cleaned_lower or "server" in cleaned_lower:
        return ROLE_BENCHMARKS["Backend Developer"]
    if "data" in cleaned_lower or "analyst" in cleaned_lower:
        return ROLE_BENCHMARKS["Data Analyst"]
    if "ai" in cleaned_lower or "ml" in cleaned_lower or "machine learning" in cleaned_lower:
        return ROLE_BENCHMARKS["AI/ML Engineer"]
    if "stack" in cleaned_lower:
        return ROLE_BENCHMARKS["Full Stack Developer"]
        
    return ROLE_BENCHMARKS["Software Developer"]

