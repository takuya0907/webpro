require('dotenv').config();
const path = require('node:path');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title, body) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="container">
${body}
</div>
</body>
</html>`;
}

function field(name, label, { type = 'text', value = '', error, textarea = false } = {}) {
  const control = textarea
    ? `<textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea>`
    : `<input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}"${type === 'number' ? ' min="0"' : ''}>`;
  const errorHtml = error ? `<p class="field-error">${escapeHtml(error)}</p>` : '';

  return `
    <div class="field">
      <label for="${name}">${label}</label>
      ${control}
      ${errorHtml}
    </div>
  `;
}

function renderSellForm(values = {}, errors = {}) {
  return `
    <section class="card-panel">
      <h2>出品する</h2>
      <form method="POST" action="/items" class="form-grid">
        ${field('courseName', '授業名', { value: values.courseName, error: errors.courseName })}
        ${field('title', '教科書名', { value: values.title, error: errors.title })}
        ${field('description', '説明', { value: values.description, error: errors.description, textarea: true })}
        ${field('price', '価格(円)', { value: values.price, error: errors.price, type: 'number' })}
        ${field('sellerName', '出品者名', { value: values.sellerName, error: errors.sellerName })}
        ${field('sellerContact', '連絡先', { value: values.sellerContact, error: errors.sellerContact })}
        <button type="submit" class="btn-primary">出品する</button>
      </form>
    </section>
  `;
}

function renderItemCard(item) {
  const soldBadge = item.status === 'sold' ? '<span class="badge badge-sold">SOLD</span>' : '';

  return `
    <a class="item-card" href="/items/${item.id}">
      ${soldBadge}
      <h3>${escapeHtml(item.courseName)}</h3>
      <p class="item-title">${escapeHtml(item.title)}</p>
      <p class="item-price">${item.price}円</p>
      <p class="item-seller">出品者: ${escapeHtml(item.sellerName)}</p>
    </a>
  `;
}

function renderHomePage({ q = '', hideSold = false, items, formValues = {}, formErrors = {} }) {
  return `
    <h1>慶應教科書売買アプリ</h1>

    ${renderSellForm(formValues, formErrors)}

    <section class="card-panel">
      <h2>検索</h2>
      <form method="GET" action="/" class="search-form">
        <input type="text" name="q" value="${escapeHtml(q)}" placeholder="授業名・教科書名で検索">
        <label class="checkbox-label">
          <input type="checkbox" name="hideSold"${hideSold ? ' checked' : ''}>
          売却済みを除く
        </label>
        <button type="submit" class="btn-secondary">検索</button>
      </form>
    </section>

    <section>
      <h2>出品一覧</h2>
      <div class="item-grid">
        ${items.length ? items.map(renderItemCard).join('') : '<p class="empty">出品はまだありません。</p>'}
      </div>
    </section>
  `;
}

function renderItemDetail(item) {
  const soldBadge = item.status === 'sold' ? '<span class="badge badge-sold">SOLD</span>' : '';
  const soldAction = item.status === 'sold'
    ? '<p class="sold-note">この商品は売却済みです。</p>'
    : `
      <form method="POST" action="/items/${item.id}/sold">
        <button type="submit" class="btn-danger">売却済みにする</button>
      </form>
    `;

  return `
    <p><a href="/">&larr; 一覧に戻る</a></p>
    <section class="card-panel item-detail">
      ${soldBadge}
      <h1>${escapeHtml(item.courseName)}「${escapeHtml(item.title)}」</h1>
      <p>説明: ${escapeHtml(item.description || '(なし)')}</p>
      <p>価格: ${item.price}円</p>
      <p>出品者名: ${escapeHtml(item.sellerName)}</p>
      <p>連絡先: ${escapeHtml(item.sellerContact)}</p>
      <p>出品日時: ${item.createdAt.toLocaleString('ja-JP')}</p>
      ${soldAction}
    </section>
  `;
}

function renderNotFound() {
  return '<h1>404 Not Found</h1><p>指定された商品は見つかりませんでした。</p><p><a href="/">一覧に戻る</a></p>';
}

function validateItemInput(body) {
  const values = {
    courseName: (body.courseName || '').trim(),
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    price: (body.price || '').trim(),
    sellerName: (body.sellerName || '').trim(),
    sellerContact: (body.sellerContact || '').trim(),
  };

  const errors = {};
  if (!values.courseName) errors.courseName = '授業名を入力してください';
  if (!values.title) errors.title = '教科書名を入力してください';
  if (!values.sellerName) errors.sellerName = '出品者名を入力してください';
  if (!values.sellerContact) errors.sellerContact = '連絡先を入力してください';

  if (!values.price) {
    errors.price = '価格を入力してください';
  } else {
    const priceNumber = Number(values.price);
    if (Number.isNaN(priceNumber)) {
      errors.price = '価格は数値で入力してください';
    } else if (priceNumber < 0) {
      errors.price = '価格は0以上で入力してください';
    }
  }

  return { values, errors };
}

function fetchItems({ q, hideSold }) {
  const conditions = [];

  if (q) {
    conditions.push({
      OR: [
        { courseName: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (hideSold) {
    conditions.push({ status: { not: 'sold' } });
  }

  return prisma.item.findMany({
    where: conditions.length ? { AND: conditions } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

app.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const hideSold = req.query.hideSold === 'on';

  const items = await fetchItems({ q, hideSold });

  res.send(layout('慶應教科書売買アプリ', renderHomePage({ q, hideSold, items })));
});

app.post('/items', async (req, res) => {
  const { values, errors } = validateItemInput(req.body);

  if (Object.keys(errors).length > 0) {
    const items = await fetchItems({ q: '', hideSold: false });
    res
      .status(400)
      .send(layout('慶應教科書売買アプリ', renderHomePage({ items, formValues: values, formErrors: errors })));
    return;
  }

  await prisma.item.create({
    data: {
      courseName: values.courseName,
      title: values.title,
      description: values.description || null,
      price: Number(values.price),
      sellerName: values.sellerName,
      sellerContact: values.sellerContact,
    },
  });

  res.redirect('/');
});

app.get('/items/:id', async (req, res) => {
  const id = Number(req.params.id);

  const item = !Number.isNaN(id) ? await prisma.item.findUnique({ where: { id } }) : null;

  if (!item) {
    res.status(404).send(layout('404 Not Found', renderNotFound()));
    return;
  }

  res.send(layout(`${item.courseName} | 慶應教科書売買アプリ`, renderItemDetail(item)));
});

app.post('/items/:id/sold', async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(404).send(layout('404 Not Found', renderNotFound()));
    return;
  }

  try {
    await prisma.item.update({ where: { id }, data: { status: 'sold' } });
  } catch (err) {
    res.status(404).send(layout('404 Not Found', renderNotFound()));
    return;
  }

  res.redirect(`/items/${id}`);
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
