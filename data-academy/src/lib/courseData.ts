// src/lib/courseData.ts
// Rebuilt course data structure where a lesson is a combination of different sub-lesson types:
// READING, VIDEO, CODING_EXERCISE, SQL_EXERCISE, QUIZ, PRACTICE, DOWNLOADABLE, EXTERNAL_RESOURCE, PROJECT

export interface SubLessonCard {
  title: string;
  badge?: string;
  description: string;
  color?: string;
  icon?: string;
}

export interface SubLessonTab {
  id: string;
  label: string;
  title: string;
  content: string;
  image?: string;
}

export interface PracticeScenario {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SubLesson {
  id: string;
  sectionNumber: string; // e.g. "1.1.1"
  title: string;
  type: string; // "READING" | "VIDEO" | "CODING_EXERCISE" | "SQL_EXERCISE" | "QUIZ" | "PRACTICE" | "DOWNLOADABLE" | "EXTERNAL_RESOURCE" | "ASSIGNMENT" | "PROJECT"
  content?: string;
  mediaUrl?: string;
  videoUrl?: string;
  cards?: SubLessonCard[];
  tabs?: SubLessonTab[];
  practiceQuiz?: {
    prompt?: string;
    scenarios: PracticeScenario[];
  };
  // Coding Exercise Lab
  starterCode?: string;
  solutionHint?: string;
  // SQL Lab
  starterSql?: string;
  schemaContext?: string;
  // Quiz
  passingScore?: number;
  quizQuestions?: QuizQuestion[];
  // Downloadable
  downloadUrl?: string;
  fileName?: string;
  fileType?: string;
  // External Resource
  externalUrl?: string;
  provider?: string;
  // Project / Assignment
  deliverables?: string;
  starterRepoUrl?: string;
  maxScore?: number;
}

export interface LessonData {
  id: string;
  title: string;
  type: string; // Default/fallback "READING"
  order: number;
  estimatedMinutes: number;
  heroImage?: string;
  learningObjectives?: string[];
  subLessons: SubLesson[];
}

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonData[];
}

export interface CourseData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: number;
  modules: ModuleData[];
}

