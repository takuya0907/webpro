# 慶應生向け教科書売買アプリ

慶應義塾大学の学生同士で、授業で使い終わった教科書を売買するためのアプリです。授業名や教科書名で検索でき、出品者に直接連絡を取って取引できるので、使わなくなった教科書を必要な人へ手軽に橋渡しします。

## デモURL

https://webpro-ygpb.onrender.com

※Renderの無料プランを利用しているため、しばらくアクセスがないとサーバーがスリープします。初回アクセス時は起動に最大50秒程度かかることがあります。

## 動作確認用アカウント

- Email: `test@keio.jp`
- Password: `testpass123`

ログイン後、サンプルの出品データ（統計解析/多変量解析入門など）と出品機能を確認できます。

## 技術構成

- Node.js + Express
- Prisma (ORM)
- PostgreSQL (Render)
- セッション管理: express-session + connect-pg-simple（Postgres上にセッションを保存）
- デプロイ先: Render

## 主な機能

- ユーザー登録・ログイン・ログアウト（`@keio.jp` メールアドレスのみ登録可、パスワードはbcryptでハッシュ化）
- 教科書の出品（授業名・教科書名・説明・価格・出品者名・連絡先を入力、入力チェックあり）
- 出品一覧のカード表示（新しい順）
- 授業名・教科書名での検索（大文字小文字を区別しない部分一致）
- 商品詳細ページ
- 売却済みステータスの管理（一覧にSOLDバッジ表示、「売却済みを除く」フィルタ）
- スマホでも見やすいレスポンシブデザイン

## ローカルでの起動方法

1. リポジトリをクローンし、依存パッケージをインストールします。

   ```bash
   git clone https://github.com/takuya0907/webpro.git
   cd webpro
   npm install
   ```

2. `.env.example` を参考に `.env` を作成し、`DATABASE_URL`（PostgreSQLの接続文字列）と `SESSION_SECRET`（任意のランダムな文字列）を設定します。

   ```bash
   cp .env.example .env
   ```

3. データベースにテーブルを作成します。

   ```bash
   npx prisma migrate deploy
   ```

4. （任意）動作確認用のテストアカウントとサンプル出品を投入します。

   ```bash
   npm run seed
   ```

5. サーバーを起動します。

   ```bash
   npm start
   ```

   `http://localhost:3000` にアクセスすると確認できます。

## 未実装の機能

- オークション形式での出品（`Item.type` に `"auction"` を将来追加する想定のみで、現在は固定価格 `"fixed"` のみ対応）
- 出品者とのチャット機能（`Message` モデルは用意済みですが、画面・APIとしては未実装）
- メールアドレスの本人確認（確認メール送信によるメール認証）
