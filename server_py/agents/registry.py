AGENT_CONFIGS = {
    "Product Manager Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are an expert Product Manager. Clarify requirements, define scope, and break down tasks.",
        "capabilities": ["requirements", "planning", "scope"],
        "maxTokens": 2048,
        "temperature": 0.7
    },
    "Database Designer Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a Database Architect. Design schemas, optimize queries, and plan data structures.",
        "capabilities": ["database", "schema", "sql", "nosql"],
        "maxTokens": 2048,
        "temperature": 0.3
    },
    "Coder Agent": {
        "model": "gemini-2.5-pro",
        "systemMessage": "You are a Senior Full-Stack Engineer. Write clean, efficient, and well-commented code.",
        "capabilities": ["coding", "implementation", "refactoring"],
        "maxTokens": 8192,
        "temperature": 0.2
    },
    "API Designer Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are an API Designer. Create RESTful/GraphQL interfaces, document endpoints, and define payloads.",
        "capabilities": ["api", "rest", "graphql", "endpoints"],
        "maxTokens": 2048,
        "temperature": 0.4
    },
    "Tester Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a QA Engineer. Write unit tests, integration tests, and identify edge cases.",
        "capabilities": ["testing", "qa", "unit-tests"],
        "maxTokens": 2048,
        "temperature": 0.2
    },
    "Security Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a Security Expert. Identify vulnerabilities, suggest best practices, and audit code.",
        "capabilities": ["security", "audit", "vulnerabilities"],
        "maxTokens": 2048,
        "temperature": 0.3
    },
    "Performance Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a Performance Engineer. Optimize code, reduce latency, and improve scalability.",
        "capabilities": ["performance", "optimization", "scaling"],
        "maxTokens": 2048,
        "temperature": 0.4
    },
    "Compliance Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a Compliance Officer. Ensure code meets GDPR, HIPAA, and accessibility standards.",
        "capabilities": ["compliance", "gdpr", "accessibility"],
        "maxTokens": 2048,
        "temperature": 0.3
    },
    "UX Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a UX/UI Designer. Suggest layout improvements, user flows, and aesthetic choices.",
        "capabilities": ["ux", "ui", "design"],
        "maxTokens": 2048,
        "temperature": 0.6
    },
    "Reviewer Agent": {
        "model": "gemini-2.5-pro",
        "systemMessage": "You are a Code Reviewer. Review code for style, anti-patterns, and logic errors.",
        "capabilities": ["review", "linting", "quality"],
        "maxTokens": 4096,
        "temperature": 0.3
    },
    "File Manager Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a File System Manager. Decide where files should be created, moved, or deleted based on standard project structures.",
        "capabilities": ["files", "structure", "organization"],
        "maxTokens": 1024,
        "temperature": 0.2
    },
    "Documenter Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a Technical Writer. Write clear READMEs, inline comments, and architectural docs.",
        "capabilities": ["documentation", "readme", "comments"],
        "maxTokens": 2048,
        "temperature": 0.4
    },
    "DevOps Agent": {
        "model": "gemini-2.5-flash",
        "systemMessage": "You are a DevOps Engineer. Create CI/CD pipelines, Dockerfiles, and deployment scripts.",
        "capabilities": ["devops", "ci-cd", "docker", "deployment"],
        "maxTokens": 2048,
        "temperature": 0.3
    }
}

def get_all_agents():
    return [{"name": k, **v} for k, v in AGENT_CONFIGS.items()]

def get_agent_config(name: str):
    return AGENT_CONFIGS.get(name)
