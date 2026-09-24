"""
HireFlow AI — Curated Question Bank
Categorized by Category, Topic, and Difficulty
"""

QUESTION_BANK = [
    # ─── TECHNICAL: PYTHON ──────────────────────────────────────────────────
    {
        "question": "Explain the difference between mutable and immutable types in Python, and how memory references behave.",
        "answer": "In Python, mutable objects (lists, dicts, sets) can be altered in-place after creation, preserving their memory ID (`id()`). Immutable objects (ints, floats, strings, tuples) cannot be modified; any alteration creates a new object in memory. When passing arguments to functions, Python passes object references by value. Modifying a mutable argument inside a function reflects in the caller's scope, whereas reassigning creates a local reference.",
        "tip": "Provide a concrete code snippet demonstrating list `.append()` vs string concatenation to illustrate object reference semantics.",
        "category": "technical",
        "topic": "Python",
        "difficulty": "Intermediate",
    },
    {
        "question": "What are Python generators and decorators, and what are their production use cases?",
        "answer": "Generators are iterator functions that use the `yield` keyword instead of `return`, producing items lazily one at a time. This yields O(1) memory complexity when processing massive datasets or log streams. Decorators are higher-order functions that wrap another function to modify its behavior without modifying source code (`@decorator` syntax). Common use cases: API request authentication, execution time logging, caching, and rate limiting.",
        "tip": "Explain memory efficiency with `yield` when streaming large database query results.",
        "category": "technical",
        "topic": "Python",
        "difficulty": "Intermediate",
    },
    {
        "question": "How does Python's Global Interpreter Lock (GIL) affect multithreading vs multiprocessing?",
        "answer": "The GIL is a mutex that allows only one native thread to execute Python bytecode at a time, preventing race conditions in CPython's reference-counted memory management. For CPU-bound tasks, multithreading does not provide true parallelism due to GIL contention; the `multiprocessing` module is required to spawn separate processes with independent Python interpreters. For I/O-bound tasks (network requests, DB queries, file I/O), multithreading or `asyncio` is effective because threads release the GIL while awaiting I/O.",
        "tip": "Distinguish between CPU-bound (use multiprocessing) and I/O-bound (use multithreading or asyncio).",
        "category": "technical",
        "topic": "Python",
        "difficulty": "Advanced",
    },

    # ─── TECHNICAL: SQL / DATABASES ─────────────────────────────────────────
    {
        "question": "Explain database normalization up to BCNF and when denormalization is preferred in production.",
        "answer": "Normalization organizes relational schemas to eliminate anomalies (insert, update, delete) and redundancy: 1NF requires atomic column values; 2NF eliminates partial dependencies on a composite primary key; 3NF eliminates transitive functional dependencies; BCNF ensures that for every functional dependency X -> Y, X is a superkey. Denormalization intentionally reintroduces controlled redundancy (e.g. pre-aggregating columns or duplicating read-heavy fields) to avoid expensive multi-table joins in high-throughput read systems like analytics or dashboards.",
        "tip": "State clearly: 'Normalize for transactional write consistency (OLTP); denormalize selectively for fast analytical reads (OLAP).'",
        "category": "technical",
        "topic": "SQL",
        "difficulty": "Intermediate",
    },
    {
        "question": "What is the difference between Clustered and Non-Clustered Indexes in MySQL/InnoDB?",
        "answer": "In MySQL InnoDB, a Clustered Index defines the actual physical storage order of table data (typically the Primary Key). Leaves of the B+Tree contain the entire table row. There can only be one clustered index per table. A Non-Clustered (Secondary) Index creates a separate B+Tree where leaf nodes hold the indexed columns along with a pointer to the clustered index key. A query on a secondary index that needs unindexed columns performs an index lookup followed by a 'bookmark lookup' to the clustered index.",
        "tip": "Mention covering indexes (`USING INDEX`) which avoid the secondary lookup entirely.",
        "category": "technical",
        "topic": "SQL",
        "difficulty": "Intermediate",
    },
    {
        "question": "Explain ACID properties in relational databases and how transactions prevent race conditions.",
        "answer": "ACID guarantees transactional reliability: Atomicity (all operations succeed or entire transaction rolls back via write-ahead logging); Consistency (data transitions from one valid state to another, satisfying constraints); Isolation (concurrent transactions execute without cross-interference depending on isolation levels like Read Committed or Serializable); Durability (committed changes persist even during crash recovery). Isolation levels mitigate dirty reads, non-repeatable reads, and phantom reads using locking or Multi-Version Concurrency Control (MVCC).",
        "tip": "Be prepared to explain MVCC and standard isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.",
        "category": "technical",
        "topic": "SQL",
        "difficulty": "Advanced",
    },

    # ─── TECHNICAL: AWS / CLOUD ─────────────────────────────────────────────
    {
        "question": "How does AWS Lambda work under the hood, and how do you mitigate cold starts?",
        "answer": "AWS Lambda runs containerized microVMs (using Firecracker) on managed EC2 worker fleets. When invoked, Lambda initializes the execution environment, downloads deployment code, runs initialization logic outside the handler, and executes the handler. Cold starts occur when a new microVM must be provisioned. Mitigations: 1) Keep deployment packages lightweight; 2) Move static initializations (DB connections, SDK clients) outside the handler function; 3) Use Provisioned Concurrency for predictable latency; 4) In VPC configurations, use modern hyperlane ENI architecture.",
        "tip": "Reference how HireFlow AI reuses warm database connections outside the handler in Python Lambda.",
        "category": "technical",
        "topic": "AWS",
        "difficulty": "Intermediate",
    },
    {
        "question": "Explain Amazon S3 storage classes, bucket policies, and presigned URLs.",
        "answer": "Amazon S3 provides object storage with 99.999999999% (11 9s) durability. Storage classes include S3 Standard (frequent access), S3 Standard-IA (infrequent access), S3 Glacier Instant/Flexible/Deep Archive (long-term backup). Access control is managed via IAM policies, Bucket Policies (resource-based JSON policies), and Access Control Lists. Presigned URLs allow temporary, time-limited read/write access to private S3 objects using the creator's IAM credentials without making the bucket public.",
        "tip": "Highlight presigned URLs as the secure enterprise pattern for client-side direct uploads.",
        "category": "technical",
        "topic": "AWS",
        "difficulty": "Intermediate",
    },
    {
        "question": "Compare Amazon RDS vs Amazon Aurora, including failover, replication, and scaling.",
        "answer": "Amazon RDS provisions managed relational database instances (MySQL, PostgreSQL) on EC2 with EBS volumes. Multi-AZ replication uses synchronous block-level replication to a standby instance with ~60-120s failover time. Amazon Aurora is a cloud-native relational engine that separates compute from storage. Aurora storage replicates 6 copies across 3 Availability Zones with a log-structured distributed storage volume. Failover takes under 30 seconds, read replicas share storage without replication lag, and Aurora provides up to 5x throughput of standard MySQL.",
        "tip": "Explain that RDS is cost-effective for standard workloads, while Aurora excels in high-scale distributed IOPS.",
        "category": "technical",
        "topic": "AWS",
        "difficulty": "Advanced",
    },

    # ─── TECHNICAL: DOCKER / CONTAINERIZATION ──────────────────────────────
    {
        "question": "What is the difference between a Docker Image and a Docker Container, and how does layer caching work?",
        "answer": "A Docker Image is a read-only, immutable template containing application code, runtime, system tools, and libraries, defined by a Dockerfile. A Docker Container is a runnable, isolated instance of an image with a thin read-write layer added on top. Docker builds images using layer caching: each Dockerfile instruction (`COPY`, `RUN`) generates a layer cached by SHA256 checksum. If a layer and its antecedents are unchanged, Docker reuses the cached layer, dramatically accelerating build times.",
        "tip": "Explain multi-stage builds (`FROM ... AS builder`) as a best practice to minimize production image size.",
        "category": "technical",
        "topic": "Docker",
        "difficulty": "Intermediate",
    },
    {
        "question": "How do Docker volumes, bind mounts, and container networking interact in microservices?",
        "answer": "Docker containers have ephemeral filesystems. Data persistence is achieved via: 1) Docker Volumes (managed by Docker daemon in host storage `/var/lib/docker/volumes`), safe for database persistence and container sharing; 2) Bind Mounts (mounting explicit host directories into containers), ideal for local development. For networking, Docker provides bridge networks (isolated virtual switch for single-host container communication), host networking (bypasses isolation, uses host network stack), and overlay networks (cross-host communication in Docker Swarm/Kubernetes).",
        "tip": "Emphasize why database containers must always use named volumes rather than container-local storage.",
        "category": "technical",
        "topic": "Docker",
        "difficulty": "Intermediate",
    },

    # ─── TECHNICAL: GIT & CI/CD ─────────────────────────────────────────────
    {
        "question": "Explain Git Rebase vs Git Merge, fast-forward merges, and handling merge conflicts.",
        "answer": "`git merge` combines two branches by creating a new 'merge commit' with two parent commits, preserving the exact non-linear commit history and context of when branches diverged. `git rebase` rewrites history by replaying commits from the feature branch on top of the target branch, producing a clean, linear commit log. Fast-forward merge occurs when the target branch has not diverged; Git simply moves the pointer forward without creating a merge commit. Merge conflicts occur when competing commits edit the same lines, requiring manual resolution before committing.",
        "tip": "State the golden rule: Never rebase shared public branches; use rebase for local feature cleanups before merging.",
        "category": "technical",
        "topic": "Git",
        "difficulty": "Beginner",
    },

    # ─── TECHNICAL: DSA & CORE CS ───────────────────────────────────────────
    {
        "question": "Compare QuickSort and MergeSort: time complexity, space complexity, and stability.",
        "answer": "MergeSort is a divide-and-conquer algorithm with guaranteed O(n log n) time across best, average, and worst cases. It is a stable sort (preserves relative order of equal keys) but requires O(n) auxiliary memory. QuickSort partitions an array around a pivot; its average time complexity is O(n log n), but worst case is O(n^2) when poor pivots are chosen (mitigated with randomized pivoting or median-of-three). QuickSort is typically in-place with O(log n) call stack space, but unstable. QuickSort usually outperforms MergeSort on arrays due to better CPU cache locality.",
        "tip": "Connect this to real systems: Java/Python use Timsort (hybrid MergeSort) for objects, and Dual-Pivot QuickSort for primitives.",
        "category": "technical",
        "topic": "DSA",
        "difficulty": "Intermediate",
    },
    {
        "question": "What is the difference between a Process and a Thread, and how does inter-process communication (IPC) work?",
        "answer": "A process is an executing program instance with its own private virtual address space, file handles, and resources. A thread is a lightweight execution unit inside a process that shares the process's heap, global variables, and open files, but retains its own stack and registers. Threads have low context-switching overhead but risk concurrency bugs. Processes are memory-isolated; communication requires IPC mechanisms such as pipes, message queues, shared memory, or Unix domain/network sockets.",
        "tip": "Highlight memory safety vs context-switch latency trade-offs between processes and threads.",
        "category": "technical",
        "topic": "OS",
        "difficulty": "Intermediate",
    },
    {
        "question": "Explain the OSI Model layers vs TCP/IP model, and what happens when you enter a URL into a browser.",
        "answer": "The OSI model has 7 layers (Physical, Data Link, Network, Transport, Session, Presentation, Application); TCP/IP condenses this into 4 layers (Network Interface, Internet, Transport, Application). When entering a URL: 1) Browser checks DNS cache, then queries DNS server for IP; 2) Browser initiates TCP 3-Way Handshake (SYN, SYN-ACK, ACK); 3) For HTTPS, TLS handshake performs certificate validation and session key negotiation; 4) Browser sends HTTP GET request; 5) Server routes request through reverse proxy/load balancer to application; 6) Server responds with HTTP payload; 7) Browser parses HTML, builds DOM/CSSOM, and renders page.",
        "tip": "Mention DNS resolution, TCP handshake, TLS negotiation, and HTTP response rendering in logical order.",
        "category": "technical",
        "topic": "Networks",
        "difficulty": "Intermediate",
    },

    # ─── APTITUDE ───────────────────────────────────────────────────────────
    {
        "question": "A train 150m long passes a platform 250m long in 20 seconds. What is the speed of the train in km/h?",
        "answer": "Total distance traveled = Length of train + Length of platform = 150m + 250m = 400 meters. Time taken = 20 seconds. Speed = Distance / Time = 400 / 20 = 20 m/s. To convert m/s to km/h, multiply by 18/5: 20 × (18 / 5) = 72 km/h.",
        "tip": "Remember: train crossing platform/bridge distance = train length + platform length. Crossing a pole/man distance = train length only.",
        "category": "aptitude",
        "topic": "Quantitative",
        "difficulty": "Beginner",
    },
    {
        "question": "A and B can complete a work in 12 days and 18 days respectively. They work together for 4 days, then A leaves. How many days will B take to finish the remaining work?",
        "answer": "Total work = LCM(12, 18) = 36 units. Efficiency of A = 36 / 12 = 3 units/day. Efficiency of B = 36 / 18 = 2 units/day. Combined efficiency = 3 + 2 = 5 units/day. In 4 days, work completed = 4 × 5 = 20 units. Remaining work = 36 - 20 = 16 units. Time taken by B to finish remaining work = 16 / 2 = 8 days.",
        "tip": "Always use the LCM method to represent total work in units; it eliminates clumsy fraction calculations.",
        "category": "aptitude",
        "topic": "Quantitative",
        "difficulty": "Intermediate",
    },
    {
        "question": "In a coding language, 'CLOUD' is written as 'DMPVE'. How is 'DOCKER' written in the same language?",
        "answer": "Each letter is shifted forward by +1 in the alphabet: C(+1)=D, L(+1)=M, O(+1)=P, U(+1)=V, D(+1)=E. Applying +1 to DOCKER: D(+1)=E, O(+1)=P, C(+1)=D, K(+1)=L, E(+1)=F, R(+1)=S. Therefore, DOCKER becomes 'EPDLFS'.",
        "tip": "Write alphabet letter positions 1 to 26 quickly on scratch paper to solve coding-decoding questions in seconds.",
        "category": "aptitude",
        "topic": "Logical",
        "difficulty": "Beginner",
    },
    {
        "question": "Find the missing number in the series: 3, 7, 15, 31, 63, ?",
        "answer": "The pattern is (Previous Number × 2) + 1. Specifically: 3×2+1=7; 7×2+1=15; 15×2+1=31; 31×2+1=63. Next number = 63×2 + 1 = 126 + 1 = 127. Alternatively, differences are 4, 8, 16, 32, 64 (powers of 2): 63 + 64 = 127.",
        "tip": "Always test both difference series and multiplicative recurrence patterns.",
        "category": "aptitude",
        "topic": "Logical",
        "difficulty": "Beginner",
    },

    # ─── HR & BEHAVIORAL ────────────────────────────────────────────────────
    {
        "question": "Tell me about a challenging project where you encountered a major technical hurdle and how you resolved it.",
        "answer": "Use the STAR method: Situation: Outline project context and your role. Task: State the specific technical problem or bottleneck. Action: Detail your debugging process, technologies evaluated, architectural decisions, and how you collaborated with peers. Result: Quantify the outcome (e.g. reduced latency by 35%, eliminated memory leak, delivered on schedule).",
        "tip": "Highlight ownership, root cause analysis, and what you learned from the experience rather than blaming tools or teammates.",
        "category": "hr",
        "topic": "Behavioral",
        "difficulty": "Intermediate",
    },
    {
        "question": "How do you handle disagreements within a software development team regarding technical architecture?",
        "answer": "I focus on objective criteria rather than personal opinions: 1) Clarify the underlying requirements and constraints (scalability, maintainability, deadline, budget); 2) Build small proofs-of-concept or benchmark data to evaluate alternatives objectively; 3) Listen actively to the other perspective to understand trade-offs; 4) Seek consensus aligned with team goals, or defer to team lead / architectural guidelines while committing 100% to the chosen path (disagree and commit).",
        "tip": "Reference Amazon's leadership principle 'Have Backbone; Disagree and Commit' and show maturity in technical debates.",
        "category": "hr",
        "topic": "Behavioral",
        "difficulty": "Intermediate",
    },
    {
        "question": "Why do you want to join our organization, and where do you see yourself in 3 to 5 years?",
        "answer": "Align your personal career goals with the company's core strengths and mission: mention specific engineering domains, client scale, or innovation initiatives that excite you. For the 5-year outlook: emphasize continuous growth from an associate engineer mastering system design, clean architecture, and cloud operations toward a senior technical contributor or module lead who mentors junior engineers.",
        "tip": "Customize your answer by citing real company initiatives (e.g. TCS digital transformation, Accenture cloud-first innovation, Infosys Cobalt).",
        "category": "hr",
        "topic": "Behavioral",
        "difficulty": "Beginner",
    },

    # ─── COMPANY & ROLE: TCS ────────────────────────────────────────────────
    {
        "question": "What do you know about Tata Consultancy Services (TCS), its culture, and core values?",
        "answer": "TCS is a flagship global IT services and consulting organization founded in 1968, operating in 55 countries. It operates under the Tata Code of Conduct with core values: Leading change, Integrity, Respect for the individual, Excellence, and Learning & Sharing. TCS focuses heavily on workforce upskilling through internal platforms like Elevate and iEvolve, and drives enterprise transformation across banking, retail, life sciences, and cloud modernization.",
        "tip": "Mention the Tata legacy of community contribution and long-term client relationships.",
        "category": "company-role",
        "topic": "TCS",
        "difficulty": "Beginner",
    },
    {
        "question": "What are the key responsibilities of a Systems Engineer at TCS, and what skills are critical?",
        "answer": "A Systems Engineer at TCS works on enterprise software engineering, legacy modernization, and client-facing digital systems. Responsibilities include requirements analysis, coding in Java/Python/.NET, database schema optimization, writing unit tests, supporting automated CI/CD pipelines, and collaborating in agile teams. Critical skills: solid programming fundamentals, database design, problem-solving, and adaptability across client tech stacks.",
        "tip": "Highlight willingness to learn new technologies and align with enterprise software development best practices.",
        "category": "company-role",
        "topic": "TCS",
        "difficulty": "Intermediate",
    },

    # ─── COMPANY & ROLE: ACCENTURE ──────────────────────────────────────────
    {
        "question": "What is Accenture's business model, and how does it deliver digital and cloud consulting?",
        "answer": "Accenture is a Fortune Global 500 professional services company providing strategy, consulting, technology, and operations services. It helps global enterprises navigate digital disruption through Cloud First initiatives, AI integration, cyber security, and intelligent platforms. Accenture emphasizes continuous innovation, cross-functional agile teams, and high-impact delivery for Fortune 100 clients.",
        "tip": "Reference Accenture's '360° Value' philosophy and its partnerships with major cloud providers (AWS, Azure, GCP).",
        "category": "company-role",
        "topic": "Accenture",
        "difficulty": "Beginner",
    },
    {
        "question": "What does an Associate Software Engineer do at Accenture, and what is expected during onboarding?",
        "answer": "Associate Software Engineers at Accenture participate in project delivery across full-stack development, cloud migration, automated testing, and application maintenance. During onboarding, graduates complete comprehensive training in agile methodologies, modern development stacks, DevOps tools, and client communication before deployment to active accounts.",
        "tip": "Demonstrate curiosity about end-to-end consulting delivery and modern cloud-native architectures.",
        "category": "company-role",
        "topic": "Accenture",
        "difficulty": "Intermediate",
    },

    # ─── COMPANY & ROLE: INFOSYS ────────────────────────────────────────────
    {
        "question": "What is Infosys Cobalt, and what is the significance of the Infosys Mysore Training Center?",
        "answer": "Infosys Cobalt is a comprehensive set of enterprise cloud solutions, services, and platforms that helps businesses build cloud-first capabilities. The Infosys Mysore Global Education Center is the world's largest corporate university, famous for its rigorous foundation program covering software engineering, algorithms, databases, cloud, and agile teamwork for newly hired Systems Engineer Trainees.",
        "tip": "Express enthusiasm for the Mysore foundation training and its focus on algorithmic thinking and clean code.",
        "category": "company-role",
        "topic": "Infosys",
        "difficulty": "Beginner",
    },
]
