import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// 1x1 pixel transparent PNG base64 string to act as valid image files
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function createPlaceholderImage(fileName) {
  const uploadDir = path.resolve(process.cwd(), 'uploads/images');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(PNG_BASE64, 'base64'));
    console.log(`Created placeholder file: uploads/images/${fileName}`);
  }
}

async function main() {
  console.log('Starting seed process...');

  // Hash standard passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // 1. Create Users
  console.log('Seeding users...');
  
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // User 1
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      name: 'Nguyễn Văn A',
      email: 'user1@example.com',
      password: userPassword,
      role: 'USER',
    },
  });

  // User 2
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      name: 'Trần Thị B',
      email: 'user2@example.com',
      password: userPassword,
      role: 'USER',
    },
  });

  // 2. Create Categories
  console.log('Seeding categories...');
  
  // Category 1: Public - Created by Admin
  const catNature = await prisma.category.upsert({
    where: { slug: 'thien-nhien' },
    update: {},
    create: {
      name: 'Thiên nhiên',
      slug: 'thien-nhien',
      description: 'Hình ảnh phong cảnh thiên nhiên, núi non hoang dã',
      isPublic: true,
      status: 'APPROVED',
      createdById: admin.id,
    },
  });

  // Category 2: Public - Created by User 1
  const catAnimals = await prisma.category.upsert({
    where: { slug: 'thu-cung' },
    update: {},
    create: {
      name: 'Thú cưng',
      slug: 'thu-cung',
      description: 'Những con thú cưng dễ thương như chó, mèo, thỏ',
      isPublic: true,
      status: 'APPROVED',
      createdById: user1.id,
    },
  });

  // Category 3: Private - Created by Admin
  const catTech = await prisma.category.upsert({
    where: { slug: 'cong-nghe' },
    update: {},
    create: {
      name: 'Công nghệ',
      slug: 'cong-nghe',
      description: 'Thiết bị công nghệ và setup góc làm việc',
      isPublic: false,
      status: 'APPROVED',
      createdById: admin.id,
    },
  });

  // 3. Create physical placeholder files
  await createPlaceholderImage('seed_nature.png');
  await createPlaceholderImage('seed_animals.png');
  await createPlaceholderImage('seed_tech.png');

  // 4. Create Images
  console.log('Seeding images...');

  // Approved Image in Public Category
  await prisma.image.create({
    data: {
      title: 'Rừng thông Đà Lạt',
      description: 'Rừng thông hoang sơ buổi sáng sớm tại Đà Lạt',
      imageUrl: 'uploads/images/seed_nature.png',
      categoryId: catNature.id,
      uploadedById: user1.id,
      status: 'APPROVED',
      isPublic: true,
    },
  });

  // Approved Image in Public Category
  await prisma.image.create({
    data: {
      title: 'Mèo con dễ thương',
      description: 'Một chú mèo mướp con nghịch ngợm',
      imageUrl: 'uploads/images/seed_animals.png',
      categoryId: catAnimals.id,
      uploadedById: user2.id,
      status: 'APPROVED',
      isPublic: true,
    },
  });

  // Pending Image in Public Category
  await prisma.image.create({
    data: {
      title: 'Hồ nước trong xanh',
      description: 'Hồ nước phản chiếu bầu trời xanh ngắt',
      imageUrl: 'uploads/images/seed_nature.png',
      categoryId: catNature.id,
      uploadedById: user1.id,
      status: 'PENDING',
      isPublic: true,
    },
  });

  // Rejected Image in Public Category
  await prisma.image.create({
    data: {
      title: 'Hình ảnh không phù hợp',
      description: 'Hình ảnh chứa nội dung nhạy cảm hoặc vi phạm',
      imageUrl: 'uploads/images/seed_nature.png',
      categoryId: catNature.id,
      uploadedById: user2.id,
      status: 'REJECTED',
      rejectReason: 'Hình ảnh chứa nội dung vi phạm tiêu chuẩn cộng đồng',
      isPublic: true,
    },
  });

  // Approved Image in Private Category
  await prisma.image.create({
    data: {
      title: 'Bàn phím cơ Custom',
      description: 'Bàn phím cơ layout 75% phím bấm êm ái',
      imageUrl: 'uploads/images/seed_tech.png',
      categoryId: catTech.id,
      uploadedById: admin.id,
      status: 'APPROVED',
      isPublic: true,
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
