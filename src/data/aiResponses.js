// Mock AI preparation responses
// Structured by: company → role → category → array of Q&A items
// This is the data source for services/aiPrep.js
// Replace this file's backing source with a real AI API call in a future phase.

const preparationData = {
  'company-tcs': {
    'Systems Engineer': {
      technical: [
        {
          question: 'What is the difference between a process and a thread?',
          answer:
            'A process is an independent program in execution with its own memory space. A thread is a lightweight sub-unit of a process that shares memory with other threads in the same process. Processes are isolated; threads can communicate directly via shared memory.',
          tips: 'Focus on memory isolation, context switching cost, and use-cases for each.',
        },
        {
          question: 'Explain the concept of normalization in databases.',
          answer:
            'Normalization is the process of organizing a relational database to reduce data redundancy and improve integrity. Common normal forms: 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency). Higher forms like BCNF further restrict anomalies.',
          tips: 'Be ready to apply normalization to a sample schema. TCS often tests this in aptitude rounds.',
        },
        {
          question: 'What is object-oriented programming? Explain its four pillars.',
          answer:
            'OOP is a programming paradigm based on objects. The four pillars are: Encapsulation (bundling data and methods), Abstraction (hiding implementation details), Inheritance (deriving new classes from existing ones), and Polymorphism (same interface for different data types).',
          tips: 'Prepare a real-world analogy and a code example for each pillar.',
        },
        {
          question: 'What is the time complexity of binary search?',
          answer:
            'O(log n) — because at each step the search space is halved. Requires a sorted array. Space complexity is O(1) for iterative implementation.',
          tips: 'Know when to use binary search vs. linear search and be able to code it from scratch.',
        },
        {
          question: 'What is a RESTful API?',
          answer:
            'REST (Representational State Transfer) is an architectural style for APIs. Key constraints: stateless communication, uniform interface (HTTP methods GET/POST/PUT/DELETE), resource-based URIs, JSON/XML responses. RESTful APIs are widely used in web services.',
          tips: 'Know HTTP status codes: 200, 201, 400, 401, 404, 500.',
        },
      ],
      aptitude: [
        {
          question: 'A train 150m long passes a pole in 15 seconds. What is its speed in km/h?',
          answer: 'Speed = Distance/Time = 150/15 = 10 m/s = 10 × 18/5 = 36 km/h.',
          tips: 'Practice unit conversions: m/s to km/h (multiply by 18/5).',
        },
        {
          question: 'If 8 workers can complete a job in 12 days, how many days will 6 workers take?',
          answer: 'Using work = workers × days: 8 × 12 = 96 units. 6 workers → 96/6 = 16 days.',
          tips: 'Apply inverse proportion: more workers → fewer days.',
        },
        {
          question: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
          answer:
            '42. Differences: 4, 6, 8, 10, 12 (increasing by 2). So 30 + 12 = 42.',
          tips: 'Always compute first-level differences. If not constant, compute second-level.',
        },
      ],
      hr: [
        {
          question: 'Tell me about yourself.',
          answer:
            'Structure: 1) Academic background, 2) Key skills and projects, 3) Career goal and why TCS. Keep it under 2 minutes. Be confident, not scripted.',
          tips: 'Avoid reading from memory. Practice until it feels natural. Mention one impactful project.',
        },
        {
          question: 'Why do you want to join TCS?',
          answer:
            'Focus on: scale of projects, learning opportunities, TCS\'s presence in 46+ countries, structured training programs. Connect to your personal career goal.',
          tips: 'Avoid generic answers like "It\'s a big company." Show you know something specific about TCS.',
        },
        {
          question: 'Where do you see yourself in 5 years?',
          answer:
            'Give a realistic, growth-oriented answer: start as systems engineer, develop expertise in a domain, take on project leadership. Align with TCS\'s growth structure.',
          tips: 'Show ambition balanced with realism. Avoid "I want to start my own company."',
        },
      ],
      'company-role': [
        {
          question: 'What does a Systems Engineer do at TCS?',
          answer:
            'Systems Engineers at TCS work on application development, maintenance, and support for enterprise clients across banking, insurance, retail, and manufacturing verticals. They work in agile teams using Java, SQL, and cloud tools.',
          tips: 'Research the vertical you prefer before the interview. Mention it confidently.',
        },
        {
          question: 'What is TCS\'s iON platform?',
          answer:
            'TCS iON is a cloud-based platform for digital assessments, education, and talent management. It\'s widely used for conducting large-scale online tests and placement drives.',
          tips: 'You will likely take your TCS placement test on this platform. Familiarize yourself.',
        },
      ],
    },
    'Data Engineer': {
      technical: [
        {
          question: 'What is the difference between a data warehouse and a data lake?',
          answer:
            'A data warehouse stores structured, processed data optimized for analysis (e.g., Redshift, BigQuery). A data lake stores raw data in any format at scale (e.g., S3, ADLS). Data lakes are schema-on-read; warehouses are schema-on-write.',
          tips: 'Know the trade-offs: data lakes are flexible but can become data swamps without governance.',
        },
        {
          question: 'Explain ETL vs ELT.',
          answer:
            'ETL: Extract → Transform → Load (transform before loading to warehouse). ELT: Extract → Load → Transform (load raw data first, transform inside warehouse). ELT is preferred with modern cloud warehouses that have high compute power.',
          tips: 'Be ready to design a simple ETL pipeline for a given use-case.',
        },
        {
          question: 'What is Apache Spark and when would you use it?',
          answer:
            'Apache Spark is an in-memory distributed data processing framework. Use it for large-scale batch processing, real-time streaming, and ML pipelines where the dataset doesn\'t fit on a single machine.',
          tips: 'Know the difference between Spark RDDs, DataFrames, and Datasets.',
        },
      ],
      aptitude: [
        {
          question: 'A bag contains 5 red and 3 blue balls. What is the probability of picking 2 red balls?',
          answer:
            'P = C(5,2)/C(8,2) = 10/28 = 5/14 ≈ 0.357.',
          tips: 'Use combination formula: C(n,r) = n!/(r!(n-r)!). Practice combinations vs permutations.',
        },
      ],
      hr: [
        {
          question: 'How do you handle tight project deadlines?',
          answer:
            'Prioritize tasks using urgency-importance matrix. Break down the deliverable into smaller milestones. Communicate blockers early. Focus on core functionality first.',
          tips: 'Use a real example from a project if possible. Structure using STAR method.',
        },
      ],
      'company-role': [
        {
          question: 'What data tools does TCS use in its data engineering practice?',
          answer:
            'TCS typically uses Apache Spark, Hadoop, Hive, AWS (S3, Glue, Redshift), Azure Data Factory, and Databricks depending on the client. Python and SQL are core skills expected.',
          tips: 'Align your resume skills to this stack. Highlight any cloud or big data exposure.',
        },
      ],
    },
  },

  'company-accenture': {
    'Associate Software Engineer': {
      technical: [
        {
          question: 'What is the Virtual DOM in React and why does it matter?',
          answer:
            'The Virtual DOM is a lightweight JavaScript representation of the real DOM. React uses it to compute the minimal set of changes needed (diffing algorithm) before updating the actual DOM, making updates fast and efficient.',
          tips: 'Understand reconciliation and why direct DOM manipulation is avoided in React.',
        },
        {
          question: 'Explain the difference between synchronous and asynchronous JavaScript.',
          answer:
            'Synchronous code executes line by line, blocking until each operation completes. Asynchronous code (callbacks, Promises, async/await) allows operations like API calls to run without blocking the main thread, improving performance.',
          tips: 'Be able to write a fetch() call using async/await and handle errors with try/catch.',
        },
        {
          question: 'What is a closure in JavaScript?',
          answer:
            'A closure is a function that remembers the variables from its outer scope even after the outer function has returned. Closures are used for data encapsulation, currying, and callbacks.',
          tips: 'Prepare a classic closure example: a counter function.',
        },
        {
          question: 'What is the difference between SQL INNER JOIN and LEFT JOIN?',
          answer:
            'INNER JOIN returns rows where there is a match in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right; unmatched right rows return NULL.',
          tips: 'Draw a Venn diagram if needed. Know all four types: INNER, LEFT, RIGHT, FULL OUTER.',
        },
        {
          question: 'What is REST vs GraphQL?',
          answer:
            'REST uses fixed endpoints per resource and may over/under-fetch data. GraphQL uses a single endpoint where clients specify exactly what data they need, reducing over-fetching. REST is simpler; GraphQL is more flexible for complex data graphs.',
          tips: 'Accenture works with both. Know the trade-offs.',
        },
      ],
      aptitude: [
        {
          question: 'A shopkeeper marks a product 30% above cost and gives a 10% discount. What is the profit %?',
          answer:
            'Let cost = 100. Marked price = 130. Selling price = 130 × 0.9 = 117. Profit = 17%.',
          tips: 'This is a classic successive percentage problem. Practice these systematically.',
        },
        {
          question: 'Two pipes fill a tank in 6 hours and 9 hours respectively. How long do they take together?',
          answer:
            'Combined rate = 1/6 + 1/9 = 3/18 + 2/18 = 5/18. Time = 18/5 = 3.6 hours.',
          tips: 'Pipes and cisterns problems use the same formula as work problems.',
        },
      ],
      hr: [
        {
          question: 'Describe a situation where you worked in a team under pressure.',
          answer:
            'Use STAR method: Situation (tight deadline project), Task (your role), Action (how you coordinated and contributed), Result (successful delivery). Be specific and honest.',
          tips: 'Accenture values teamwork and communication. Make teamwork the hero of the story, not individual heroism.',
        },
        {
          question: 'What are your strengths and weaknesses?',
          answer:
            'Strength: Pick one genuinely relevant skill (e.g., problem-solving, quick learning) with an example. Weakness: Choose a real weakness you have actively improved (e.g., public speaking → joined debate club).',
          tips: 'Never say "I work too hard" for weakness. Interviewers know it\'s dishonest.',
        },
      ],
      'company-role': [
        {
          question: 'What kind of projects do ASEs work on at Accenture?',
          answer:
            'Associate Software Engineers at Accenture work on client projects across banking, retail, telecom, and government. Projects involve building web apps, APIs, and data pipelines using modern JavaScript/Java stacks and cloud platforms.',
          tips: 'Research Accenture\'s industry groups (called "Industries") and mention one you\'re interested in.',
        },
        {
          question: 'What is Accenture\'s TQ (Technology Quotient)?',
          answer:
            'Accenture\'s TQ assessment evaluates candidate aptitude in technology concepts. It includes questions on logical reasoning, technical concepts, and communication. It is part of the selection process for technology roles.',
          tips: 'Practice Accenture-style TQ mock tests available on official prep sites.',
        },
      ],
    },
    'Cloud & Infrastructure Associate': {
      technical: [
        {
          question: 'What are the main AWS service categories?',
          answer:
            'Compute (EC2, Lambda), Storage (S3, EBS), Database (RDS, DynamoDB), Networking (VPC, Route53), Security (IAM, KMS), Analytics (Athena, Redshift), ML (SageMaker). Each category solves a different infrastructure need.',
          tips: 'Map these to real use-cases. Know S3, EC2, IAM, VPC deeply.',
        },
        {
          question: 'What is a Docker container? How is it different from a VM?',
          answer:
            'A Docker container packages application code and its dependencies into an isolated runtime environment. Unlike VMs, containers share the host OS kernel, making them lightweight and faster to start. VMs include a full OS per instance.',
          tips: 'Know the Dockerfile structure: FROM, RUN, COPY, CMD. Be able to describe a basic container lifecycle.',
        },
        {
          question: 'What is Kubernetes and what problem does it solve?',
          answer:
            'Kubernetes (K8s) is a container orchestration platform. It solves: running containers at scale, load balancing across container instances, auto-scaling, self-healing (restarting failed containers), and rolling deployments.',
          tips: 'Know key concepts: Pod, Deployment, Service, Namespace, ConfigMap, Ingress.',
        },
      ],
      aptitude: [
        {
          question: 'In a class of 40, 25 play football, 20 play cricket, and 10 play both. How many play neither?',
          answer: 'Football or cricket = 25 + 20 - 10 = 35. Neither = 40 - 35 = 5.',
          tips: 'This is set theory (union formula): |A ∪ B| = |A| + |B| - |A ∩ B|.',
        },
      ],
      hr: [
        {
          question: 'Why do you want to work in cloud infrastructure?',
          answer:
            'Cloud is foundational to every modern application. Infrastructure roles offer breadth — security, networking, compute — and cloud skills are highly transferable. Show genuine interest in how systems run at scale.',
          tips: 'Mention any AWS/Azure/GCP certifications or self-study to demonstrate seriousness.',
        },
      ],
      'company-role': [
        {
          question: 'What does Accenture Cloud First mean?',
          answer:
            'Accenture Cloud First is a $3B investment initiative focused on helping clients move and operate in the cloud. Cloud & Infrastructure Associates directly contribute to this transformation, working on migrations, DevOps, and cloud-native architectures.',
          tips: 'Referencing Accenture\'s known initiatives shows you researched the company.',
        },
      ],
    },
  },

  'company-infosys': {
    'Systems Engineer Trainee': {
      technical: [
        {
          question: 'What are the main pillars of the software development life cycle (SDLC)?',
          answer:
            'SDLC phases: Planning, Requirements Analysis, System Design, Implementation (Coding), Testing, Deployment, Maintenance. Models: Waterfall, Agile, Scrum, Kanban.',
          tips: 'Infosys emphasizes process and methodology. Know Agile/Scrum terminology.',
        },
        {
          question: 'What is exception handling in Java?',
          answer:
            'Exception handling in Java uses try-catch-finally blocks to handle runtime errors gracefully. Types: Checked exceptions (must be handled: IOException), Unchecked exceptions (runtime: NullPointerException). Custom exceptions extend Exception class.',
          tips: 'Know the exception hierarchy: Throwable → Error / Exception → RuntimeException.',
        },
        {
          question: 'What is a primary key vs foreign key in SQL?',
          answer:
            'Primary key: uniquely identifies each row in a table, cannot be NULL. Foreign key: a field in one table that references the primary key in another table, enforcing referential integrity.',
          tips: 'Practice writing CREATE TABLE statements with PK and FK constraints.',
        },
      ],
      aptitude: [
        {
          question: 'What comes next: 1, 1, 2, 3, 5, 8, 13, ?',
          answer: '21. This is the Fibonacci sequence: each number = sum of the previous two.',
          tips: 'Recognize common sequences: Fibonacci, squares, cubes, primes, triangular numbers.',
        },
        {
          question: 'A man sells an article at 20% profit. If cost is ₹500, what is the selling price?',
          answer: 'SP = CP × (1 + P/100) = 500 × 1.20 = ₹600.',
          tips: 'Master the profit/loss formula. Know how to reverse-engineer cost or profit percentage.',
        },
      ],
      hr: [
        {
          question: 'Are you comfortable with relocation?',
          answer:
            'If yes: "Yes, I understand that Infosys operates pan-India and I am open to working in any location based on project requirements." Show adaptability and professionalism.',
          tips: 'Infosys deploys trainees across locations. Saying no without strong reasons is often disqualifying.',
        },
        {
          question: 'What do you know about Infosys?',
          answer:
            'Infosys is a global IT company founded in 1981, headquartered in Bengaluru. It serves clients in 50+ countries across banking, retail, manufacturing, and healthcare. Known for its strong training program (Mysore campus) and focus on digital transformation.',
          tips: 'Mention Infosys Lex (learning platform) or Infosys Springboard to show initiative.',
        },
      ],
      'company-role': [
        {
          question: 'What is the Infosys training program for freshers?',
          answer:
            'Infosys runs a 16-week foundation training program at their Mysore campus (one of the world\'s largest corporate training centers). Trainees learn Java, DBMS, web technologies, and soft skills. They must pass internal assessments to proceed.',
          tips: 'Prepare for Java and SQL specifically — these are central to the Infosys training assessment.',
        },
      ],
    },
    'Digital Specialist Engineer': {
      technical: [
        {
          question: 'What is the difference between monolithic and microservices architecture?',
          answer:
            'Monolithic: all components in one deployable unit — simple to develop initially but hard to scale. Microservices: independently deployable services communicating over APIs — scalable and resilient but operationally complex.',
          tips: 'Know when NOT to use microservices (small teams, simple domains, early-stage projects).',
        },
        {
          question: 'Explain React hooks. What problem do they solve?',
          answer:
            'Hooks (useState, useEffect, useContext, etc.) allow functional components to use state and lifecycle features previously only available in class components. They make components simpler, more reusable, and easier to test.',
          tips: 'Know the rules of hooks: only call at top level, only in React functions.',
        },
        {
          question: 'What is MongoDB and how does it differ from MySQL?',
          answer:
            'MongoDB is a document-oriented NoSQL database storing data in JSON-like BSON format. MySQL is a relational SQL database with structured tables and schemas. MongoDB is schema-flexible and horizontally scalable; MySQL enforces schema and is better for relational data.',
          tips: 'Know when to choose each. Infosys\'s digital projects use both.',
        },
      ],
      aptitude: [
        {
          question: 'If log(2) = 0.301, find log(8).',
          answer: 'log(8) = log(2³) = 3 × log(2) = 3 × 0.301 = 0.903.',
          tips: 'Know logarithm properties: log(ab) = log(a) + log(b), log(aⁿ) = n×log(a).',
        },
      ],
      hr: [
        {
          question: 'Describe a technical challenge you solved independently.',
          answer:
            'Use STAR. Choose a real project challenge (bug, architecture decision, performance issue). Explain what you tried, what failed, and what ultimately worked. Show structured thinking.',
          tips: 'For a Digital Specialist role, technical depth in your answer matters more than soft framing.',
        },
      ],
      'company-role': [
        {
          question: 'What technologies do Infosys Digital Specialist Engineers work with?',
          answer:
            'Digital Specialist Engineers work with modern full-stack tools: React, Angular, Node.js, Spring Boot, AWS/Azure, Docker, Kubernetes, MongoDB, and Postgres. Projects are typically agile with 2-week sprints.',
          tips: 'Highlight your project experience with any of these technologies in your interview.',
        },
      ],
    },
  },
};

export default preparationData;
