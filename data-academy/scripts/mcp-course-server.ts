#!/usr/bin/env node
/**
 * Aitechhub Data Academy - Tutor Course Authoring MCP Server
 * 
 * Allows course instructors and tutors to create, structure, manage, and publish
 * entire courses, modules, lessons, and interactive NetAcad-style curriculum directly
 * from Claude Code or any MCP-compatible client.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PrismaClient, CourseLevel, CourseStatus, LessonType } from "@prisma/client";

// Ensure environment variables are loaded
const candidateEnvPaths = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../.env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "data-academy/.env"),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      // @ts-ignore
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile(envPath);
      }
    } catch {
      // Continue searching
    }
  }
}

// Fallback manual simple env parser if needed
if (!process.env.DATABASE_URL) {
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
}

const prisma = new PrismaClient({
  log: ["error"],
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Create the MCP server instance
const server = new McpServer({
  name: "aitechhub-course-manager",
  version: "1.0.0",
});

// ─── TOOL: list_categories ────────────────────────────────────────────────────
server.tool(
  "list_categories",
  "List all available course categories with their IDs, slugs, and display names.",
  {},
  async () => {
    try {
      const categories = await prisma.courseCategory.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { courses: true } },
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              categories.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon,
                courseCount: c._count.courses,
              })),
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching categories: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: list_courses ───────────────────────────────────────────────────────
server.tool(
  "list_courses",
  "List courses in Aitechhub Data Academy with optional filtering by status or search query.",
  {
    status: z
      .enum(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"])
      .optional()
      .default("ALL")
      .describe("Filter by course status. Default is ALL."),
    search: z
      .string()
      .optional()
      .describe("Search by title, description, or slug keyword"),
    categoryId: z
      .string()
      .optional()
      .describe("Filter by category ID"),
    limit: z
      .number()
      .optional()
      .default(25)
      .describe("Maximum courses to return (default 25)"),
  },
  async ({ status, search, categoryId, limit }) => {
    try {
      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status as CourseStatus;
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ];
      }

      const courses = await prisma.course.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          category: { select: { name: true, slug: true } },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      });

      const formatted = courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        level: c.level,
        status: c.status,
        category: c.category?.name || "Uncategorized",
        estimatedHours: c.estimatedHours,
        price: c.isFree ? "Free" : `$${c.price}`,
        modulesCount: c._count.modules,
        enrollmentsCount: c._count.enrollments,
        learnUrl: `/learn/${c.slug}`,
        updatedAt: c.updatedAt.toISOString(),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing courses: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: get_course ─────────────────────────────────────────────────────────
server.tool(
  "get_course",
  "Get complete course curriculum including all modules, lessons, order, and content metadata by course ID or slug.",
  {
    courseId: z.string().optional().describe("Unique Course ID"),
    slug: z.string().optional().describe("Unique Course slug URL identifier"),
  },
  async ({ courseId, slug }) => {
    try {
      if (!courseId && !slug) {
        return {
          isError: true,
          content: [{ type: "text", text: "You must provide either courseId or slug." }],
        };
      }

      const course = await prisma.course.findUnique({
        where: courseId ? { id: courseId } : { slug },
        include: {
          category: true,
          instructors: {
            include: {
              user: {
                select: {
                  email: true,
                  profile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: {
                  resources: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return {
          isError: true,
          content: [{ type: "text", text: `Course not found for ${courseId ? `ID: ${courseId}` : `slug: ${slug}`}` }],
        };
      }

      // Structure clean summary for tutor
      const result = {
        id: course.id,
        title: course.title,
        slug: course.slug,
        level: course.level,
        status: course.status,
        category: course.category?.name,
        estimatedHours: course.estimatedHours,
        price: course.price,
        isFree: course.isFree,
        prerequisites: course.prerequisites,
        learningOutcomes: course.learningOutcomes,
        tags: course.tags,
        instructors: course.instructors.map((i) => ({
          email: i.user.email,
          name: i.user.profile ? `${i.user.profile.firstName} ${i.user.profile.lastName}` : i.user.email,
          isPrimary: i.isPrimary,
        })),
        totalModules: course.modules.length,
        totalLessons: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        modules: course.modules.map((m) => ({
          id: m.id,
          order: m.order,
          title: m.title,
          description: m.description,
          lessonCount: m.lessons.length,
          lessons: m.lessons.map((l) => {
            let parsedSubLessonsCount = 0;
            if (l.content) {
              try {
                const parsed = JSON.parse(l.content);
                if (Array.isArray(parsed.subLessons)) {
                  parsedSubLessonsCount = parsed.subLessons.length;
                }
              } catch {}
            }
            return {
              id: l.id,
              order: l.order,
              title: l.title,
              type: l.type,
              estimatedMinutes: l.estimatedMinutes,
              videoUrl: l.videoUrl,
              learningObjectives: l.learningObjectives,
              subLessonsCount: parsedSubLessonsCount,
              hasContent: !!l.content,
              resources: l.resources.map((r) => ({
                id: r.id,
                title: r.title,
                type: r.type,
                url: r.url,
              })),
            };
          }),
        })),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error retrieving course: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: create_course ──────────────────────────────────────────────────────
server.tool(
  "create_course",
  "Create a new course entry in Aitechhub Data Academy. Generates slug automatically if omitted.",
  {
    title: z.string().min(3).describe("Course title (e.g. 'Advanced PySpark & Lakehouse Architecture')"),
    slug: z.string().optional().describe("URL slug (optional; auto-generated from title if omitted)"),
    shortDescription: z.string().min(10).describe("Concise 1-2 sentence summary of the course"),
    fullDescription: z.string().min(20).describe("Comprehensive course description and overview"),
    categoryId: z.string().optional().describe("Category ID (use list_categories to see available IDs)"),
    categoryName: z.string().optional().describe("Category Name (e.g. 'Data Engineering', 'Python Programming', 'Data Analytics')"),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER").describe("Course skill level"),
    estimatedHours: z.number().default(10).describe("Estimated completion hours"),
    price: z.number().default(0).describe("Course price in USD (0 for free)"),
    isFree: z.boolean().default(true).describe("Whether the course is free to take"),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT").describe("Publishing status"),
    prerequisites: z.array(z.string()).default([]).describe("Prerequisites for students taking this course"),
    learningOutcomes: z.array(z.string()).default([]).describe("Key skills and capabilities students will gain"),
    tags: z.array(z.string()).default([]).describe("Topic tags (e.g. ['Python', 'SQL', 'BigQuery'])"),
    certificateEnabled: z.boolean().default(true).describe("Whether course completion grants an Aitechhub certificate"),
    tutorEmail: z.string().optional().describe("Email of tutor to assign as primary instructor (optional)"),
  },
  async (args) => {
    try {
      let slug = args.slug?.trim() ? generateSlug(args.slug) : generateSlug(args.title);

      // Verify slug uniqueness
      let existing = await prisma.course.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Resolve category
      let categoryId = args.categoryId;
      if (!categoryId && args.categoryName) {
        const cat = await prisma.courseCategory.findFirst({
          where: {
            OR: [
              { name: { contains: args.categoryName, mode: "insensitive" } },
              { slug: { contains: generateSlug(args.categoryName), mode: "insensitive" } },
            ],
          },
        });
        if (cat) categoryId = cat.id;
      }

      const newCourse = await prisma.course.create({
        data: {
          title: args.title,
          slug,
          shortDescription: args.shortDescription,
          fullDescription: args.fullDescription,
          categoryId: categoryId || null,
          level: args.level,
          estimatedHours: args.estimatedHours,
          price: args.price,
          isFree: args.price === 0 ? true : args.isFree,
          status: args.status,
          prerequisites: args.prerequisites,
          learningOutcomes: args.learningOutcomes,
          tags: args.tags,
          certificateEnabled: args.certificateEnabled,
        },
      });

      // Optionally associate tutor instructor
      if (args.tutorEmail) {
        const user = await prisma.user.findUnique({
          where: { email: args.tutorEmail.toLowerCase() },
          include: { tutorProfile: true },
        });
        if (user) {
          await prisma.courseInstructor.create({
            data: {
              courseId: newCourse.id,
              userId: user.id,
              tutorId: user.tutorProfile?.id || null,
              isPrimary: true,
            },
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Course created successfully!",
                course: {
                  id: newCourse.id,
                  title: newCourse.title,
                  slug: newCourse.slug,
                  status: newCourse.status,
                  level: newCourse.level,
                  learnUrl: `/learn/${newCourse.slug}`,
                  adminUrl: `/admin/courses/${newCourse.id}`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating course: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: update_course ──────────────────────────────────────────────────────
server.tool(
  "update_course",
  "Update existing course metadata, descriptions, pricing, status, or outcomes.",
  {
    courseId: z.string().describe("ID of the course to update"),
    title: z.string().optional(),
    slug: z.string().optional(),
    shortDescription: z.string().optional(),
    fullDescription: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    estimatedHours: z.number().optional(),
    price: z.number().optional(),
    isFree: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    prerequisites: z.array(z.string()).optional(),
    learningOutcomes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    certificateEnabled: z.boolean().optional(),
  },
  async ({ courseId, ...updates }) => {
    try {
      const data: any = { ...updates };
      if (data.slug) {
        data.slug = generateSlug(data.slug);
      }
      if (data.price !== undefined) {
        if (data.price === 0) data.isFree = true;
      }

      const updated = await prisma.course.update({
        where: { id: courseId },
        data,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Course "${updated.title}" updated successfully!`,
                course: {
                  id: updated.id,
                  title: updated.title,
                  slug: updated.slug,
                  status: updated.status,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error updating course: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: create_module ──────────────────────────────────────────────────────
server.tool(
  "create_module",
  "Add a new module (chapter/unit) to a course.",
  {
    courseId: z.string().describe("ID of the parent course"),
    title: z.string().min(2).describe("Module title (e.g. 'Module 1: Foundations of Data Modeling')"),
    description: z.string().optional().describe("Module description or overview"),
    order: z.number().optional().describe("Order sequence number (defaults to end of course)"),
    isRequired: z.boolean().default(true).describe("Whether this module is required to complete"),
  },
  async ({ courseId, title, description, order, isRequired }) => {
    try {
      let targetOrder = order;
      if (targetOrder === undefined) {
        const lastMod = await prisma.module.findFirst({
          where: { courseId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        targetOrder = (lastMod?.order ?? 0) + 1;
      }

      const mod = await prisma.module.create({
        data: {
          courseId,
          title,
          description: description || null,
          order: targetOrder,
          isRequired,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Module "${mod.title}" created successfully!`,
                module: mod,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating module: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: update_module ──────────────────────────────────────────────────────
server.tool(
  "update_module",
  "Update a module title, description, or sequence order.",
  {
    moduleId: z.string().describe("ID of the module"),
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    order: z.number().optional(),
    isRequired: z.boolean().optional(),
  },
  async ({ moduleId, ...updates }) => {
    try {
      const updated = await prisma.module.update({
        where: { id: moduleId },
        data: updates,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Module updated successfully!`,
                module: updated,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error updating module: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: delete_module ──────────────────────────────────────────────────────
server.tool(
  "delete_module",
  "Delete a module and all its nested lessons.",
  {
    moduleId: z.string().describe("ID of the module to delete"),
  },
  async ({ moduleId }) => {
    try {
      const deleted = await prisma.module.delete({
        where: { id: moduleId },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: `Module "${deleted.title}" deleted.` }, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting module: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: create_lesson ──────────────────────────────────────────────────────
server.tool(
  "create_lesson",
  "Add a lesson into a module. Supports markdown or rich NetAcad-style interactive JSON with sub-lessons, coding exercises, SQL challenges, and practice quizzes.",
  {
    moduleId: z.string().describe("ID of the parent module"),
    title: z.string().min(2).describe("Lesson title (e.g. '2.1 Fundamentals of Relational Schema Design')"),
    type: z
      .enum([
        "READING",
        "VIDEO",
        "VIDEO_READING",
        "CODING_EXERCISE",
        "SQL_EXERCISE",
        "QUIZ",
        "ASSIGNMENT",
        "PROJECT",
        "DOWNLOADABLE",
        "EXTERNAL_RESOURCE",
      ])
      .default("READING")
      .describe("Lesson pedagogical format"),
    estimatedMinutes: z.number().default(15).describe("Estimated minutes to complete"),
    order: z.number().optional().describe("Lesson sequence order within the module"),
    videoUrl: z.string().optional().describe("Video URL (YouTube, Vimeo, or MP4)"),
    learningObjectives: z.array(z.string()).default([]).describe("Key learning objectives for this lesson"),
    content: z.string().optional().describe("Lesson text content in Markdown or JSON format"),
    subLessons: z
      .array(
        z.object({
          id: z.string().optional(),
          sectionNumber: z.string().optional().describe("e.g. '2.1.1'"),
          title: z.string().describe("Sub-lesson title"),
          type: z.string().optional().default("READING").describe("READING | PRACTICE | CODING_EXERCISE | SQL_EXERCISE | QUIZ"),
          content: z.string().optional().describe("Main text or explanation for this section"),
          mediaUrl: z.string().optional().describe("Banner or diagram image URL"),
          cards: z
            .array(
              z.object({
                title: z.string(),
                badge: z.string().optional(),
                description: z.string(),
                color: z.string().optional(),
                icon: z.string().optional(),
              })
            )
            .optional()
            .describe("Interactive grid cards (e.g. 4Vs of big data or architectural pillars)"),
          tabs: z
            .array(
              z.object({
                id: z.string(),
                label: z.string(),
                title: z.string(),
                content: z.string(),
                image: z.string().optional(),
              })
            )
            .optional()
            .describe("Interactive tabbed deep-dives"),
          starterCode: z.string().optional().describe("Python starter code for CODING_EXERCISE"),
          solutionHint: z.string().optional().describe("Code hint or reference solution"),
          starterSql: z.string().optional().describe("SQL starter query for SQL_EXERCISE"),
          schemaContext: z.string().optional().describe("Table schema context for SQL query challenges"),
          practiceQuiz: z
            .object({
              prompt: z.string().optional(),
              scenarios: z.array(
                z.object({
                  id: z.string().optional(),
                  text: z.string(),
                  options: z.array(z.string()),
                  correctAnswer: z.string(),
                  explanation: z.string(),
                })
              ),
            })
            .optional(),
          quizQuestions: z
            .array(
              z.object({
                question: z.string(),
                options: z.array(z.string()),
                correctIndex: z.number(),
                explanation: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .optional()
      .describe("Interactive sub-lessons structure. If provided, will be packed automatically as a NetAcad interactive payload."),
  },
  async ({ moduleId, title, type, estimatedMinutes, order, videoUrl, learningObjectives, content, subLessons }) => {
    try {
      let targetOrder = order;
      if (targetOrder === undefined) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { moduleId },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        targetOrder = (lastLesson?.order ?? 0) + 1;
      }

      let finalContent = content || "";

      // If subLessons were supplied, format into NetAcad standard JSON
      if (subLessons && subLessons.length > 0) {
        finalContent = JSON.stringify({
          format: "NETACAD_LESSON",
          subLessons: subLessons.map((sub, idx) => ({
            ...sub,
            id: sub.id || `sub_${Date.now()}_${idx + 1}`,
            sectionNumber: sub.sectionNumber || `1.${idx + 1}`,
            type: sub.type || type,
          })),
        });
      }

      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          title,
          type: type as LessonType,
          estimatedMinutes,
          order: targetOrder,
          videoUrl: videoUrl || null,
          learningObjectives,
          content: finalContent,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Lesson "${lesson.title}" created successfully!`,
                lesson: {
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  order: lesson.order,
                  estimatedMinutes: lesson.estimatedMinutes,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating lesson: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: update_lesson ──────────────────────────────────────────────────────
server.tool(
  "update_lesson",
  "Update a lesson's title, content, type, duration, or interactive sub-lessons.",
  {
    lessonId: z.string().describe("ID of the lesson to update"),
    title: z.string().optional(),
    type: z
      .enum([
        "READING",
        "VIDEO",
        "VIDEO_READING",
        "CODING_EXERCISE",
        "SQL_EXERCISE",
        "QUIZ",
        "ASSIGNMENT",
        "PROJECT",
        "DOWNLOADABLE",
        "EXTERNAL_RESOURCE",
      ])
      .optional(),
    estimatedMinutes: z.number().optional(),
    order: z.number().optional(),
    videoUrl: z.string().optional().nullable(),
    learningObjectives: z.array(z.string()).optional(),
    content: z.string().optional().describe("Raw markdown or JSON content string"),
    subLessons: z
      .array(
        z.object({
          id: z.string().optional(),
          sectionNumber: z.string().optional(),
          title: z.string(),
          type: z.string().optional(),
          content: z.string().optional(),
          mediaUrl: z.string().optional(),
          cards: z.any().optional(),
          tabs: z.any().optional(),
          starterCode: z.string().optional(),
          solutionHint: z.string().optional(),
          starterSql: z.string().optional(),
          schemaContext: z.string().optional(),
          practiceQuiz: z.any().optional(),
          quizQuestions: z.any().optional(),
        })
      )
      .optional()
      .describe("Structured sublessons array to serialize"),
  },
  async ({ lessonId, content, subLessons, ...updates }) => {
    try {
      const data: any = { ...updates };

      if (subLessons && subLessons.length > 0) {
        data.content = JSON.stringify({
          format: "NETACAD_LESSON",
          subLessons: subLessons.map((sub, idx) => ({
            ...sub,
            id: sub.id || `sub_${Date.now()}_${idx + 1}`,
            sectionNumber: sub.sectionNumber || `1.${idx + 1}`,
            type: sub.type || "READING",
          })),
        });
      } else if (content !== undefined) {
        data.content = content;
      }

      const updated = await prisma.lesson.update({
        where: { id: lessonId },
        data,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Lesson "${updated.title}" updated successfully!`,
                lesson: {
                  id: updated.id,
                  title: updated.title,
                  estimatedMinutes: updated.estimatedMinutes,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error updating lesson: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: delete_lesson ──────────────────────────────────────────────────────
server.tool(
  "delete_lesson",
  "Delete a lesson by ID.",
  {
    lessonId: z.string().describe("ID of the lesson to delete"),
  },
  async ({ lessonId }) => {
    try {
      const deleted = await prisma.lesson.delete({
        where: { id: lessonId },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: `Lesson "${deleted.title}" deleted.` }, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting lesson: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: create_full_curriculum ─────────────────────────────────────────────
server.tool(
  "create_full_curriculum",
  "Creates an entire course with all modules and lessons in a single atomic prompt. Ideal for Claude Code to generate complete ready-to-learn curricula from outlines.",
  {
    course: z.object({
      title: z.string().min(3).describe("Course title"),
      slug: z.string().optional().describe("Custom slug (optional)"),
      shortDescription: z.string().min(10).describe("Concise 1-2 sentence course summary"),
      fullDescription: z.string().min(20).describe("Full course description and syllabus overview"),
      categoryId: z.string().optional().describe("Category ID"),
      categoryName: z.string().optional().describe("Category Name (e.g. 'Data Analytics')"),
      level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
      estimatedHours: z.number().default(10),
      price: z.number().default(0),
      isFree: z.boolean().default(true),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
      prerequisites: z.array(z.string()).default([]),
      learningOutcomes: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      certificateEnabled: z.boolean().default(true),
      tutorEmail: z.string().optional().describe("Tutor email to assign as primary instructor"),
    }),
    modules: z.array(
      z.object({
        title: z.string().describe("Module title (e.g. 'Module 1: Ingestion & Pipelines')"),
        description: z.string().optional(),
        lessons: z.array(
          z.object({
            title: z.string().describe("Lesson title"),
            type: z
              .enum([
                "READING",
                "VIDEO",
                "VIDEO_READING",
                "CODING_EXERCISE",
                "SQL_EXERCISE",
                "QUIZ",
                "ASSIGNMENT",
                "PROJECT",
                "DOWNLOADABLE",
                "EXTERNAL_RESOURCE",
              ])
              .default("READING"),
            estimatedMinutes: z.number().default(15),
            videoUrl: z.string().optional(),
            learningObjectives: z.array(z.string()).default([]),
            content: z.string().optional().describe("Markdown content or JSON string"),
            subLessons: z.array(z.any()).optional().describe("Interactive sublessons with cards, tabs, code, sql, or quizzes"),
          })
        ),
      })
    ),
  },
  async ({ course: courseInput, modules: modulesInput }) => {
    try {
      let slug = courseInput.slug?.trim() ? generateSlug(courseInput.slug) : generateSlug(courseInput.title);

      const existing = await prisma.course.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Resolve category
      let categoryId = courseInput.categoryId;
      if (!categoryId && courseInput.categoryName) {
        const cat = await prisma.courseCategory.findFirst({
          where: {
            OR: [
              { name: { contains: courseInput.categoryName, mode: "insensitive" } },
              { slug: { contains: generateSlug(courseInput.categoryName), mode: "insensitive" } },
            ],
          },
        });
        if (cat) categoryId = cat.id;
      }

      // Create course
      const createdCourse = await prisma.course.create({
        data: {
          title: courseInput.title,
          slug,
          shortDescription: courseInput.shortDescription,
          fullDescription: courseInput.fullDescription,
          categoryId: categoryId || null,
          level: courseInput.level,
          estimatedHours: courseInput.estimatedHours,
          price: courseInput.price,
          isFree: courseInput.price === 0 ? true : courseInput.isFree,
          status: courseInput.status,
          prerequisites: courseInput.prerequisites,
          learningOutcomes: courseInput.learningOutcomes,
          tags: courseInput.tags,
          certificateEnabled: courseInput.certificateEnabled,
        },
      });

      // Assign instructor if tutorEmail provided
      if (courseInput.tutorEmail) {
        const user = await prisma.user.findUnique({
          where: { email: courseInput.tutorEmail.toLowerCase() },
          include: { tutorProfile: true },
        });
        if (user) {
          await prisma.courseInstructor.create({
            data: {
              courseId: createdCourse.id,
              userId: user.id,
              tutorId: user.tutorProfile?.id || null,
              isPrimary: true,
            },
          });
        }
      }

      let totalLessonsCreated = 0;

      // Create modules and lessons sequentially to maintain perfect ordering
      for (let mIdx = 0; mIdx < modulesInput.length; mIdx++) {
        const m = modulesInput[mIdx];
        const mod = await prisma.module.create({
          data: {
            courseId: createdCourse.id,
            title: m.title,
            description: m.description || null,
            order: mIdx + 1,
            isRequired: true,
          },
        });

        for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
          const l = m.lessons[lIdx];
          let lessonContent = l.content || "";

          if (l.subLessons && l.subLessons.length > 0) {
            lessonContent = JSON.stringify({
              format: "NETACAD_LESSON",
              subLessons: l.subLessons.map((sub: any, subIdx: number) => ({
                ...sub,
                id: sub.id || `sub_${mod.order}_${lIdx + 1}_${subIdx + 1}`,
                sectionNumber: sub.sectionNumber || `${mod.order}.${lIdx + 1}.${subIdx + 1}`,
                type: sub.type || l.type || "READING",
              })),
            });
          }

          await prisma.lesson.create({
            data: {
              moduleId: mod.id,
              title: l.title,
              type: l.type as LessonType,
              order: lIdx + 1,
              estimatedMinutes: l.estimatedMinutes || 15,
              videoUrl: l.videoUrl || null,
              learningObjectives: l.learningObjectives || [],
              content: lessonContent,
            },
          });
          totalLessonsCreated++;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `🎉 Entire curriculum "${createdCourse.title}" successfully created!`,
                course: {
                  id: createdCourse.id,
                  title: createdCourse.title,
                  slug: createdCourse.slug,
                  status: createdCourse.status,
                  modulesCount: modulesInput.length,
                  lessonsCount: totalLessonsCreated,
                  studentPlayerUrl: `/learn/${createdCourse.slug}`,
                  adminUrl: `/admin/courses/${createdCourse.id}`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error generating full curriculum: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: publish_course ─────────────────────────────────────────────────────
server.tool(
  "publish_course",
  "Publish a course or revert it back to draft mode.",
  {
    courseId: z.string().optional().describe("Course ID"),
    slug: z.string().optional().describe("Course slug"),
    status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).default("PUBLISHED").describe("Target status"),
  },
  async ({ courseId, slug, status }) => {
    try {
      if (!courseId && !slug) {
        return {
          isError: true,
          content: [{ type: "text", text: "Please provide either courseId or slug." }],
        };
      }

      const updated = await prisma.course.update({
        where: courseId ? { id: courseId } : { slug },
        data: { status: status as CourseStatus },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Course "${updated.title}" status changed to ${updated.status}!`,
                course: {
                  id: updated.id,
                  slug: updated.slug,
                  status: updated.status,
                  url: `/learn/${updated.slug}`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error updating course status: ${err.message}` }],
      };
    }
  }
);

// ─── TOOL: add_lesson_resource ────────────────────────────────────────────────
server.tool(
  "add_lesson_resource",
  "Attach a downloadable resource, dataset, notebook, cheat sheet, or external reference to a lesson.",
  {
    lessonId: z.string().describe("Target lesson ID"),
    title: z.string().describe("Resource name (e.g. 'Customer_Transactions_Sample.csv' or 'DuckDB Cheatsheet')"),
    url: z.string().describe("Resource download or reference URL"),
    type: z.string().default("DOWNLOADABLE").describe("PDF | DATASET | CODE | SLIDES | EXTERNAL_LINK"),
    size: z.number().optional().describe("File size in bytes (optional)"),
  },
  async ({ lessonId, title, url, type, size }) => {
    try {
      const resource = await prisma.lessonResource.create({
        data: {
          lessonId,
          title,
          url,
          type,
          size: size || null,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: `Resource "${resource.title}" attached to lesson successfully!`,
                resource,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error adding resource: ${err.message}` }],
      };
    }
  }
);

// ─── PROMPT: course-creator ───────────────────────────────────────────────────
server.prompt(
  "course-creator",
  "Interactive prompt assisting tutors in structuring a complete production-grade course for Aitechhub Data Academy with interactive sub-lessons.",
  {
    topic: z.string().describe("Course topic (e.g. 'Modern Apache Kafka Streaming' or 'PostgreSQL Performance Optimization')"),
    targetAudience: z.string().optional().describe("Skill level or role (e.g. 'Junior Data Engineers')"),
  },
  ({ topic, targetAudience }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are an expert curriculum architect for Aitechhub Data Academy. 
I want to design a premier course on "${topic}" for ${targetAudience || "Data Professionals"}.

Please construct a comprehensive course structure with:
1. Compelling Course Title, Short Description, and Full Description.
2. Recommended Course Level (BEGINNER, INTERMEDIATE, or ADVANCED) and estimated hours.
3. 3-4 structured Modules.
4. For each module, 2-3 detailed Lessons.
5. In each lesson, break it into NetAcad-style interactive sub-lessons containing:
   - Deep explanation with diagrams/cards (4-quadrant cards for key pillars).
   - Practical hands-on practice (either a CODING_EXERCISE with Python starter code, an SQL_EXERCISE with starter query and table context, or a PRACTICE quiz with multiple choice scenarios).
6. When I approve the curriculum outline, call the 'create_full_curriculum' MCP tool to save the entire course into the Aitechhub Data Academy database so students can begin learning immediately at /learn/[slug]!`,
        },
      },
    ],
  })
);

// ─── START MCP SERVER (STDIO) ─────────────────────────────────────────────────
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log strictly to stderr so stdout remains 100% clean for JSON-RPC MCP messages
  console.error("🚀 Aitechhub Data Academy MCP Server running on stdio.");
}

run().catch((error) => {
  console.error("Fatal error running Aitechhub MCP Server:", error);
  process.exit(1);
});