export const REBUILT_DATA_SCIENCE_COURSE: CourseData = {
  id: "course_ds_foundations",
  title: "Data Science Foundations",
  slug: "data-science-foundations",
  shortDescription: "A comprehensive beginner course combining rich text guides, video lectures, interactive Python labs, SQL query sandboxes, and concept checks.",
  fullDescription: "Data Science Foundations is engineered for learners who want practical, hands-on mastery. Each lesson is composed of a continuous sequence of specialized sub-lessons — combining reading guides, video lectures, runnable Python coding challenges, live SQL query sandboxes, interactive practice checks, and downloadable assets into one seamless flow.",
  coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
  level: "BEGINNER",
  estimatedHours: 40,
  modules: [
    {
      id: "mod_1",
      title: "Module 1: Introduction to Data Science & Big Data",
      description: "Understand the fundamental concepts of data science, big data characteristics, analytics workflows, and the core ecosystem tools.",
      order: 1,
      lessons: [
        {
          id: "les_1_1",
          title: "1.1 Understanding Big Data & The Analytics Lifecycle",
          type: "READING",
          order: 1,
          estimatedMinutes: 30,
          heroImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Define big data and explain the role of modern data engineers",
            "Differentiate the four Vs of Big Data: Volume, Variety, Velocity, and Veracity",
            "Classify real-world business scenarios into big data dimensions",
            "Evaluate industry impact across Healthcare, Retail, and Education sectors",
            "Pass the Big Data Foundations knowledge check quiz"
          ],
          subLessons: [
            {
              id: "sub_1_1_1",
              sectionNumber: "1.1.1",
              title: "Defining Big Data",
              type: "READING",
              content: `The emergence of modern digital enterprises has revolutionized how information is created, stored, and utilized. Organizations no longer manage megabytes of spreadsheets; they process continuous streams of petabytes from IoT sensors, transaction logs, e-commerce purchases, and global user interactions.

Big data describes datasets whose size, velocity of generation, and structural complexity outstrip traditional relational databases and desktop analytics software. Data engineers build the distributed computing pipelines and fault-tolerant architectures that ensure data remains secure, accessible, and ready for analytical insights.`,
              mediaUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1000&auto=format&fit=crop&q=80",
            },
            {
              id: "sub_1_1_2",
              sectionNumber: "1.1.2",
              title: "The Four Vs of Big Data",
              type: "READING",
              content: "Data infrastructure engineers characterize big data along four core axes. Click on each quadrant below to explore the unique technical challenges and storage requirements of each dimension:",
              cards: [
                {
                  title: "Scale of Data",
                  badge: "VOLUME",
                  color: "#e11d48",
                  icon: "📚",
                  description: "Massive scale of data generated by billions of mobile devices, clickstreams, and telemetry. Storing terabytes to exabytes demands distributed systems like Apache Hadoop HDFS, AWS S3, and Google Cloud Storage."
                },
                {
                  title: "Forms of Data",
                  badge: "VARIETY",
                  color: "#0284c7",
                  icon: "🌐",
                  description: "Data arrives in diverse formats: structured tables (SQL), semi-structured formats (JSON, Parquet, Avro, XML), and unstructured media (audio, video, medical scans, satellite imagery)."
                },
                {
                  title: "Speed of Generation",
                  badge: "VELOCITY",
                  color: "#10b981",
                  icon: "⚡",
                  description: "The rapid rate at which data is produced and must be evaluated. Real-time telemetry, fraud prevention engines, and IoT sensors require low-latency streaming pipelines using Kafka, Flink, and Spark Streaming."
                },
                {
                  title: "Quality & Trust",
                  badge: "VERACITY",
                  color: "#d97706",
                  icon: "🛡️",
                  description: "The trustworthiness and accuracy of data. Noise, duplicate transactions, voluntary response biases, and spoofed metrics demand rigorous automated schema validation, cleaning, and anomaly detection."
                }
              ]
            },
            {
              id: "sub_1_1_3",
              sectionNumber: "1.1.3",
              title: "Interactive Practice: Big Data Characteristics",
              type: "PRACTICE",
              content: "Now that you have explored the four Vs, review the four client scenarios below and identify which big data characteristic is highlighted in each case.",
              practiceQuiz: {
                prompt: "Select the big data characteristic (Volume, Velocity, Variety, Veracity) that best matches each client scenario:",
                scenarios: [
                  {
                    id: "sc_1",
                    text: "An online marketplace reviews customer ratings and notices that customers who had a frustrating experience are significantly more vocal than satisfied buyers, potentially biasing the ratings.",
                    options: ["Variety", "Velocity", "Veracity", "Volume"],
                    correctAnswer: "Veracity",
                    explanation: "Veracity reflects the integrity and truthfulness of data. Voluntary response bias threatens the accuracy of the conclusions drawn from customer sentiment."
                  },
                  {
                    id: "sc_2",
                    text: "A smart factory mounts 120 vibration sensors across its automated assembly robots. Each sensor records 40 readings per second to instantly stop machinery before an overheating failure occurs.",
                    options: ["Variety", "Velocity", "Veracity", "Volume"],
                    correctAnswer: "Velocity",
                    explanation: "Velocity relates to high-frequency data production and the requirement for sub-second real-time evaluation and response."
                  },
                  {
                    id: "sc_3",
                    text: "A streaming media platform evaluates audience reaction by combining viewing watch-time numbers, audio transcripts, user tweets, and critic articles in PDF form.",
                    options: ["Variety", "Velocity", "Veracity", "Volume"],
                    correctAnswer: "Variety",
                    explanation: "Variety refers to aggregating information across wildly heterogeneous structures: tabular metrics, unstructured audio, and raw text."
                  },
                  {
                    id: "sc_4",
                    text: "A global payment gateway processes 25 million transactions every 24 hours and must persist all encrypted records across redundant clusters for compliance audits.",
                    options: ["Variety", "Velocity", "Veracity", "Volume"],
                    correctAnswer: "Volume",
                    explanation: "Volume describes the physical magnitude and persistence footprint of millions of transactional records."
                  }
                ]
              }
            },
            {
              id: "sub_1_1_4",
              sectionNumber: "1.1.4",
              title: "Industry Impact & Practical Applications",
              type: "READING",
              content: "Modern data architectures create tangible business and social value. Select a sector below to examine how organizations leverage big data to solve critical challenges:",
              tabs: [
                {
                  id: "tab_healthcare",
                  label: "Healthcare",
                  title: "Precision Medicine & Predictive Diagnostics",
                  content: "Medical institutions ingest genomic sequencing data, high-resolution radiology scans, and real-time biometric telemetry from wearable monitors. Deep learning models assist clinicians by identifying malignant lesions with over 94% diagnostic accuracy weeks before traditional symptoms appear.",
                  image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&auto=format&fit=crop&q=80"
                },
                {
                  id: "tab_retail",
                  label: "Retail & Supply Chain",
                  title: "Hyper-Personalization & Dynamic Logistics",
                  content: "E-commerce giants utilize distributed recommendation algorithms to predict purchase patterns and adjust warehouse inventory in regional hubs before orders are even placed. Dynamic pricing engines recalibrate millions of SKUs based on supply elasticity and competitor behavior.",
                  image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=900&auto=format&fit=crop&q=80"
                },
                {
                  id: "tab_education",
                  label: "EdTech & Learning",
                  title: "Adaptive Learning Systems",
                  content: "Next-generation learning platforms monitor exercise solve times, hint requests, and code execution outputs to dynamically customize review intervals, ensuring mastery of difficult statistical concepts through personalized repetition.",
                  image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&auto=format&fit=crop&q=80"
                }
              ]
            },
            {
              id: "sub_1_1_5",
              sectionNumber: "1.1.5",
              title: "Knowledge Check: Big Data Foundations",
              type: "QUIZ",
              content: "Test your understanding of the foundational concepts covered in this lesson. You need 75% or higher to earn full completion.",
              passingScore: 75,
              quizQuestions: [
                {
                  id: "q_1",
                  question: "Which of the following is the primary challenge associated with the 'Velocity' dimension of big data?",
                  options: [
                    "Translating diverse file formats into CSV",
                    "Ingesting and processing continuous high-frequency streams in real time",
                    "Purchasing larger hard drives for cold storage",
                    "Finding qualified data analysts"
                  ],
                  correctIndex: 1,
                  explanation: "Velocity demands real-time ingestion, stream processing engines, and low-latency storage to derive insights before data expires."
                },
                {
                  id: "q_2",
                  question: "A company combines customer audio recordings, support tickets in JSON, and SQL database rows. Which dimension does this demonstrate?",
                  options: ["Volume", "Variety", "Velocity", "Veracity"],
                  correctIndex: 1,
                  explanation: "Variety encompasses handling structured, semi-structured, and unstructured data formats together."
                },
                {
                  id: "q_3",
                  question: "Why does 'Veracity' become more difficult to guarantee as volume and variety increase?",
                  options: [
                    "Data sources become more distributed and prone to bias, noise, or transmission errors",
                    "Databases cannot store floating-point numbers",
                    "Network bandwidth is too expensive",
                    "Python cannot clean data"
                  ],
                  correctIndex: 0,
                  explanation: "With millions of diverse input sources, data quality, bias detection, and schema validation require automated pipelines to guarantee veracity."
                }
              ]
            }
          ]
        },
        {
          id: "les_1_2",
          title: "1.2 The Modern Data Science Toolkit & Architecture",
          type: "READING",
          order: 2,
          estimatedMinutes: 25,
          heroImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Explore the 6 key stages of the modern data science pipeline",
            "Launch an interactive Google Colab environment for cloud development",
            "Download sample starter datasets and project notebook templates"
          ],
          subLessons: [
            {
              id: "sub_1_2_1",
              sectionNumber: "1.2.1",
              title: "The Data Science Pipeline Overview",
              type: "READING",
              content: `A successful data science initiative follows an iterative engineering lifecycle:

1. **Problem Definition** — Clarifying business questions, key performance indicators (KPIs), and target metrics.
2. **Data Ingestion & Extraction** — Retrieving structured data via SQL, pulling streaming feeds from message queues, or calling external REST APIs.
3. **Cleaning & Preprocessing** — Handling missing values, standardizing datetime fields, removing outliers, and encoding categorical dimensions.
4. **Exploratory Data Analysis (EDA)** — Computing descriptive statistics, calculating correlations, and producing multi-variable visual charts.
5. **Statistical Modeling & ML** — Training baseline regression or classification models, optimizing hyperparameters, and evaluating validation loss.
6. **Deployment & Storytelling** — Integrating trained models into API endpoints, dashboards, and executive reporting decks.`
            },
            {
              id: "sub_1_2_2",
              sectionNumber: "1.2.2",
              title: "Video Tour: The Data Science Toolkit",
              type: "VIDEO",
              videoUrl: "https://www.youtube.com/watch?v=ua-CiDNNj30",
              content: "Watch this comprehensive walkthrough introducing the primary languages and libraries of the data science landscape: Python, Pandas, Jupyter, and SQL."
            },
            {
              id: "sub_1_2_3",
              sectionNumber: "1.2.3",
              title: "Launch Interactive Cloud Notebook",
              type: "EXTERNAL_RESOURCE",
              content: "Launch Google Colab with pre-installed data science packages (NumPy, Pandas, Scikit-learn, Matplotlib). All exercises can be run directly in your browser without local installation.",
              provider: "Google Colab",
              externalUrl: "https://colab.research.google.com/notebooks/intro.ipynb"
            },
            {
              id: "sub_1_2_4",
              sectionNumber: "1.2.4",
              title: "Download Starter Assets & Cheat Sheets",
              type: "DOWNLOADABLE",
              content: "Download the complete Data Science Foundations starter pack containing sample retail datasets, Jupyter notebook templates, and Python syntax cheat sheets.",
              fileName: "data_science_foundations_starter_pack.zip",
              fileType: "ZIP Archive (Notebooks + Datasets)",
              downloadUrl: "https://raw.githubusercontent.com/datasets/retail-data/master/data.csv"
            }
          ]
        }
      ]
    },
    {
      id: "mod_2",
      title: "Module 2: Python Programming for Data Engineers",
      description: "Master Python fundamentals, control flow logic, data structures, and interactive data manipulation coding challenges.",
      order: 2,
      lessons: [
        {
          id: "les_2_1",
          title: "2.1 Python Variables, Control Flow & Data Logic",
          type: "READING",
          order: 1,
          estimatedMinutes: 35,
          heroImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Declare and cast Python variables across numeric, string, and boolean types",
            "Construct conditional if-elif-else statements for data classification",
            "Write and test runnable Python code in the interactive lab editor",
            "Validate logic using unit assertions and diagnostic console outputs"
          ],
          subLessons: [
            {
              id: "sub_2_1_1",
              sectionNumber: "2.1.1",
              title: "Variables, Types & Operators",
              type: "READING",
              content: `Python is the standard language for data science due to its clean syntax and extensive ecosystem.

### Core Numeric & Text Types
\`\`\`python
# String & integer assignments
dataset_name = "Global Retail Transactions"
total_records = 150000
conversion_rate = 0.0428  # float
is_validated = True       # bool

# Dynamic formatting
print(f"Dataset '{dataset_name}' contains {total_records:,} records.")
\`\`\`

Python handles type coercion automatically, but in data engineering, explicit casting ensures precision when loading data from CSVs or API responses.`
            },
            {
              id: "sub_2_1_2",
              sectionNumber: "2.1.2",
              title: "Video Lecture: Conditional Logic & Branching",
              type: "VIDEO",
              videoUrl: "https://www.youtube.com/watch?v=Z1Yd7upQsXY",
              content: "Watch how conditional branching is used to clean records, categorize customer tiers, and handle null values gracefully in Python scripts."
            },
            {
              id: "sub_2_1_3",
              sectionNumber: "2.1.3",
              title: "Python Coding Lab: Customer Tier Classifier",
              type: "CODING_EXERCISE",
              content: `### Problem Statement:
Write a function \`classify_customer(spend_amount, visit_count)\` that assigns a loyalty tier to shoppers according to these business rules:
- If \`spend_amount >= 1000\` and \`visit_count >= 10\`: Return \`"PLATINUM"\`
- Else if \`spend_amount >= 500\` or \`visit_count >= 5\`: Return \`"GOLD"\`
- Else if \`spend_amount > 100\`: Return \`"SILVER"\`
- Otherwise: Return \`"STANDARD"\`

Click **Run Solution** below to test your script against the verification test suite.`,
              starterCode: `# Interactive Python Coding Challenge
def classify_customer(spend_amount: float, visit_count: int) -> str:
    """Classifies a customer into PLATINUM, GOLD, SILVER, or STANDARD tier."""
    if spend_amount >= 1000 and visit_count >= 10:
        return "PLATINUM"
    elif spend_amount >= 500 or visit_count >= 5:
        return "GOLD"
    elif spend_amount > 100:
        return "SILVER"
    else:
        return "STANDARD"

# Test cases
test_cases = [
    (1250.0, 15, "PLATINUM"),
    (600.0, 3, "GOLD"),
    (250.0, 2, "SILVER"),
    (45.0, 1, "STANDARD")
]

for spend, visits, expected in test_cases:
    result = classify_customer(spend, visits)
    assert result == expected, f"Failed for spend={spend}: expected {expected}, got {result}"
    print(f"✓ Passed test: spend=\${spend}, visits={visits} => {result}")
`,
              solutionHint: "Use standard if-elif-else chaining. Check the PLATINUM condition first since it requires both conditions (and) to be met."
            },
            {
              id: "sub_2_1_4",
              sectionNumber: "2.1.4",
              title: "Practice Scenario: Debugging Loop Logic",
              type: "PRACTICE",
              content: "Test your analytical skills by evaluating this data extraction loop snippet.",
              practiceQuiz: {
                prompt: "Consider a loop iterating over daily transactions `[120, -5, 300, 0, 450]`. What happens if we use `if amount <= 0: continue`?",
                scenarios: [
                  {
                    id: "sc_py_1",
                    text: "What will be the effect of `continue` when the loop encounters `-5`?",
                    options: [
                      "Terminates the loop entirely",
                      "Skips the rest of the current iteration and advances to 300",
                      "Raises a ValueError exception",
                      "Sets the total to zero"
                    ],
                    correctAnswer: "Skips the rest of the current iteration and advances to 300",
                    explanation: "The `continue` keyword bypasses the remaining body of the loop for negative or zero amounts and immediately starts the next iteration."
                  }
                ]
              }
            },
            {
              id: "sub_2_1_5",
              sectionNumber: "2.1.5",
              title: "Quiz: Python Control Flow & Functions",
              type: "QUIZ",
              content: "Verify your mastery of Python operators and condition evaluation.",
              passingScore: 75,
              quizQuestions: [
                {
                  id: "q_py_1",
                  question: "What is the result of `10 // 3` in Python?",
                  options: ["3.3333", "3", "1", "3.0"],
                  correctIndex: 1,
                  explanation: "The `//` operator performs floor (integer) division, truncating any fractional remainder."
                },
                {
                  id: "q_py_2",
                  question: "Which collection data type in Python is ordered, mutable, and allows duplicate elements?",
                  options: ["Tuple", "Set", "List", "Dictionary"],
                  correctIndex: 2,
                  explanation: "Lists `[1, 2, 3]` are mutable, ordered sequences that allow duplicate items."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "mod_3",
      title: "Module 3: Working with Data Using Pandas",
      description: "Learn to load, clean, transform, and aggregate structured datasets using Pandas DataFrames.",
      order: 3,
      lessons: [
        {
          id: "les_3_1",
          title: "3.1 DataFrames, Selection & Aggregations",
          type: "READING",
          order: 1,
          estimatedMinutes: 30,
          heroImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Construct and index Pandas DataFrames from dictionaries and CSV files",
            "Perform multi-condition boolean filtering with .loc and .iloc",
            "Calculate grouped summary statistics with .groupby() and .agg()",
            "Execute live data transformations in the interactive Python lab"
          ],
          subLessons: [
            {
              id: "sub_3_1_1",
              sectionNumber: "3.1.1",
              title: "Pandas Series & DataFrame Architecture",
              type: "READING",
              content: `Pandas provides two primary data structures:
- **Series**: A 1-dimensional labeled array capable of holding any data type.
- **DataFrame**: A 2-dimensional labeled data structure with columns of potentially different types, analogous to an in-memory SQL table.

\`\`\`python
import pandas as pd

# Creating a DataFrame from raw records
data = {
    'employee_id': [101, 102, 103, 104, 105],
    'department': ['Data', 'Engineering', 'Data', 'Product', 'Engineering'],
    'salary': [92000, 105000, 88000, 97000, 112000],
    'years_exp': [3, 5, 2, 4, 7]
}

df = pd.DataFrame(data)
print(df.describe())
\`\`\``
            },
            {
              id: "sub_3_1_2",
              sectionNumber: "3.1.2",
              title: "Python Lab: Filtering & Grouping Employee Data",
              type: "CODING_EXERCISE",
              content: `### Lab Challenge:
Using the starter code below, compute:
1. Filter employees with salary > 90,000.
2. Group by department and compute the mean salary and total headcount.`,
              starterCode: `import pandas as pd

# Employee dataset
df = pd.DataFrame({
    'employee_id': [101, 102, 103, 104, 105],
    'department': ['Data', 'Engineering', 'Data', 'Product', 'Engineering'],
    'salary': [92000, 105000, 88000, 97000, 112000],
    'years_exp': [3, 5, 2, 4, 7]
})

# 1. Filter high earners
high_earners = df[df['salary'] > 90000]

# 2. GroupBy department
dept_summary = df.groupby('department').agg(
    avg_salary=('salary', 'mean'),
    headcount=('employee_id', 'count')
).reset_index()

print("High Earners (> \$90k):")
print(high_earners[['employee_id', 'department', 'salary']])

print("\\nDepartment Summary:")
print(dept_summary)
`,
              solutionHint: "Use df[df['salary'] > 90000] for filtering, and df.groupby('department').agg(...) for grouping."
            },
            {
              id: "sub_3_1_3",
              sectionNumber: "3.1.3",
              title: "Download Sample E-Commerce Dataset",
              type: "DOWNLOADABLE",
              content: "Download the sample transactions CSV (5,000 rows) containing order dates, customer IDs, product categories, and amounts to practice offline.",
              fileName: "ecommerce_transactions_sample.csv",
              fileType: "CSV Dataset",
              downloadUrl: "https://raw.githubusercontent.com/datasets/retail-data/master/data.csv"
            },
            {
              id: "sub_3_1_4",
              sectionNumber: "3.1.4",
              title: "Pandas Mastery Quiz",
              type: "QUIZ",
              content: "Verify your knowledge of Pandas indexing, methods, and grouping syntax.",
              passingScore: 70,
              quizQuestions: [
                {
                  id: "q_pd_1",
                  question: "What is the difference between .loc and .iloc in Pandas?",
                  options: [
                    ".loc selects by label/name, while .iloc selects by integer position",
                    ".loc is for rows only, while .iloc is for columns only",
                    ".loc runs on GPU, while .iloc runs on CPU",
                    "There is no difference"
                  ],
                  correctIndex: 0,
                  explanation: ".loc relies on label-based indexing, whereas .iloc uses 0-based integer position."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "mod_4",
      title: "Module 4: SQL Fundamentals & Relational Databases",
      description: "Learn to query relational databases, apply filters, compute aggregates, and join multi-table datasets with SQL.",
      order: 4,
      lessons: [
        {
          id: "les_4_1",
          title: "4.1 Relational Queries, Joins & Aggregations",
          type: "READING",
          order: 1,
          estimatedMinutes: 35,
          heroImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Write standard SELECT queries with WHERE filters and ORDER BY",
            "Perform aggregate calculations with COUNT, SUM, AVG, and GROUP BY",
            "Execute SQL queries against the live schema in the interactive SQL lab",
            "Differentiate between INNER JOIN, LEFT JOIN, and outer joins"
          ],
          subLessons: [
            {
              id: "sub_4_1_1",
              sectionNumber: "4.1.1",
              title: "Relational Databases & SQL Syntax",
              type: "READING",
              content: `Structured Query Language (SQL) is the universal tool for retrieving data from relational databases like PostgreSQL, MySQL, and Snowflake.

### Core Query Structure
\`\`\`sql
SELECT 
    customer_id, 
    COUNT(order_id) AS total_orders, 
    SUM(total_amount) AS lifetime_value
FROM orders
WHERE status = 'COMPLETED'
GROUP BY customer_id
HAVING SUM(total_amount) > 1000
ORDER BY lifetime_value DESC
LIMIT 10;
\`\`\`

The database query engine evaluates queries in a specific logical order: **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**.`
            },
            {
              id: "sub_4_1_2",
              sectionNumber: "4.1.2",
              title: "Video Walkthrough: Mastering SQL Joins",
              type: "VIDEO",
              videoUrl: "https://www.youtube.com/watch?v=9yeOJ0ZMUuz",
              content: "Watch how INNER JOIN, LEFT JOIN, and FULL JOIN operate visually when combining customer records with transactional order lines."
            },
            {
              id: "sub_4_1_3",
              sectionNumber: "4.1.3",
              title: "Interactive SQL Lab: Customer Revenue Analysis",
              type: "SQL_EXERCISE",
              content: `### Query Challenge:
Write a query against the \`customers\` and \`orders\` tables to calculate total revenue per business segment. Only include completed orders, and order results by revenue descending.`,
              starterSql: `-- SQL Lab: Revenue by Business Segment
SELECT 
    c.segment,
    COUNT(o.id) AS total_orders,
    SUM(o.amount) AS total_revenue
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'COMPLETED'
GROUP BY c.segment
ORDER BY total_revenue DESC;
`,
              schemaContext: `-- Database Schema:
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  segment VARCHAR(50) -- 'Enterprise', 'Mid-Market', 'SMB'
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  amount DECIMAL(10,2),
  status VARCHAR(20) -- 'COMPLETED', 'PENDING', 'CANCELLED'
);`,
              solutionHint: "Join customers c with orders o on c.id = o.customer_id. Group by c.segment."
            },
            {
              id: "sub_4_1_4",
              sectionNumber: "4.1.4",
              title: "SQL Querying Mastery Quiz",
              type: "QUIZ",
              content: "Verify your understanding of SQL grouping and join logic.",
              passingScore: 75,
              quizQuestions: [
                {
                  id: "q_sql_1",
                  question: "What is the primary difference between WHERE and HAVING in SQL?",
                  options: [
                    "WHERE filters individual rows before grouping; HAVING filters aggregated groups after GROUP BY",
                    "WHERE is only for numbers; HAVING is for text",
                    "WHERE can only be used with SELECT *",
                    "There is no difference"
                  ],
                  correctIndex: 0,
                  explanation: "WHERE applies to individual rows prior to grouping, while HAVING filters the aggregated summary groups."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "mod_5",
      title: "Module 5: Capstone Practical Project",
      description: "Synthesize all skills learned across data ingestion, exploratory analysis, Python, and SQL to complete an end-to-end portfolio project.",
      order: 5,
      lessons: [
        {
          id: "les_5_1",
          title: "5.1 Capstone Project: End-to-End Analytics Pipeline",
          type: "READING",
          order: 1,
          estimatedMinutes: 60,
          heroImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&auto=format&fit=crop&q=80",
          learningObjectives: [
            "Ingest and validate customer transaction data from CSV datasets",
            "Perform systematic exploratory data analysis with descriptive statistics",
            "Construct a reproducible Python notebook or script documenting all findings",
            "Submit your portfolio repository for tutor review and feedback"
          ],
          subLessons: [
            {
              id: "sub_5_1_1",
              sectionNumber: "5.1.1",
              title: "Capstone Project Brief & Grading Rubric",
              type: "READING",
              content: `### Objective:
Conduct an end-to-end data analysis on the provided Customer Purchase dataset and produce an executive findings report with visualizations.

### Evaluation Rubric (100 Points Total, Pass mark: 70):
1. **Data Cleaning & Schema Validation** (25 pts) — Handling missing values, casting data types, and identifying duplicate records.
2. **Exploratory Data Analysis** (25 pts) — Descriptive statistical metrics, outlier detection, and correlation analysis.
3. **Visualization & Storytelling** (25 pts) — Producing at least 4 clear charts with labels and narrative takeaways.
4. **Code Quality & Documentation** (25 pts) — Clean Python code following PEP 8 conventions with markdown commentary.`
            },
            {
              id: "sub_5_1_2",
              sectionNumber: "5.1.2",
              title: "Download Project Dataset & Starter Notebook",
              type: "DOWNLOADABLE",
              content: "Download the complete capstone asset bundle containing the customer transaction dataset (500 records) and the structured Jupyter starter notebook.",
              fileName: "capstone_customer_analytics_bundle.zip",
              fileType: "ZIP Archive",
              downloadUrl: "https://raw.githubusercontent.com/datasets/retail-data/master/data.csv"
            },
            {
              id: "sub_5_1_3",
              sectionNumber: "5.1.3",
              title: "External Repository Template",
              type: "EXTERNAL_RESOURCE",
              content: "Clone our GitHub starter template repository with pre-configured project folders, virtual environment configs, and evaluation checks.",
              provider: "GitHub",
              externalUrl: "https://github.com/data-academy/data-science-capstone-template"
            },
            {
              id: "sub_5_1_4",
              sectionNumber: "5.1.4",
              title: "Capstone Submission & Verification",
              type: "PROJECT",
              content: "Submit your completed project repository link or Google Colab URL below. Your tutor will review your code according to the rubric.",
              deliverables: "1. Cleaned dataset summary\n2. Jupyter Notebook with 4+ charts\n3. Written executive summary (300 words)\n4. GitHub or Colab URL",
              starterRepoUrl: "https://github.com/data-academy/data-science-capstone-template",
              maxScore: 100
            }
          ]
        }
      ]
    }
  ]
};
