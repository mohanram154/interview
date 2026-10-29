-- V2__seed_data.sql
-- Seed job roles and comprehensive technical interview questions

INSERT INTO job_roles (id, name, description, active) VALUES
(1, 'Java Developer', 'Enterprise backend development using Core Java, Spring Boot, Hibernate, JVM internals, and concurrency.', TRUE),
(2, 'Python Developer', 'Python engineering covering data structures, OOP, async programming, FastAPI/Django, and standard libraries.', TRUE),
(3, 'Full Stack Developer', 'End-to-end web architecture, React frontend, REST APIs, databases, authentication, and state management.', TRUE),
(4, 'Frontend Developer', 'Modern UI engineering using React, TypeScript, state management, CSS layouts, and web performance.', TRUE),
(5, 'Backend Developer', 'Server-side microservices, REST APIs, database transactions, caching, authentication, and system design.', TRUE),
(6, 'SQL & Database Engineer', 'Relational database schema design, indexing, ACID transactions, complex queries, and query optimization.', TRUE);

-- Questions for Java Developer (Role ID: 1)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(1, 'Explain the difference between HashMap and ConcurrentHashMap in Java. How does ConcurrentHashMap achieve thread safety without locking the entire table?', 'Core Java', 'INTERMEDIATE', 'bucket level locking, CAS, synchronized block, synchronized map, segments, concurrency, performance', TRUE),
(1, 'What is the Java Memory Model? Describe the difference between the Heap memory and the Stack memory, and how garbage collection operates in the Young vs Tenured generations.', 'JVM Internals', 'INTERMEDIATE', 'heap, stack, garbage collection, Eden, survivor, tenured, generational GC, out of memory, thread stack', TRUE),
(1, 'How does Spring Boot dependency injection work, and what is the difference between @Component, @Service, and @Repository annotations?', 'Spring Framework', 'BEGINNER', 'inversion of control, dependency injection, application context, stereotypes, persistence exception translation, spring beans', TRUE),
(1, 'Explain how the Java CompletableFuture API enables asynchronous programming. How does it handle exception propagation and thread pool chaining?', 'Concurrency', 'ADVANCED', 'asynchronous, CompletableFuture, supplyAsync, thenApply, exceptionally, ForkJoinPool, thread pool, non-blocking', TRUE),
(1, 'What are Java Records introduced in modern Java, and how do they differ from regular POJO classes regarding immutability, equals, and hashCode?', 'Modern Java', 'BEGINNER', 'records, immutability, final fields, boilerplate reduction, equals, hashCode, toString, canonical constructor', TRUE);

-- Questions for Python Developer (Role ID: 2)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(2, 'Explain the difference between Python lists and tuples. When would you prefer a tuple over a list from memory and execution perspectives?', 'Core Python', 'BEGINNER', 'mutable, immutable, hashable, dictionary key, memory allocation, performance, overhead', TRUE),
(2, 'What is the Global Interpreter Lock (GIL) in CPython? How does it affect CPU-bound multi-threaded programs compared to I/O-bound tasks, and how can multiprocessing mitigate it?', 'CPython & Concurrency', 'INTERMEDIATE', 'GIL, CPython, CPU bound, IO bound, multiprocessing, threading, async, parallelism', TRUE),
(2, 'Explain how Python decorators work under the hood. Provide an example of how you would write a decorator that measures and logs the execution time of a function.', 'Advanced Python', 'INTERMEDIATE', 'first class functions, closures, wrapper, functools wraps, arguments, execution time, decorator syntax', TRUE),
(2, 'How does Python asyncio work? Contrast coroutines, event loops, tasks, and compare async I/O with traditional threading.', 'Asynchronous Programming', 'ADVANCED', 'event loop, async await, coroutine, task, non-blocking IO, single-threaded concurrency, future', TRUE),
(2, 'What are Python generators and the yield statement? How do they help with memory efficiency when processing large streaming datasets?', 'Core Python', 'BEGINNER', 'generator, yield, iterator protocol, lazy evaluation, memory efficiency, next function', TRUE);

-- Questions for Full Stack Developer (Role ID: 3)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(3, 'Explain how JWT authentication works end-to-end between a React frontend and a Spring Boot backend. How should access tokens and refresh tokens be handled securely?', 'Security & Auth', 'INTERMEDIATE', 'header payload signature, stateless, Bearer token, HttpOnly cookie, localStorage risks, refresh token rotation, CORS', TRUE),
(3, 'What happens when a user types a URL into their browser and presses Enter? Describe DNS resolution, TLS handshake, HTTP request/response, and browser DOM rendering.', 'Web Architecture', 'INTERMEDIATE', 'DNS lookup, TCP handshake, TLS SSL, HTTP GET, DOM tree, CSSOM, render tree, layout painting', TRUE),
(3, 'How do you design a RESTful API with idempotency for critical transactions such as processing payments or placing orders?', 'API Design', 'ADVANCED', 'REST, idempotency key, HTTP methods, POST vs PUT, unique constraint, distributed transactions, retry logic', TRUE),
(3, 'In a React application, how do you manage global state versus local component state, and when would you use Context API versus Zustand or Redux?', 'Frontend Architecture', 'BEGINNER', 'useState, prop drilling, Context API, state management, re-renders, predictability, selectors', TRUE),
(3, 'What is CORS (Cross-Origin Resource Sharing)? Why does the browser enforce it, and how do you configure it properly on the backend without using wildcard origins with credentials?', 'Security', 'BEGINNER', 'same origin policy, preflight OPTIONS request, Access-Control-Allow-Origin, credentials, headers, browser security', TRUE);

