import { prisma } from "../lib/db";

async function main() {
  console.log("🌱 بدء إضافة البيانات التجريبية...");

  // Create departments
  const csDept = await prisma.department.upsert({
    where: { name: "علوم الحاسوب" },
    update: {},
    create: {
      name: "علوم الحاسوب",
      description: "قسم علوم الحاسوب",
    },
  });

  const mathDept = await prisma.department.upsert({
    where: { name: "الرياضيات" },
    update: {},
    create: {
      name: "الرياضيات",
      description: "قسم الرياضيات",
    },
  });

  console.log("✅ تم إنشاء الأقسام");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "مدير النظام",
    },
  });

  const researcherRole = await prisma.role.upsert({
    where: { name: "RESEARCHER" },
    update: {},
    create: {
      name: "RESEARCHER",
      description: "باحث",
    },
  });

  console.log("✅ تم إنشاء الأدوار");

  // Create permissions
  const permissions = [
    { name: "users.create", resource: "users", action: "create", description: "إنشاء مستخدمين" },
    { name: "users.read", resource: "users", action: "read", description: "قراءة المستخدمين" },
    { name: "users.update", resource: "users", action: "update", description: "تحديث المستخدمين" },
    { name: "users.delete", resource: "users", action: "delete", description: "حذف المستخدمين" },
    { name: "publications.create", resource: "publications", action: "create", description: "إنشاء منشورات" },
    { name: "publications.read", resource: "publications", action: "read", description: "قراءة المنشورات" },
    { name: "publications.update", resource: "publications", action: "update", description: "تحديث المنشورات" },
    { name: "publications.delete", resource: "publications", action: "delete", description: "حذف المنشورات" },
    { name: "conferences.create", resource: "conferences", action: "create", description: "إنشاء مؤتمرات" },
    { name: "conferences.read", resource: "conferences", action: "read", description: "قراءة المؤتمرات" },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(p);
  }

  console.log("✅ تم إنشاء الصلاحيات");

  // Assign permissions to roles
  // Admin gets all permissions
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Researcher gets read/create/update for their own records
  const researcherPerms = createdPermissions.filter(
    (p) => p.name.includes("read") || (p.name.includes("create") && !p.name.includes("users"))
  );
  for (const perm of researcherPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: researcherRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: researcherRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log("✅ تم ربط الصلاحيات بالأدوار");

  // Create admin user (password will be hashed using DB function)
  const adminPasswordHash = await prisma.$queryRaw<[{ hash_password: string }]>`
    SELECT hash_password('admin123') as hash_password
  `;

  const admin = await prisma.user.upsert({
    where: { email: "admin@uobasrah.edu.iq" },
    update: {},
    create: {
      email: "admin@uobasrah.edu.iq",
      fullNameAr: "مدير النظام",
      fullNameEn: "System Admin",
      passwordHash: adminPasswordHash[0].hash_password,
      departmentId: csDept.id,
      isActive: true,
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log("✅ تم إنشاء المستخدم المدير:", admin.email);

  // Create researcher user
  const researcherPasswordHash = await prisma.$queryRaw<[{ hash_password: string }]>`
    SELECT hash_password('researcher123') as hash_password
  `;

  const researcher = await prisma.user.upsert({
    where: { email: "researcher@uobasrah.edu.iq" },
    update: {},
    create: {
      email: "researcher@uobasrah.edu.iq",
      fullNameAr: "باحث تجريبي",
      fullNameEn: "Sample Researcher",
      passwordHash: researcherPasswordHash[0].hash_password,
      departmentId: csDept.id,
      isActive: true,
    },
  });

  // Assign researcher role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: researcher.id,
        roleId: researcherRole.id,
      },
    },
    update: {},
    create: {
      userId: researcher.id,
      roleId: researcherRole.id,
    },
  });

  console.log("✅ تم إنشاء المستخدم الباحث:", researcher.email);

  // Create researcher profile
  await prisma.researcherProfile.upsert({
    where: { userId: researcher.id },
    update: {},
    create: {
      userId: researcher.id,
      academicTitle: "أستاذ مساعد",
      phone: "07701234567",
      bio: "باحث في مجال علوم الحاسوب",
    },
  });

  console.log("✅ تم إنشاء الملف الشخصي للباحث");

  // Create sample publications
  await prisma.publication.create({
    data: {
      userId: researcher.id,
      title: "ورقة علمية في الذكاء الاصطناعي",
      authors: ["باحث تجريبي", "مؤلف آخر"],
      journal: "مجلة علوم الحاسوب",
      year: 2024,
      status: "PUBLISHED",
      category: "SCOPUS",
      keywords: ["AI", "Machine Learning"],
    },
  });

  // Create sample conference
  await prisma.conference.create({
    data: {
      userId: researcher.id,
      title: "مؤتمر علوم الحاسوب الدولي",
      eventName: "ICCS 2024",
      location: "بغداد",
      date: new Date("2024-03-20"),
      type: "International",
      role: "Presenter",
    },
  });

  console.log("✅ تم إضافة البيانات العلمية التجريبية");

  console.log("\n🎉 اكتمل إضافة البيانات التجريبية!");
  console.log("\n📝 بيانات تسجيل الدخول:");
  console.log("المدير:");
  console.log("  البريد: admin@uobasrah.edu.iq");
  console.log("  أو اسم المستخدم: admin");
  console.log("  كلمة المرور: admin123");
  console.log("\nالباحث:");
  console.log("  البريد: researcher@uobasrah.edu.iq");
  console.log("  أو اسم المستخدم: researcher");
  console.log("  كلمة المرور: researcher123");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
