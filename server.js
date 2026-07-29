require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderItem(item) {
  return `
    <li>
      <strong>${escapeHtml(item.courseName)}</strong>「${escapeHtml(item.title)}」
      - ${item.price}円
      - 出品者: ${escapeHtml(item.sellerName)}
    </li>
  `;
}

app.get('/', async (req, res) => {
  const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });

  res.send(`
    <h1>慶應教科書売買アプリ</h1>

    <h2>出品する</h2>
    <form method="POST" action="/items">
      <div><label>授業名: <input name="courseName" required></label></div>
      <div><label>教科書名: <input name="title" required></label></div>
      <div><label>説明: <textarea name="description"></textarea></label></div>
      <div><label>価格(円): <input name="price" type="number" min="0" required></label></div>
      <div><label>出品者名: <input name="sellerName" required></label></div>
      <div><label>連絡先: <input name="sellerContact" required></label></div>
      <div><button type="submit">出品する</button></div>
    </form>

    <h2>出品一覧</h2>
    <ul>
      ${items.map(renderItem).join('')}
    </ul>
  `);
});

app.post('/items', async (req, res) => {
  const { courseName, title, description, price, sellerName, sellerContact } = req.body;

  await prisma.item.create({
    data: {
      courseName,
      title,
      description: description || null,
      price: Number(price),
      sellerName,
      sellerContact,
    },
  });

  res.redirect('/');
});

app.get('/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: 'ok', userCount });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}/`);
});