-- Questions for Frontend Developer (Role ID: 4)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(4, 'Explain React Virtual DOM and the reconciliation algorithm. How does the key prop help React optimize list re-rendering?', 'React Core', 'BEGINNER', 'virtual dom, reconciliation, diffing algorithm, key prop, fiber tree, unnecessary re-renders', TRUE),
(4, 'What are the main differences between useEffect, useMemo, and useCallback? Describe a common bug caused by omitting a dependency in the dependency array.', 'React Hooks', 'INTERMEDIATE', 'memoization, referential equality, dependency array, stale closures, expensive calculations, side effects', TRUE),
(4, 'How does CSS Flexbox differ from CSS Grid, and in what practical responsive layout scenarios would you choose one over the other?', 'CSS & Layout', 'BEGINNER', 'one-dimensional, two-dimensional, flex-direction, grid-template-columns, alignment, responsive design', TRUE),
(4, 'Explain Web Vitals (LCP, FID/INP, CLS). What techniques would you use to diagnose and fix a slow Largest Contentful Paint in a React Vite application?', 'Performance', 'ADVANCED', 'Core Web Vitals, LCP, INP, CLS, code splitting, lazy loading, image optimization, bundle size, CDN', TRUE),
(4, 'How does TypeScript improve maintainability in large frontend projects? Explain the difference between type aliases and interfaces, and how generics enhance component flexibility.', 'TypeScript', 'INTERMEDIATE', 'static typing, interface vs type, declaration merging, generics, compile time safety, intellisense', TRUE);

-- Questions for Backend Developer (Role ID: 5)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(5, 'What is the difference between monolithic architecture and microservices? What are the key trade-offs in terms of deployment, network latency, and data consistency?', 'System Architecture', 'INTERMEDIATE', 'microservices, monolith, distributed systems, latency, eventual consistency, service discovery, independent deployment', TRUE),
(5, 'How do caching layers like Redis improve backend performance? Explain cache eviction strategies such as LRU and caching patterns like Cache-Aside vs Write-Through.', 'Caching & Performance', 'INTERMEDIATE', 'Redis, cache-aside, write-through, write-back, TTL, LRU eviction, cache invalidation, cache stampede', TRUE),
(5, 'Explain database connection pooling in backend applications (e.g., HikariCP). Why is opening a new database connection per HTTP request problematic?', 'Database & Connectivity', 'BEGINNER', 'connection pool, HikariCP, TCP overhead, socket exhaustion, max lifetime, resource reuse, throughput', TRUE),
(5, 'How do you design a resilient system that can survive external third-party API outages? Discuss circuit breakers, retries with exponential backoff, and fallbacks.', 'Resilience', 'ADVANCED', 'circuit breaker, Resilience4j, half-open state, exponential backoff, jitter, fallback response, timeout', TRUE),
(5, 'Explain role-based access control (RBAC) and attribute-based access control (ABAC). How are security filters and interceptors configured in a Spring Boot application?', 'Security', 'INTERMEDIATE', 'RBAC, ABAC, SecurityFilterChain, authorization, Principal, Authorities, method security, PreAuthorize', TRUE);

-- Questions for SQL & Database Engineer (Role ID: 6)
INSERT INTO questions (job_role_id, question_text, category, difficulty, expected_topics, active) VALUES
(6, 'Explain the ACID properties of relational database transactions and provide concrete real-world examples of how Atomicity and Isolation protect data.', 'Transactions', 'BEGINNER', 'Atomicity, Consistency, Isolation, Durability, rollback, commit, dirty reads, isolation levels', TRUE),
(6, 'What is the internal structure of a B-Tree index in MySQL InnoDB? How does a clustered index differ from a secondary index, and what is index lookup overhead?', 'Indexing Internals', 'INTERMEDIATE', 'B+ tree, clustered index, primary key, secondary index, bookmark lookup, leaf nodes, root, covering index', TRUE),
(6, 'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN. How does the database query planner execute nested loop joins vs hash joins?', 'Query Execution', 'BEGINNER', 'INNER JOIN, LEFT JOIN, outer join, NULL values, join algorithms, nested loops, hash join, Cartesian product', TRUE),
(6, 'What are database deadlock situations? How does the database engine detect deadlocks, and how can you design queries and transactions to avoid them?', 'Concurrency & Locking', 'ADVANCED', 'deadlock, row locks, lock ordering, wait-for graph, lock escalation, gap locks, short transactions', TRUE),
(6, 'Explain how EXPLAIN / EXPLAIN ANALYZE helps diagnose slow queries. What indicators in the explain output signify a full table scan or poor index usage?', 'Performance Tuning', 'INTERMEDIATE', 'EXPLAIN, type ALL, index scan, rows examined, filtered, using temporary, using filesort, query optimization', TRUE);
