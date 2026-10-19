/**
 * Data Academy — Database Seed
 * Seeds: admin user, demo tutor, "Data Science Foundations" course (10 modules)
 * Run with: npm run db:seed
 */

import { PrismaClient, LessonType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Data Academy database…");

  // ── 1. Platform settings ──────────────────────────────────────────
  await prisma.platformSetting.upsert({
    where: { key: "platform_name" },
    update: {},
    create: { key: "platform_name", value: "Data Academy", type: "string", label: "Platform Name" },
  });

  // ── 2. Categories ─────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.courseCategory.upsert({ where: { slug: "data-science" },    update: {}, create: { name: "Data Science",              slug: "data-science",    icon: "🔬" } }),
    prisma.courseCategory.upsert({ where: { slug: "data-analytics" },  update: {}, create: { name: "Data Analytics",            slug: "data-analytics",  icon: "📊" } }),
    prisma.courseCategory.upsert({ where: { slug: "ai-ml" },           update: {}, create: { name: "AI & Machine Learning",     slug: "ai-ml",           icon: "🤖" } }),
    prisma.courseCategory.upsert({ where: { slug: "python" },          update: {}, create: { name: "Python Programming",         slug: "python",          icon: "🐍" } }),
    prisma.courseCategory.upsert({ where: { slug: "sql-databases" },   update: {}, create: { name: "SQL & Databases",           slug: "sql-databases",   icon: "🗄️" } }),
    prisma.courseCategory.upsert({ where: { slug: "bi-visualization" }, update: {}, create: { name: "Business Intelligence",     slug: "bi-visualization", icon: "📈" } }),
  ]);

  console.log(`✅ ${categories.length} categories created`);

  // ── 3. Admin user ─────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("Admin@DataAcademy2024!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dataacademy.io" },
    update: {},
    create: {
      email: "admin@dataacademy.io",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      profile: {
        create: { firstName: "Platform", lastName: "Admin" },
      },
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ── 4. Demo tutor ─────────────────────────────────────────────────
  const tutorPasswordHash = await bcrypt.hash("Tutor@DataAcademy2024!", 12);
  const tutor = await prisma.user.upsert({
    where: { email: "demo.tutor@dataacademy.io" },
    update: {},
    create: {
      email: "demo.tutor@dataacademy.io",
      passwordHash: tutorPasswordHash,
      role: "TUTOR",
      profile: {
        create: { firstName: "Alex", lastName: "Morgan", bio: "Senior Data Scientist with 10+ years of experience in Python, machine learning, and data engineering." },
      },
      tutorProfile: {
        create: {
          headline: "Senior Data Scientist & Educator",
          expertise: ["Python", "Machine Learning", "Data Science", "Statistics", "SQL"],
          biography: "Alex has worked with data teams at leading tech companies and now focuses on making data skills accessible to everyone through structured, practical education.",
          isApproved: true,
        },
      },
    },
  });
  console.log(`✅ Tutor user: ${tutor.email}`);

  // ── 5. Demo student ───────────────────────────────────────────────
  const studentPasswordHash = await bcrypt.hash("Student@DataAcademy2024!", 12);
  const student = await prisma.user.upsert({
    where: { email: "demo.student@dataacademy.io" },
    update: {},
    create: {
      email: "demo.student@dataacademy.io",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      profile: {
        create: { firstName: "Sam", lastName: "Learner", bio: "Aspiring data analyst passionate about turning data into insights." },
      },
    },
  });
  console.log(`✅ Student user: ${student.email}`);

  // ── 6. Learning paths ─────────────────────────────────────────────
  const paths = await Promise.all([
    prisma.learningPath.upsert({ where: { slug: "data-analytics" }, update: {}, create: { title: "Data Analytics",          slug: "data-analytics",  description: "Master data analysis techniques for business insights.",      icon: "📊", color: "#3b82f6", isPublished: true, order: 1 } }),
    prisma.learningPath.upsert({ where: { slug: "data-science" },   update: {}, create: { title: "Data Science",            slug: "data-science",    description: "Build statistical and ML skills for data-driven decisions.", icon: "🔬", color: "#6366f1", isPublished: true, order: 2 } }),
    prisma.learningPath.upsert({ where: { slug: "ai" },             update: {}, create: { title: "Artificial Intelligence",  slug: "ai",              description: "Understand and build AI systems from the ground up.",         icon: "🤖", color: "#8b5cf6", isPublished: true, order: 3 } }),
    prisma.learningPath.upsert({ where: { slug: "machine-learning" }, update: {}, create: { title: "Machine Learning",      slug: "machine-learning", description: "Train, evaluate, and deploy predictive ML models.",           icon: "🧠", color: "#06b6d4", isPublished: true, order: 4 } }),
    prisma.learningPath.upsert({ where: { slug: "python" },         update: {}, create: { title: "Python Programming",       slug: "python",          description: "Learn Python from fundamentals to advanced data engineering.", icon: "🐍", color: "#10b981", isPublished: true, order: 5 } }),
    prisma.learningPath.upsert({ where: { slug: "sql" },            update: {}, create: { title: "SQL & Databases",          slug: "sql",             description: "Query, design, and optimize relational databases.",            icon: "🗄️", color: "#f59e0b", isPublished: true, order: 6 } }),
    prisma.learningPath.upsert({ where: { slug: "bi" },             update: {}, create: { title: "Business Intelligence",    slug: "bi",              description: "Build dashboards and tell compelling data stories.",           icon: "📈", color: "#ef4444", isPublished: true, order: 7 } }),
  ]);
  console.log(`✅ ${paths.length} learning paths created`);

  // ── 7. Data Science Foundations course ────────────────────────────
  const existingCourse = await prisma.course.findUnique({ where: { slug: "data-science-foundations" } });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        title: "Data Science Foundations",
        slug: "data-science-foundations",
        shortDescription: "A comprehensive beginner course covering Python, data analysis, statistics, visualization, SQL, and an introduction to machine learning.",
        fullDescription: `This course is your complete starting point for a career in data science. Over 10 structured modules, you will learn the foundational skills that every data professional needs — from writing your first Python script to building your first machine learning model.

Each module combines video lessons, reading material, interactive coding exercises, and quizzes. The course culminates in a final practical project where you will apply everything you have learned to a real dataset.

**What you will learn:**
- Python programming for data science
- Data manipulation with Pandas and NumPy
- Data cleaning and preparation techniques
- Exploratory data analysis
- Data visualization with Matplotlib and Seaborn
- SQL fundamentals for data querying
- Core statistical concepts for data analysis
- Introduction to machine learning with scikit-learn

**Who this course is for:**
This course is designed for complete beginners — no prior programming or statistics experience required. If you can use a web browser and have a curiosity about data, you are ready.`,
        categoryId: categories[0].id, // Data Science
        level: "BEGINNER",
        estimatedHours: 40,
        isFree: true,
        status: "PUBLISHED",
        isFeatured: true,
        prerequisites: [],
        learningOutcomes: [
          "Write Python code for data analysis tasks",
          "Load, clean, and transform datasets using Pandas",
          "Create informative data visualizations",
          "Write SQL queries to explore and aggregate data",
          "Apply descriptive statistics to understand data",
          "Build and evaluate a basic machine learning model",
          "Complete an end-to-end data science project",
        ],
        tags: ["python", "data science", "pandas", "sql", "machine learning", "beginner"],
        certificateEnabled: true,
        completionThreshold: 0.8,
        instructors: {
          create: {
            userId: tutor.id,
            tutorId: (await prisma.tutorProfile.findUnique({ where: { userId: tutor.id } }))?.id,
            isPrimary: true,
          },
        },
      },
    });

    // ── Modules & Lessons ─────────────────────────────────────────
    const moduleData = [
      {
        title: "Introduction to Data Science",
        description: "Understand what data science is, why it matters, and how this course will help you build a solid foundation.",
        order: 1,
        lessons: [
          { title: "What is Data Science?", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 20, content: "## What is Data Science?\n\nData science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data.\n\n### Key Components\n\n- **Statistics & Mathematics** — the foundation for understanding data\n- **Programming** — turning ideas into working analyses\n- **Domain Knowledge** — understanding the problem context\n- **Communication** — conveying insights clearly\n\n### The Data Science Workflow\n\n1. Define the problem\n2. Collect and prepare data\n3. Explore and analyze\n4. Model and predict\n5. Communicate results\n6. Deploy and monitor\n\n### Why Learn Data Science?\n\nData science is one of the fastest-growing fields. Organizations in every industry need professionals who can turn raw data into actionable decisions.", learningObjectives: ["Define data science and its key components", "Describe the data science workflow", "Identify real-world applications of data science"] },
          { title: "The Data Science Toolkit", type: "READING" as LessonType, order: 2, estimatedMinutes: 15, content: "## Your Data Science Toolkit\n\nIn this course you will work with the following tools:\n\n### Python\nPython is the most popular language for data science. It is readable, powerful, and has an enormous ecosystem of libraries.\n\n### Key Libraries\n- **NumPy** — numerical computation\n- **Pandas** — data manipulation and analysis\n- **Matplotlib/Seaborn** — data visualization\n- **Scikit-learn** — machine learning\n\n### Jupyter Notebooks\nJupyter notebooks allow you to combine code, output, and explanations in a single document — perfect for data exploration and sharing analyses.\n\n### SQL\nSQL (Structured Query Language) is essential for retrieving and transforming data from databases.", learningObjectives: ["Identify the key tools used in data science", "Understand the role of Python in data analysis", "Recognise when to use SQL versus Python"] },
          { title: "Setting Up Your Environment", type: "READING" as LessonType, order: 3, estimatedMinutes: 10, content: "## Setting Up Your Environment\n\nFor this course, all coding exercises run directly in your browser — no installation required.\n\nFor your own projects outside the course, we recommend:\n\n1. Install **Python 3.10+** from python.org\n2. Install **Anaconda** (includes Python, Jupyter, and all key libraries)\n3. Use **VS Code** with the Python extension for script development\n\nThe browser-based environment in this course is pre-configured with all necessary libraries.", learningObjectives: ["Understand the course coding environment", "Know how to set up a local data science environment"] },
          { title: "Module 1 Quiz", type: "QUIZ" as LessonType, order: 4, estimatedMinutes: 10, learningObjectives: ["Test understanding of data science fundamentals"] },
        ],
      },
      {
        title: "Python Programming Fundamentals",
        description: "Build a solid Python foundation covering variables, data types, control flow, functions, and working with data structures.",
        order: 2,
        lessons: [
          { title: "Python Basics: Variables and Data Types", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 30, content: "## Python Basics\n\n### Variables\n```python\nname = 'Data Academy'\nage = 5\npi = 3.14159\nis_active = True\n```\n\n### Data Types\n- `str` — text\n- `int` — integers\n- `float` — decimal numbers\n- `bool` — True or False\n- `list` — ordered collection\n- `dict` — key-value pairs\n\n### Basic Operations\n```python\n# Arithmetic\nresult = 10 + 5   # 15\nproduct = 3 * 4   # 12\ndivision = 10 / 3 # 3.333...\nfloor_div = 10 // 3  # 3\nremainder = 10 % 3   # 1\npower = 2 ** 10   # 1024\n```", learningObjectives: ["Declare variables in Python", "Use Python's basic data types", "Perform arithmetic operations"] },
          { title: "Control Flow: If, For, While", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 30, content: "## Control Flow\n\n### If Statements\n```python\nscore = 85\n\nif score >= 90:\n    grade = 'A'\nelif score >= 80:\n    grade = 'B'\nelif score >= 70:\n    grade = 'C'\nelse:\n    grade = 'F'\n\nprint(f'Grade: {grade}')\n```\n\n### For Loops\n```python\nsubjects = ['Python', 'SQL', 'Statistics', 'ML']\nfor subject in subjects:\n    print(f'Learning: {subject}')\n\n# Range\nfor i in range(1, 6):\n    print(i)  # 1 2 3 4 5\n```\n\n### While Loops\n```python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n```", learningObjectives: ["Write conditional logic with if/elif/else", "Use for loops to iterate over sequences", "Use while loops for repeated execution"] },
          { title: "Functions and Modules", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 30, content: "## Functions\n\n```python\ndef calculate_average(numbers):\n    \"\"\"Calculate the average of a list of numbers.\"\"\"\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n\nscores = [85, 92, 78, 96, 88]\navg = calculate_average(scores)\nprint(f'Average score: {avg:.1f}')  # 87.8\n```\n\n### Lambda Functions\n```python\ndouble = lambda x: x * 2\nprint(double(5))  # 10\n```\n\n### Importing Modules\n```python\nimport math\nimport statistics\n\ndata = [4, 7, 2, 9, 1, 6]\nprint(math.sqrt(16))           # 4.0\nprint(statistics.mean(data))    # 4.83\nprint(statistics.stdev(data))   # 2.93\n```", learningObjectives: ["Define and call Python functions", "Use built-in Python modules", "Apply lambda functions for simple transformations"] },
          { title: "Python Coding Exercise", type: "CODING_EXERCISE" as LessonType, order: 4, estimatedMinutes: 20, content: "Complete the coding exercise to practice Python fundamentals.", learningObjectives: ["Apply Python basics in a practical exercise"] },
          { title: "Module 2 Quiz", type: "QUIZ" as LessonType, order: 5, estimatedMinutes: 10, learningObjectives: ["Test Python programming knowledge"] },
        ],
      },
      {
        title: "Working with Data Using Pandas",
        description: "Learn to load, inspect, and manipulate structured data using Pandas DataFrames.",
        order: 3,
        lessons: [
          { title: "Introduction to Pandas", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 25, content: "## Pandas: The Data Analysis Library\n\n```python\nimport pandas as pd\nimport numpy as np\n\n# Create a DataFrame\ndata = {\n    'name': ['Alice', 'Bob', 'Carol', 'David'],\n    'age': [28, 34, 29, 41],\n    'salary': [62000, 78000, 55000, 95000],\n    'department': ['Engineering', 'Marketing', 'Engineering', 'Finance']\n}\n\ndf = pd.DataFrame(data)\nprint(df)\nprint(df.dtypes)\nprint(df.describe())\n```", learningObjectives: ["Create and load Pandas DataFrames", "Inspect DataFrame structure and data types", "Generate descriptive statistics"] },
          { title: "Selecting and Filtering Data", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 30, content: "## Selecting Data\n\n```python\n# Select columns\ndf['name']           # Single column (Series)\ndf[['name', 'salary']]  # Multiple columns (DataFrame)\n\n# Select rows\ndf.iloc[0]           # By position\ndf.loc[df.age > 30]  # By condition\n\n# Filtering\nengineers = df[df['department'] == 'Engineering']\nhigh_earners = df[df['salary'] > 70000]\n\n# Multiple conditions\nsenior_engineers = df[\n    (df['department'] == 'Engineering') & \n    (df['age'] > 30)\n]\n```", learningObjectives: ["Select rows and columns from DataFrames", "Filter DataFrames using conditions", "Combine multiple filter conditions"] },
          { title: "Grouping and Aggregation", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 25, content: "## GroupBy\n\n```python\n# Average salary by department\ndept_stats = df.groupby('department')['salary'].agg(['mean', 'min', 'max', 'count'])\nprint(dept_stats)\n\n# Multiple aggregations\nsummary = df.groupby('department').agg(\n    avg_salary=('salary', 'mean'),\n    avg_age=('age', 'mean'),\n    count=('name', 'count')\n)\nprint(summary)\n```", learningObjectives: ["Group data using groupby", "Apply aggregation functions", "Create summary statistics by group"] },
          { title: "Pandas Coding Exercise", type: "CODING_EXERCISE" as LessonType, order: 4, estimatedMinutes: 25, content: "Apply Pandas skills to analyse a sample dataset.", learningObjectives: ["Demonstrate Pandas data manipulation skills"] },
          { title: "Module 3 Quiz", type: "QUIZ" as LessonType, order: 5, estimatedMinutes: 10, learningObjectives: ["Test Pandas knowledge"] },
        ],
      },
      {
        title: "Data Cleaning and Preparation",
        description: "Handle missing values, fix data quality issues, and transform messy real-world data into analysis-ready datasets.",
        order: 4,
        lessons: [
          { title: "Identifying Data Quality Issues", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 20, content: "## Data Quality Dimensions\n\n1. **Completeness** — are there missing values?\n2. **Accuracy** — are the values correct?\n3. **Consistency** — are similar values formatted the same way?\n4. **Timeliness** — is the data current?\n5. **Validity** — do values fall within expected ranges?\n\n```python\n# Check for missing values\nprint(df.isnull().sum())\nprint(df.isnull().mean() * 100)  # Percentage missing\n\n# Check for duplicates\nprint(df.duplicated().sum())\n\n# Check data ranges\nprint(df.describe())\n```", learningObjectives: ["Identify common data quality problems", "Use Pandas to detect missing values and duplicates", "Assess data validity"] },
          { title: "Handling Missing Values", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 25, content: "## Strategies for Missing Data\n\n```python\n# Drop rows with missing values\ndf_clean = df.dropna()\n\n# Drop columns with too many missing values\ndf_clean = df.dropna(axis=1, thresh=len(df)*0.5)\n\n# Fill with a specific value\ndf['age'].fillna(0, inplace=True)\n\n# Fill with mean\ndf['salary'].fillna(df['salary'].mean(), inplace=True)\n\n# Forward/backward fill (for time series)\ndf['value'].fillna(method='ffill', inplace=True)\n```", learningObjectives: ["Choose an appropriate missing value strategy", "Use fillna and dropna correctly", "Understand imputation for numerical data"] },
          { title: "Data Transformation", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 25, content: "## Common Transformations\n\n```python\n# String cleaning\ndf['city'] = df['city'].str.strip().str.lower()\n\n# Date parsing\ndf['date'] = pd.to_datetime(df['date'])\ndf['year'] = df['date'].dt.year\ndf['month'] = df['date'].dt.month\n\n# Encoding categories\ndf['gender_encoded'] = (df['gender'] == 'M').astype(int)\n\n# Binning numerical data\ndf['age_group'] = pd.cut(\n    df['age'],\n    bins=[0, 25, 35, 50, 100],\n    labels=['<25', '25-35', '35-50', '50+']\n)\n```", learningObjectives: ["Clean text data in Pandas", "Parse and extract date components", "Encode categorical variables", "Bin continuous variables"] },
          { title: "Data Cleaning Assignment", type: "ASSIGNMENT" as LessonType, order: 4, estimatedMinutes: 45, content: "Clean a provided messy dataset and document your data preparation steps.", learningObjectives: ["Apply data cleaning techniques to a real dataset", "Document data quality issues and resolutions"] },
        ],
      },
      {
        title: "Exploratory Data Analysis",
        description: "Systematically investigate datasets to discover patterns, test assumptions, and form hypotheses before modelling.",
        order: 5,
        lessons: [
          { title: "The EDA Process", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 20, content: "## Exploratory Data Analysis (EDA)\n\nEDA is the process of examining a dataset to understand its structure, quality, and characteristics before formal modelling.\n\n### EDA Questions\n1. What are the variables and their types?\n2. What is the distribution of each variable?\n3. Are there missing values or outliers?\n4. How are variables correlated?\n5. Are there any interesting patterns or anomalies?\n\n```python\n# Quick overview\ndf.info()\ndf.describe()\ndf.head()\ndf.value_counts('category_col')\n```", learningObjectives: ["Describe the purpose of EDA", "Follow a systematic EDA process", "Formulate analytical questions from data"] },
          { title: "Univariate Analysis", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 25, content: "## Analysing Individual Variables\n\n```python\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Distribution of a numerical variable\nplt.figure(figsize=(10, 4))\nplt.subplot(1, 2, 1)\nsns.histplot(df['salary'], bins=20)\nplt.title('Salary Distribution')\n\nplt.subplot(1, 2, 2)\nsns.boxplot(y=df['salary'])\nplt.title('Salary Boxplot')\nplt.tight_layout()\nplt.show()\n\n# Categorical variable\ndf['department'].value_counts().plot(kind='bar')\n```", learningObjectives: ["Visualise distributions using histograms and boxplots", "Identify skewness and outliers visually", "Describe categorical data using frequency counts"] },
          { title: "Bivariate and Multivariate Analysis", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 30, content: "## Relationships Between Variables\n\n```python\n# Scatter plot\nplt.scatter(df['experience'], df['salary'], alpha=0.6)\nplt.xlabel('Years of Experience')\nplt.ylabel('Salary')\nplt.title('Experience vs. Salary')\nplt.show()\n\n# Correlation matrix\ncorrelation = df[numerical_cols].corr()\nsns.heatmap(correlation, annot=True, cmap='coolwarm', center=0)\nplt.title('Correlation Matrix')\nplt.show()\n\n# Pair plot\nsns.pairplot(df[['age', 'salary', 'experience']])\n```", learningObjectives: ["Create scatter plots to explore relationships", "Interpret a correlation matrix", "Use pair plots for multivariate exploration"] },
          { title: "EDA Project", type: "PROJECT" as LessonType, order: 4, estimatedMinutes: 90, content: "Conduct a complete EDA on a provided dataset and produce a structured report summarising your findings.", learningObjectives: ["Conduct end-to-end EDA independently", "Document analytical findings clearly", "Formulate data-driven insights"] },
        ],
      },
      {
        title: "Data Visualization",
        description: "Create clear, compelling, and accurate visual representations of data using Matplotlib and Seaborn.",
        order: 6,
        lessons: [
          { title: "Principles of Effective Visualization", type: "READING" as LessonType, order: 1, estimatedMinutes: 20, content: "## What Makes a Good Chart?\n\nEffective data visualisation follows clear principles:\n\n1. **Choose the right chart type** — bar for comparisons, line for trends, scatter for relationships\n2. **Label clearly** — always include axis labels, titles, and units\n3. **Use color purposefully** — don't add color without a reason\n4. **Avoid chartjunk** — remove unnecessary gridlines, borders, and decorations\n5. **Tell a story** — every chart should have a clear takeaway\n\n### Chart Type Guide\n- Bar chart → compare categories\n- Line chart → show change over time\n- Scatter plot → show correlation between two variables\n- Histogram → show distribution of a single variable\n- Heatmap → show correlation matrix or 2D density\n- Pie chart → use sparingly, only for part-to-whole relationships", learningObjectives: ["Apply principles of visual design to data charts", "Select appropriate chart types for different data scenarios", "Critique common visualization mistakes"] },
          { title: "Matplotlib Deep Dive", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 35, content: "## Matplotlib Fundamentals\n\n```python\nimport matplotlib.pyplot as plt\nimport numpy as np\n\nfig, axes = plt.subplots(2, 2, figsize=(12, 10))\n\n# Line chart\nx = np.linspace(0, 10, 100)\naxes[0, 0].plot(x, np.sin(x), label='sin(x)', color='#3b82f6')\naxes[0, 0].set_title('Sine Wave')\naxes[0, 0].legend()\n\n# Bar chart\ncategories = ['Q1', 'Q2', 'Q3', 'Q4']\nvalues = [120, 145, 162, 187]\naxes[0, 1].bar(categories, values, color='#6366f1')\naxes[0, 1].set_title('Quarterly Revenue')\n\nplt.tight_layout()\nplt.show()\n```", learningObjectives: ["Create multi-panel figures with subplots", "Customise chart colours, labels, and legends", "Save figures to files"] },
          { title: "Seaborn for Statistical Plots", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 30, content: "## Seaborn: Statistical Visualization\n\n```python\nimport seaborn as sns\n\n# Set style\nsns.set_theme(style='whitegrid', palette='muted')\n\n# Violin plot — distribution by category\nsns.violinplot(data=df, x='department', y='salary')\n\n# Regression plot\nsns.regplot(data=df, x='experience', y='salary')\n\n# Facet grid\ng = sns.FacetGrid(df, col='department', height=4)\ng.map(sns.histplot, 'salary', bins=15)\n```", learningObjectives: ["Use Seaborn for statistical visualizations", "Create violin plots, regression plots, and facet grids", "Apply themes and color palettes"] },
          { title: "Visualization Assignment", type: "ASSIGNMENT" as LessonType, order: 4, estimatedMinutes: 60, content: "Create a data story using a provided dataset. Produce at least 5 charts that together tell a coherent narrative.", learningObjectives: ["Produce a coherent data visualization report", "Select appropriate chart types for different insights", "Tell a compelling story with data"] },
        ],
      },
      {
        title: "SQL Fundamentals",
        description: "Learn to write SQL queries to retrieve, filter, aggregate, and join data from relational databases.",
        order: 7,
        lessons: [
          { title: "Introduction to SQL and Databases", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 20, content: "## SQL — Structured Query Language\n\nSQL is the standard language for communicating with relational databases. It is used to:\n- Query and retrieve data\n- Insert, update, and delete records\n- Create and modify database structures\n\n### Core Concepts\n\n- **Table** — rows and columns, like a spreadsheet\n- **Row** — a single record\n- **Column** — a field/attribute\n- **Primary Key** — a unique identifier for each row\n- **Foreign Key** — a column that links to another table\n\n### Basic SELECT\n```sql\nSELECT *\nFROM students\nWHERE enrollment_status = 'ACTIVE'\nORDER BY created_at DESC\nLIMIT 10;\n```", learningObjectives: ["Describe the role of SQL in data analysis", "Explain relational database concepts", "Write a basic SELECT statement"] },
          { title: "Filtering and Sorting", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 25, content: "## Filtering with WHERE\n\n```sql\n-- Comparison operators\nSELECT * FROM products WHERE price > 50;\nSELECT * FROM orders WHERE status = 'SHIPPED';\nSELECT * FROM users WHERE created_at >= '2024-01-01';\n\n-- AND, OR, NOT\nSELECT * FROM products \nWHERE category = 'Electronics' AND price < 100;\n\n-- IN and BETWEEN\nSELECT * FROM orders WHERE status IN ('PENDING', 'PROCESSING');\nSELECT * FROM products WHERE price BETWEEN 20 AND 80;\n\n-- LIKE for pattern matching\nSELECT * FROM customers WHERE email LIKE '%@gmail.com';\n\n-- ORDER BY\nSELECT * FROM products ORDER BY price DESC, name ASC;\n```", learningObjectives: ["Filter rows using WHERE conditions", "Use IN, BETWEEN, and LIKE operators", "Sort results with ORDER BY"] },
          { title: "Aggregation and GROUP BY", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 30, content: "## Aggregation Functions\n\n```sql\n-- COUNT, SUM, AVG, MIN, MAX\nSELECT \n    COUNT(*) AS total_orders,\n    SUM(amount) AS total_revenue,\n    AVG(amount) AS avg_order_value,\n    MIN(amount) AS smallest_order,\n    MAX(amount) AS largest_order\nFROM orders\nWHERE status = 'COMPLETED';\n\n-- GROUP BY\nSELECT \n    category,\n    COUNT(*) AS product_count,\n    AVG(price) AS avg_price\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 5\nORDER BY avg_price DESC;\n```", learningObjectives: ["Use COUNT, SUM, AVG, MIN, MAX", "Group results with GROUP BY", "Filter groups with HAVING"] },
          { title: "Joining Tables", type: "VIDEO_READING" as LessonType, order: 4, estimatedMinutes: 35, content: "## SQL Joins\n\n```sql\n-- INNER JOIN: rows matching in both tables\nSELECT \n    o.order_id,\n    c.name AS customer_name,\n    o.amount,\n    o.created_at\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.id;\n\n-- LEFT JOIN: all rows from left, matching from right\nSELECT \n    c.name,\n    COUNT(o.order_id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name\nORDER BY order_count DESC;\n```", learningObjectives: ["Explain the different types of SQL joins", "Write INNER JOIN and LEFT JOIN queries", "Join multiple tables to answer analytical questions"] },
          { title: "SQL Practice Exercise", type: "SQL_EXERCISE" as LessonType, order: 5, estimatedMinutes: 30, content: "Practice SQL queries on a provided database with real-world style data.", learningObjectives: ["Apply SQL skills in a practical exercise", "Query, filter, aggregate, and join data independently"] },
          { title: "Module 7 Quiz", type: "QUIZ" as LessonType, order: 6, estimatedMinutes: 15, learningObjectives: ["Test SQL knowledge"] },
        ],
      },
      {
        title: "Introduction to Statistics",
        description: "Build the statistical reasoning skills that underpin every area of data science and machine learning.",
        order: 8,
        lessons: [
          { title: "Descriptive Statistics", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 30, content: "## Describing Data with Numbers\n\n### Measures of Central Tendency\n- **Mean** — average value (sensitive to outliers)\n- **Median** — middle value (robust to outliers)\n- **Mode** — most common value\n\n```python\nimport numpy as np\nfrom scipy import stats\n\ndata = [12, 14, 18, 22, 14, 30, 14, 20, 18, 16]\n\nprint(f'Mean:   {np.mean(data):.2f}')    # 17.80\nprint(f'Median: {np.median(data):.2f}')  # 17.00\nprint(f'Mode:   {stats.mode(data).mode[0]}')  # 14\n```\n\n### Measures of Spread\n```python\nprint(f'Std Dev:  {np.std(data):.2f}')   # 5.18\nprint(f'Variance: {np.var(data):.2f}')   # 26.86\nprint(f'Range:    {np.ptp(data)}'    )    # 18\nprint(f'IQR:      {np.percentile(data, 75) - np.percentile(data, 25)}')  # 6\n```", learningObjectives: ["Calculate mean, median, and mode", "Calculate standard deviation and variance", "Explain when to use mean vs. median"] },
          { title: "Probability Fundamentals", type: "READING" as LessonType, order: 2, estimatedMinutes: 25, content: "## Probability Basics\n\nProbability measures how likely an event is to occur.\n\n### Key Rules\n- **Addition rule:** P(A or B) = P(A) + P(B) – P(A and B)\n- **Multiplication rule:** P(A and B) = P(A) × P(B|A)\n- **Complement:** P(not A) = 1 – P(A)\n\n### Probability Distributions\n- **Normal distribution** — bell curve, symmetric, defined by mean and std\n- **Binomial distribution** — discrete, counts successes in n trials\n- **Poisson distribution** — counts events in a fixed interval\n\n```python\nfrom scipy.stats import norm\n\n# What % of values fall within 1 std of the mean?\nprint(norm.cdf(1) - norm.cdf(-1))  # 0.683 = 68.3%\n```", learningObjectives: ["Apply basic probability rules", "Describe the normal distribution", "Understand how probability underpins statistics"] },
          { title: "Hypothesis Testing", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 35, content: "## Hypothesis Testing\n\nHypothesis testing is a framework for making decisions about data using probability.\n\n### Steps\n1. State the null hypothesis (H₀) and alternative (H₁)\n2. Choose a significance level (α, usually 0.05)\n3. Collect data and compute the test statistic\n4. Calculate the p-value\n5. Reject H₀ if p-value < α\n\n```python\nfrom scipy import stats\n\n# Are the means of two groups significantly different?\ngroup_a = [85, 88, 90, 78, 92, 87, 82]\ngroup_b = [79, 75, 82, 73, 80, 77, 81]\n\nt_stat, p_value = stats.ttest_ind(group_a, group_b)\nprint(f't-statistic: {t_stat:.3f}')\nprint(f'p-value: {p_value:.3f}')\n\nif p_value < 0.05:\n    print('Reject H₀ — the difference is statistically significant')\nelse:\n    print('Fail to reject H₀ — no significant difference found')\n```", learningObjectives: ["State null and alternative hypotheses", "Interpret p-values and significance levels", "Conduct a t-test using Python"] },
          { title: "Statistics Quiz", type: "QUIZ" as LessonType, order: 4, estimatedMinutes: 15, learningObjectives: ["Test statistics knowledge"] },
        ],
      },
      {
        title: "Introduction to Machine Learning",
        description: "Understand the ML lifecycle and build your first supervised learning models using scikit-learn.",
        order: 9,
        lessons: [
          { title: "What is Machine Learning?", type: "VIDEO_READING" as LessonType, order: 1, estimatedMinutes: 25, content: "## Machine Learning Overview\n\nMachine learning is a subset of AI that enables systems to learn from data without being explicitly programmed.\n\n### Types of Machine Learning\n\n**Supervised Learning** — labeled training data\n- Classification: predicting a category (spam/not spam)\n- Regression: predicting a number (house price)\n\n**Unsupervised Learning** — no labels\n- Clustering: grouping similar items\n- Dimensionality reduction: simplifying data\n\n**Reinforcement Learning** — learning from rewards\n\n### The ML Workflow\n1. Define the problem\n2. Collect and prepare data\n3. Select and train a model\n4. Evaluate performance\n5. Tune and improve\n6. Deploy", learningObjectives: ["Define machine learning and its types", "Distinguish supervised from unsupervised learning", "Describe the ML workflow"] },
          { title: "Your First ML Model: Linear Regression", type: "VIDEO_READING" as LessonType, order: 2, estimatedMinutes: 40, content: "## Linear Regression with scikit-learn\n\n```python\nimport numpy as np\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import mean_squared_error, r2_score\n\n# Generate sample data\nnp.random.seed(42)\nexperience = np.random.uniform(1, 15, 100)\nsalary = 30000 + 5000 * experience + np.random.normal(0, 5000, 100)\n\n# Prepare features and target\nX = experience.reshape(-1, 1)\ny = salary\n\n# Split into train/test sets\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n\n# Train the model\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\n\n# Evaluate\ny_pred = model.predict(X_test)\nprint(f'R² Score: {r2_score(y_test, y_pred):.3f}')\nprint(f'RMSE: {mean_squared_error(y_test, y_pred, squared=False):.0f}')\n```", learningObjectives: ["Split data into training and test sets", "Train a linear regression model", "Evaluate model performance with R² and RMSE"] },
          { title: "Classification with Decision Trees", type: "VIDEO_READING" as LessonType, order: 3, estimatedMinutes: 40, content: "## Decision Tree Classification\n\n```python\nfrom sklearn.tree import DecisionTreeClassifier\nfrom sklearn.datasets import load_iris\nfrom sklearn.metrics import classification_report, confusion_matrix\n\n# Load dataset\niris = load_iris()\nX, y = iris.data, iris.target\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)\n\n# Train\nclf = DecisionTreeClassifier(max_depth=4, random_state=42)\nclf.fit(X_train, y_train)\n\n# Evaluate\ny_pred = clf.predict(X_test)\nprint(classification_report(y_test, y_pred, target_names=iris.target_names))\nprint('Confusion Matrix:')\nprint(confusion_matrix(y_test, y_pred))\n```", learningObjectives: ["Train a decision tree classifier", "Interpret a classification report", "Read a confusion matrix"] },
          { title: "ML Coding Exercise", type: "CODING_EXERCISE" as LessonType, order: 4, estimatedMinutes: 45, content: "Build and evaluate a machine learning model on a provided dataset.", learningObjectives: ["Apply the ML workflow independently", "Train and evaluate a model using scikit-learn"] },
          { title: "Module 9 Quiz", type: "QUIZ" as LessonType, order: 5, estimatedMinutes: 15, learningObjectives: ["Test machine learning knowledge"] },
        ],
      },
      {
        title: "Final Practical Project",
        description: "Demonstrate your complete data science skills by working through an end-to-end project on a real dataset.",
        order: 10,
        lessons: [
          { title: "Project Overview and Dataset", type: "READING" as LessonType, order: 1, estimatedMinutes: 15, content: "## Final Project: End-to-End Data Science\n\n### Project Objective\nYou will analyse a real-world dataset to produce actionable insights and a predictive model. Your final submission will be evaluated by your tutor using the provided grading rubric.\n\n### Dataset\nYou will work with a customer purchase dataset containing 500 records with the following columns:\n- `customer_id` — unique identifier\n- `age` — customer age\n- `gender` — M/F\n- `region` — geographic region\n- `purchase_amount` — total spend\n- `product_category` — Electronics, Clothing, Books, etc.\n- `num_purchases` — total number of purchases\n- `satisfaction_score` — 1–5 rating\n\n### Deliverables\n1. A Jupyter notebook with your full analysis\n2. A brief written summary (300–500 words)\n3. At least 5 visualizations\n4. A working predictive model\n5. Your key findings and recommendations\n\n### Grading Rubric\n- Data cleaning and preparation: 20 points\n- Exploratory data analysis: 25 points\n- Visualizations: 20 points\n- Machine learning model: 25 points\n- Communication of insights: 10 points\n\n**Total: 100 points. Pass mark: 70 points.**", learningObjectives: ["Understand the project requirements and deliverables", "Set up the analysis workflow"] },
          { title: "Project Resources and Tips", type: "DOWNLOADABLE" as LessonType, order: 2, estimatedMinutes: 10, content: "Download the project dataset and starter notebook from the resources panel.", learningObjectives: ["Access project resources", "Review project submission guidelines"] },
          { title: "Final Project Submission", type: "ASSIGNMENT" as LessonType, order: 3, estimatedMinutes: 300, content: "Submit your completed end-to-end data science project. Include your Jupyter notebook, written summary, and any supporting files.", learningObjectives: ["Complete an end-to-end data science project", "Demonstrate all skills learned in the course", "Present findings clearly and professionally"] },
        ],
      },
    ];

    let totalLessons = 0;
    for (const modData of moduleData) {
      const { lessons, ...moduleFields } = modData;
      const module = await prisma.module.create({
        data: {
          courseId: course.id,
          ...moduleFields,
          isRequired: true,
        },
      });

      for (const lessonData of lessons) {
        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: lessonData.title,
            type: lessonData.type,
            order: lessonData.order,
            estimatedMinutes: lessonData.estimatedMinutes || 15,
            content: lessonData.content || "",
            learningObjectives: lessonData.learningObjectives,
            isRequired: lessonData.type !== "DOWNLOADABLE",
          },
        });
        totalLessons++;
      }
    }

    console.log(`✅ Course created: "${course.title}" with ${moduleData.length} modules and ${totalLessons} lessons`);

    // Add to Data Science learning path
    const dsPath = paths.find((p) => p.slug === "data-science");
    if (dsPath) {
      await prisma.learningPathCourse.create({
        data: { learningPathId: dsPath.id, courseId: course.id, order: 1, isRequired: true },
      });
    }

    // Enroll demo student
    await prisma.enrollment.create({
      data: { userId: student.id, courseId: course.id, status: "ACTIVE", progress: 0.1 },
    });
    console.log(`✅ Demo student enrolled in course`);
  } else {
    console.log(`ℹ️  Course already exists, skipping`);
  }

  console.log("\n✨ Database seeded successfully!\n");
  console.log("Demo accounts:");
  console.log("  Admin:   admin@dataacademy.io       / Admin@DataAcademy2024!");
  console.log("  Tutor:   demo.tutor@dataacademy.io  / Tutor@DataAcademy2024!");
  console.log("  Student: demo.student@dataacademy.io / Student@DataAcademy2024!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
