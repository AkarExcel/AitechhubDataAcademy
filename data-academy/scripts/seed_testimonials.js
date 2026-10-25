const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedTestimonials() {
  try {
    const samples = [
      {
        studentName: "Amara Okonkwo",
        role: "Data Analyst",
        company: "Standard Bank Group",
        courseTitle: "Data Science Foundations",
        rating: 5,
        content:
          "The curriculum at Data Academy bridged the gap between academic theory and real enterprise workflows. Within three months of completing the Data Science track, I transitioned from junior reporting to leading analytics modeling.",
        isApproved: true,
        isFeatured: true,
        order: 1,
      },
      {
        studentName: "David Chen",
        role: "BI Engineer",
        company: "Paystack",
        courseTitle: "Business Intelligence & SQL Mastery",
        rating: 5,
        content:
          "What sets this academy apart is the browser-based practice environment. Writing live SQL against multi-million row datasets gave me the confidence to pass every technical round during my interview.",
        isApproved: true,
        isFeatured: true,
        order: 2,
      },
      {
        studentName: "Fatima Al-Mansoor",
        role: "Machine Learning Specialist",
        company: "FinTech Innovations",
        courseTitle: "Advanced Machine Learning with Python",
        rating: 5,
        content:
          "The instructor mentorship and code reviews were world-class. Each module felt like working on real production deliverables rather than abstract toy examples. Highly recommended for serious learners.",
        isApproved: true,
        isFeatured: true,
        order: 3,
      },
      {
        studentName: "Marcus Vance",
        role: "Senior Data Consultant",
        company: "Deloitte Digital",
        courseTitle: "Data Science Foundations",
        rating: 5,
        content:
          "Even with years in IT, Data Academy refreshed my technical toolkit with modern GenAI and predictive analytics techniques. The verified digital badge immediately boosted my consulting profile.",
        isApproved: true,
        isFeatured: true,
        order: 4,
      },
    ];

    console.log("Seeding sample testimonials...");
    for (const t of samples) {
      const created = await prisma.testimonial.create({ data: t });
      console.log("Created:", created.studentName, "(ID:", created.id, ")");
    }

    const all = await prisma.testimonial.findMany();
    console.log("Total testimonials in DB now:", all.length);
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestimonials();
