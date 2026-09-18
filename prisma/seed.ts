import { PrismaClient, Role, ResourceType, ResourceStatus, MasteryLevel, ConceptImportance, ConceptRelationType, TaskPriority, TaskStatus, SessionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Lock In database...");

  // 1. Create or upsert demo user
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await db.user.upsert({
    where: { email: "alex@lockin.study" },
    update: {},
    create: {
      email: "alex@lockin.study",
      username: "alexchen",
      name: "Alex Chen",
      passwordHash,
      role: Role.USER,
      bio: "CS & AI Researcher @ Lock In. Focusing on Neural Systems & Distributed Architecture.",
    },
  });

  console.log(`👤 User created/ready: ${user.email} (${user.id})`);

  // 2. Create Categories (Field -> Subject -> Topic)
  let csCat = await db.category.findFirst({
    where: { userId: user.id, name: "Computer Science", parentId: null },
  });
  if (!csCat) {
    csCat = await db.category.create({
      data: {
        userId: user.id,
        name: "Computer Science",
        slug: "computer-science",
        level: 1,
      },
    });
  }

  let mlCat = await db.category.findFirst({
    where: { userId: user.id, name: "Machine Learning & AI", parentId: csCat.id },
  });
  if (!mlCat) {
    mlCat = await db.category.create({
      data: {
        userId: user.id,
        parentId: csCat.id,
        name: "Machine Learning & AI",
        slug: "machine-learning-ai",
        level: 2,
      },
    });
  }

  let systemsCat = await db.category.findFirst({
    where: { userId: user.id, name: "Distributed Systems", parentId: csCat.id },
  });
  if (!systemsCat) {
    systemsCat = await db.category.create({
      data: {
        userId: user.id,
        parentId: csCat.id,
        name: "Distributed Systems",
        slug: "distributed-systems",
        level: 2,
      },
    });
  }

  // 3. Create Tags
  const tagDeepLearning = await db.tag.upsert({
    where: { userId_name: { userId: user.id, name: "Deep Learning" } },
    update: {},
    create: { userId: user.id, name: "Deep Learning", color: "#FF2D55" },
  });

  const tagMath = await db.tag.upsert({
    where: { userId_name: { userId: user.id, name: "Mathematics" } },
    update: {},
    create: { userId: user.id, name: "Mathematics", color: "#5856D6" },
  });

  const tagArchitecture = await db.tag.upsert({
    where: { userId_name: { userId: user.id, name: "Architecture" } },
    update: {},
    create: { userId: user.id, name: "Architecture", color: "#007AFF" },
  });

  // 4. Create Concepts
  const conceptLinAlg = await db.concept.upsert({
    where: { userId_slug: { userId: user.id, slug: "linear-algebra-foundations" } },
    update: {},
    create: {
      userId: user.id,
      categoryId: mlCat.id,
      title: "Linear Algebra & Matrix Decompositions",
      slug: "linear-algebra-foundations",
      summary: "Vector spaces, eigenvalues, singular value decomposition (SVD), and matrix transformations in high dimensions.",
      notes: "# Linear Algebra Foundations\n\n- SVD: $A = U \\Sigma V^T$\n- Eigenvalue equation: $Av = \\lambda v$\n- Essential for projection and dimensionality reduction.",
      masteryLevel: MasteryLevel.MASTERED,
      importance: ConceptImportance.CRITICAL,
      isFavorite: true,
    },
  });

  const conceptBackprop = await db.concept.upsert({
    where: { userId_slug: { userId: user.id, slug: "backpropagation-gradient-descent" } },
    update: {},
    create: {
      userId: user.id,
      categoryId: mlCat.id,
      title: "Backpropagation & Auto-Differentiation",
      slug: "backpropagation-gradient-descent",
      summary: "Chain rule applied across computational graphs, reverse-mode auto-differentiation, and adaptive optimizers (Adam, SGD).",
      notes: "# Backpropagation\n\nGradient of composite loss functions computed by traversing reverse DAG.",
      masteryLevel: MasteryLevel.PROFICIENT,
      importance: ConceptImportance.CRITICAL,
      isFavorite: true,
    },
  });

  const conceptTransformers = await db.concept.upsert({
    where: { userId_slug: { userId: user.id, slug: "transformer-attention-mechanisms" } },
    update: {},
    create: {
      userId: user.id,
      categoryId: mlCat.id,
      title: "Transformer Architectures & Scaled Dot-Product Attention",
      slug: "transformer-attention-mechanisms",
      summary: "Multi-head self-attention, rotary positional embeddings (RoPE), KV-cache optimization, and causal decoding.",
      notes: "# Self-Attention Formula\n\n$$\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$",
      masteryLevel: MasteryLevel.FAMILIAR,
      importance: ConceptImportance.CRITICAL,
      isFavorite: true,
    },
  });

  const conceptRaft = await db.concept.upsert({
    where: { userId_slug: { userId: user.id, slug: "raft-consensus-protocol" } },
    update: {},
    create: {
      userId: user.id,
      categoryId: systemsCat.id,
      title: "Raft Consensus Algorithm",
      slug: "raft-consensus-protocol",
      summary: "Leader election, log replication, safety invariants, and joint consensus cluster membership changes.",
      notes: "# Raft Protocol\n\n- Leader Election with randomized timers\n- Heartbeats and AppendEntries RPCs",
      masteryLevel: MasteryLevel.PROFICIENT,
      importance: ConceptImportance.HIGH,
      isFavorite: false,
    },
  });

  // 5. Create Concept Relations (Prerequisites & Graph Connections)
  await db.conceptRelation.upsert({
    where: {
      sourceId_targetId_relationType: {
        sourceId: conceptLinAlg.id,
        targetId: conceptBackprop.id,
        relationType: ConceptRelationType.PREREQUISITE_FOR,
      },
    },
    update: {},
    create: {
      sourceId: conceptLinAlg.id,
      targetId: conceptBackprop.id,
      relationType: ConceptRelationType.PREREQUISITE_FOR,
      description: "Matrix calculus and gradient representations depend on linear algebra.",
      strength: 5,
    },
  });

  await db.conceptRelation.upsert({
    where: {
      sourceId_targetId_relationType: {
        sourceId: conceptBackprop.id,
        targetId: conceptTransformers.id,
        relationType: ConceptRelationType.PREREQUISITE_FOR,
      },
    },
    update: {},
    create: {
      sourceId: conceptBackprop.id,
      targetId: conceptTransformers.id,
      relationType: ConceptRelationType.PREREQUISITE_FOR,
      description: "Attention training relies heavily on auto-differentiation & backprop.",
      strength: 5,
    },
  });

  // 5b. Create Hierarchical Skills
  let pythonSkill = await db.skill.findFirst({
    where: { userId: user.id, parentId: null, name: "Python" },
  });
  if (!pythonSkill) {
    pythonSkill = await db.skill.create({
      data: {
        userId: user.id,
        categoryId: mlCat.id,
        name: "Python",
        description: "Core language mastery, standard library, decorators, generators, and async programming.",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
        progress: 90,
      },
    });
  }

  // Python Sub-skills
  await db.skill.upsert({
    where: {
      userId_parentId_name: {
        userId: user.id,
        parentId: pythonSkill.id,
        name: "PyTorch",
      },
    },
    update: {},
    create: {
      userId: user.id,
      parentId: pythonSkill.id,
      name: "PyTorch",
      description: "Custom autograd functions, GPU tensor memory layout, multi-GPU DDP training, and torch.compile tracing.",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg",
      progress: 90,
    },
  });

  await db.skill.upsert({
    where: {
      userId_parentId_name: {
        userId: user.id,
        parentId: pythonSkill.id,
        name: "Pandas",
      },
    },
    update: {},
    create: {
      userId: user.id,
      parentId: pythonSkill.id,
      name: "Pandas",
      description: "Dataframe manipulation, vectorized operations, time-series indexing, and parquet serialization.",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg",
      progress: 85,
    },
  });

  await db.skill.upsert({
    where: {
      userId_parentId_name: {
        userId: user.id,
        parentId: pythonSkill.id,
        name: "FastAPI",
      },
    },
    update: {},
    create: {
      userId: user.id,
      parentId: pythonSkill.id,
      name: "FastAPI",
      description: "Asynchronous REST APIs, Pydantic v2 schemas, OpenAPI generation, and dependency injection.",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
      progress: 80,
    },
  });

  // TypeScript Parent & Sub-skills
  let tsSkill = await db.skill.findFirst({
    where: { userId: user.id, parentId: null, name: "TypeScript & Web Engineering" },
  });
  if (!tsSkill) {
    tsSkill = await db.skill.create({
      data: {
        userId: user.id,
        categoryId: csCat.id,
        name: "TypeScript & Web Engineering",
        description: "Type-level programming, generics, fullstack modern web applications, and system design.",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
        progress: 92,
      },
    });
  }

  await db.skill.upsert({
    where: {
      userId_parentId_name: {
        userId: user.id,
        parentId: tsSkill.id,
        name: "React",
      },
    },
    update: {},
    create: {
      userId: user.id,
      parentId: tsSkill.id,
      name: "React",
      description: "Server components, custom hooks, concurrent mode, and virtual DOM reconciliation.",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      progress: 95,
    },
  });

  await db.skill.upsert({
    where: {
      userId_parentId_name: {
        userId: user.id,
        parentId: tsSkill.id,
        name: "Next.js",
      },
    },
    update: {},
    create: {
      userId: user.id,
      parentId: tsSkill.id,
      name: "Next.js",
      description: "App router architecture, server actions, streaming SSR, and edge middleware.",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
      progress: 90,
    },
  });

  // 5c. Create Sample Projects
  let demoProject = await db.project.findFirst({
    where: { userId: user.id, name: "Mini-LLM Autograd Engine" },
  });
  if (!demoProject) {
    demoProject = await db.project.create({
      data: {
        userId: user.id,
        name: "Mini-LLM Autograd Engine",
        description: "A lightweight PyTorch-compatible reverse-mode automatic differentiation engine and GPT decoder implemented from scratch.",
        url: "https://nextjs.org",
        repoUrl: "https://github.com/karpathy/micrograd",
        status: "COMPLETED",
        skills: {
          create: [
            { skillId: pythonSkill.id },
          ],
        },
      },
    });
  }

  // 6. Create Resources
  const resPaper = await db.resource.create({
    data: {
      userId: user.id,
      categoryId: mlCat.id,
      title: "Attention Is All You Need (Vaswani et al.)",
      url: "https://arxiv.org/abs/1706.03762",
      type: ResourceType.PAPER,
      status: ResourceStatus.COMPLETED,
      rating: 5,
      estimatedMinutes: 120,
      actualMinutes: 140,
      isFavorite: true,
      summary: "The seminal 2017 paper replacing recurrence and convolutions entirely with multi-head attention.",
      concepts: {
        create: { conceptId: conceptTransformers.id },
      },
      tags: {
        create: { tagId: tagDeepLearning.id },
      },
    },
  });

  const resBook = await db.resource.create({
    data: {
      userId: user.id,
      categoryId: systemsCat.id,
      title: "Designing Data-Intensive Applications (Martin Kleppmann)",
      url: "https://dataintensive.net/",
      type: ResourceType.BOOK,
      status: ResourceStatus.IN_PROGRESS,
      rating: 5,
      estimatedMinutes: 600,
      actualMinutes: 240,
      isFavorite: true,
      summary: "The comprehensive guide to storage engines, distributed consensus, transactions, and stream processing.",
      concepts: {
        create: { conceptId: conceptRaft.id },
      },
      tags: {
        create: { tagId: tagArchitecture.id },
      },
    },
  });

  // 7. Create Semester Plan
  const now = new Date();
  const semesterStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const semesterEnd = new Date(now.getFullYear(), now.getMonth() + 3, 30);

  const semesterPlan = await db.semesterPlan.create({
    data: {
      userId: user.id,
      title: "Fall 2026 Core Research & AI Sprint",
      startDate: semesterStart,
      endDate: semesterEnd,
      color: "#007AFF",
      goalSummary: "Master Transformer mechanics, build custom mini-LLM, and finalize Distributed Raft cluster.",
      targetWeeklyHours: 25.0,
    },
  });

  // 8. Create Study Tasks (Today & This Week)
  const todayStr = new Date();
  todayStr.setHours(0, 0, 0, 0);

  const task1 = await db.studyTask.create({
    data: {
      userId: user.id,
      semesterPlanId: semesterPlan.id,
      conceptId: conceptTransformers.id,
      resourceId: resPaper.id,
      title: "Implement Multi-Head Attention in PyTorch",
      description: "Write custom multi-head attention with batch matrix multiplications and causal masking.",
      scheduledDate: todayStr,
      startTime: "09:00",
      endTime: "10:30",
      estimatedMinutes: 90,
      actualMinutes: 90,
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
      isExamOrMilestone: false,
    },
  });

  const task2 = await db.studyTask.create({
    data: {
      userId: user.id,
      semesterPlanId: semesterPlan.id,
      conceptId: conceptRaft.id,
      resourceId: resBook.id,
      title: "Review Raft Leader Election & Log Replication",
      description: "Work through Chapter 9 distributed consensus invariants.",
      scheduledDate: todayStr,
      startTime: "11:00",
      endTime: "12:30",
      estimatedMinutes: 90,
      actualMinutes: 45,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      isExamOrMilestone: false,
    },
  });

  const task3 = await db.studyTask.create({
    data: {
      userId: user.id,
      semesterPlanId: semesterPlan.id,
      conceptId: conceptBackprop.id,
      title: "Deep Work: Matrix Calculus & AutoDiff Derivations",
      description: "Hand-derive Jacobian vector products for attention equations.",
      scheduledDate: todayStr,
      startTime: "14:00",
      endTime: "16:00",
      estimatedMinutes: 120,
      actualMinutes: 0,
      priority: TaskPriority.URGENT,
      status: TaskStatus.TODO,
      isExamOrMilestone: false,
    },
  });

  // 9. Create Study Sessions (Focus records)
  await db.studySession.create({
    data: {
      userId: user.id,
      studyTaskId: task1.id,
      conceptId: conceptTransformers.id,
      resourceId: resPaper.id,
      sessionType: SessionType.POMODORO,
      durationMinutes: 50,
      completedRounds: 2,
      notes: "Implemented QKV projections and scaled dot product attention. Tested with synthetic tensors.",
      startedAt: new Date(Date.now() - 3 * 3600 * 1000),
      endedAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
  });

  await db.studySession.create({
    data: {
      userId: user.id,
      studyTaskId: task2.id,
      conceptId: conceptRaft.id,
      resourceId: resBook.id,
      sessionType: SessionType.DEEP_WORK,
      durationMinutes: 45,
      completedRounds: 1,
      notes: "Analyzed randomized election timeouts in Raft.",
      startedAt: new Date(Date.now() - 1 * 3600 * 1000),
      endedAt: new Date(),
    },
  });

  // 10. Activity Logs
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: "COMPLETE",
      entityType: "task",
      entityId: task1.id,
      meta: { title: task1.title, durationMinutes: 90 },
    },
  });

  console.log("✅ Seed completed successfully with demo user, concepts, resources, calendar tasks, and focus sessions!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
