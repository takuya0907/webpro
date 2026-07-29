require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_USER = {
  email: 'test@keio.jp',
  name: 'テストユーザー',
  password: 'testpass123',
};

const SAMPLE_ITEMS = [
  {
    courseName: '統計解析',
    title: '多変量解析入門',
    description: '書き込み少なめです。',
    price: 2000,
  },
  {
    courseName: '金融工学',
    title: 'デリバティブ入門',
    description: '状態良好です。',
    price: 3000,
  },
  {
    courseName: '管理工学概論',
    title: '経営工学の基礎',
    description: '',
    price: 1500,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: {},
    create: {
      email: TEST_USER.email,
      name: TEST_USER.name,
      passwordHash,
    },
  });

  console.log(`テストユーザー: ${user.email} (id=${user.id})`);

  for (const item of SAMPLE_ITEMS) {
    const existing = await prisma.item.findFirst({
      where: { sellerId: user.id, title: item.title },
    });

    if (existing) {
      console.log(`既に存在するためスキップ: ${item.title}`);
      continue;
    }

    await prisma.item.create({
      data: {
        ...item,
        sellerId: user.id,
        sellerName: user.name,
        sellerContact: user.email,
      },
    });

    console.log(`作成しました: ${item.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
