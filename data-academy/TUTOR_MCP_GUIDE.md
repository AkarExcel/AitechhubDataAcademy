# 🎓 Aitechhub Data Academy - Tutor MCP Guide for Claude Code

This MCP (Model Context Protocol) Server empowers course tutors and instructors to create, manage, and publish entire courses, modules, lessons, and interactive learning labs directly from **Claude Code** (or Claude Desktop) using conversational prompts.

---

## ⚡ 1. Quick Setup for Claude Code

### Option A: Automatic Discovery (`.mcp.json`)
If you open Claude Code inside the `data-academy` directory, Claude Code automatically recognizes [`.mcp.json`](file:///c:/Users/EXCEL/coderabbits/AitechhubDataAcademy/data-academy/.mcp.json):
```bash
cd data-academy
claude
```

### Option B: Add to Claude Code via CLI
From any terminal, run:
```bash
claude mcp add aitechhub-courses -- npx -y tsx c:/Users/EXCEL/coderabbits/AitechhubDataAcademy/data-academy/scripts/mcp-course-server.ts
```

### Option C: Claude Desktop Setup
If using the Claude Desktop application, add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "aitechhub-courses": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "npx -y tsx c:/Users/EXCEL/coderabbits/AitechhubDataAcademy/data-academy/scripts/mcp-course-server.ts"
      ]
    }
  }
}
```

---

## 🛠️ 2. Available MCP Tools

| Tool Name | Description | Key Inputs |
| :--- | :--- | :--- |
| `list_categories` | Lists all Academy categories with IDs & slugs | _none_ |
| `list_courses` | Searches & lists courses by status, category, or keyword | `status`, `search`, `categoryId` |
| `get_course` | Fetches full course hierarchy (modules, lessons, content) | `courseId` or `slug` |
| `create_course` | Creates a new course entry | `title`, `shortDescription`, `fullDescription`, `level`, `tags`, `price` |
| `update_course` | Updates course metadata, status, or outcomes | `courseId`, fields to update |
| `create_module` | Adds a new module (chapter/unit) to a course | `courseId`, `title`, `description`, `order` |
| `update_module` | Updates module title, description, or sequence order | `moduleId`, fields to update |
| `delete_module` | Deletes a module and its nested lessons | `moduleId` |
| `create_lesson` | Adds a lesson with Markdown or interactive NetAcad sub-lessons | `moduleId`, `title`, `type`, `content`, `subLessons` |
| `update_lesson` | Updates lesson text, interactive sub-lessons, or labs | `lessonId`, fields to update |
| `delete_lesson` | Deletes a lesson | `lessonId` |
| `create_full_curriculum` | **Bulk generator**: Creates entire course + all modules + lessons in 1 atomic prompt | `course`, `modules` with nested `lessons` |
| `publish_course` | Toggles course status between `PUBLISHED` and `DRAFT` | `courseId` or `slug`, `status` |
| `add_lesson_resource` | Attaches downloadable datasets, cheat sheets, or links | `lessonId`, `title`, `url`, `type` |

---

## 💡 3. Example Prompts for Tutors in Claude Code

### 🚀 Example 1: Generate an Entire Course in One Prompt
> **Tutor Prompt in Claude Code:**
> *"Claude, check our course categories using `list_categories`. Then create a comprehensive 3-module intermediate course titled 'Mastering DuckDB for Modern Data Pipelines' under Data Analytics. Include 2 lessons per module with hands-on exercises and publish the course."*
>
> **What Claude Code does:**
> 1. Calls `list_categories` to get the category ID.
> 2. Formulates the complete curriculum.
> 3. Calls `create_full_curriculum` to save everything to the database.
> 4. Gives you the instant live link: `/learn/mastering-duckdb-for-modern-data-pipelines`.

---

### 💻 Example 2: Add an Interactive Python Coding Lab
> **Tutor Prompt in Claude Code:**
> *"Add a coding lab lesson to Module 2 titled 'Lab 2.3: Cleaning Time-Series with Pandas' with starter code that parses dates and handles missing timestamps, plus a solution hint."*
>
> **Payload structure passed to `create_lesson`:**
> ```json
> {
>   "moduleId": "cmvn...",
>   "title": "Lab 2.3: Cleaning Time-Series with Pandas",
>   "type": "CODING_EXERCISE",
>   "estimatedMinutes": 25,
>   "content": "In this hands-on lab, you will repair corrupt sensor timestamps.",
>   "subLessons": [
>     {
>       "title": "Interactive Python Lab",
>       "type": "CODING_EXERCISE",
>       "content": "Write a function `clean_sensor_data(df)` that parses 'timestamp' to UTC and forward-fills missing temperature readings.",
>       "starterCode": "import pandas as pd\n\ndef clean_sensor_data(df):\n    # TODO: Convert timestamp to datetime and ffill missing values\n    pass\n",
>       "solutionHint": "Use pd.to_datetime(df['timestamp'], utc=True) and df['temperature'].ffill()"
>     }
>   ]
> }
> ```

---

### 🗄️ Example 3: Add an Interactive SQL Challenge
> **Tutor Prompt in Claude Code:**
> *"Add an SQL challenge to Module 1 titled 'Lab 1.4: Window Functions & Rolling Averages' with table schema and starter SQL."*
>
> **Payload structure passed to `create_lesson`:**
> ```json
> {
>   "moduleId": "cmvn...",
>   "title": "Lab 1.4: Window Functions & Rolling Averages",
>   "type": "SQL_EXERCISE",
>   "estimatedMinutes": 20,
>   "subLessons": [
>     {
>       "title": "SQL Practice Query",
>       "type": "SQL_EXERCISE",
>       "content": "Calculate the 7-day moving average of daily revenue.",
>       "starterSql": "SELECT order_date, daily_revenue,\n  AVG(daily_revenue) OVER (\n    ORDER BY order_date\n    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n  ) AS rolling_avg_7d\nFROM daily_metrics;",
>       "schemaContext": "Table: daily_metrics (order_date DATE, daily_revenue NUMERIC, order_count INT)"
>     }
>   ]
> }
> ```

---

### 📚 Example 4: Add Cisco NetAcad-Style 4-Quadrant Cards & Scenario Quiz
> **Tutor Prompt in Claude Code:**
> *"In lesson '1.1 Data Quality Dimensions', create 4 interactive cards covering Completeness, Accuracy, Consistency, and Timeliness, followed by a scenario practice quiz."*
>
> **Structure supported by `subLessons`:**
> ```json
> {
>   "subLessons": [
>     {
>       "title": "The Four Core Dimensions",
>       "type": "READING",
>       "content": "Explore the foundational pillars of enterprise data quality:",
>       "cards": [
>         { "title": "Completeness", "badge": "CRITICAL", "description": "No critical attributes or required records are missing.", "color": "#0284c7", "icon": "📊" },
>         { "title": "Accuracy", "badge": "ACCURACY", "description": "Data accurately describes real-world entities and events.", "color": "#10b981", "icon": "🎯" },
>         { "title": "Consistency", "badge": "INTEGRITY", "description": "Data values across disparate systems do not conflict.", "color": "#8b5cf6", "icon": "🔄" },
>         { "title": "Timeliness", "badge": "LATENCY", "description": "Data is available when expected without downstream lag.", "color": "#f59e0b", "icon": "⚡" }
>       ]
>     },
>     {
>       "title": "Scenario Knowledge Check",
>       "type": "PRACTICE",
>       "practiceQuiz": {
>         "prompt": "Match each data failure to its corresponding dimension:",
>         "scenarios": [
>           {
>             "id": "q1",
>             "text": "A customer table has 15% null values in the 'billing_address_country' field.",
>             "options": ["Accuracy", "Completeness", "Timeliness", "Consistency"],
>             "correctAnswer": "Completeness",
>             "explanation": "Null values represent missing data, violating completeness."
>           }
>         ]
>       }
>     }
>   ]
> }
> ```

---

## 🔍 4. Verification & Testing

You can test the MCP server anytime from PowerShell or terminal:
```powershell
npm run mcp:courses
```
It connects over standard input/output (stdio) and outputs:
```
🚀 Aitechhub Data Academy MCP Server running on stdio.
```

Your Claude Code instance is now ready to build and publish world-class data curricula!
