import http from 'node:http';
// ファイルを読み込むためのライブラリを追加するぞい
import { readFile } from 'node:fs/promises';

const server = http.createServer(async (req, res) => { // async を追加
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>こんにちは！</h1>');

  } else if (url.pathname === '/ask') {
    const question = url.searchParams.get('q');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Your question is '${question}'`);

  } else if (url.pathname.startsWith('/public/')) {
    // /public/ で始まるパスにアクセスされた場合の処理
    console.log(`ファイルを配信します: ${url.pathname}`);
    
    // URLのパスを使って、実際のファイルの場所（パス）を作る
    // .substring(1) で先頭の "/" を取って "public/foo.txt" にしておる
    const filePath = url.pathname.substring(1);

    try {
      // ファイルを読み込む
      const data = await readFile(filePath);
      
      // テキストファイルとして返す
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(data);
    } catch (err) {
      // ファイルが見つからないなどのエラーが発生したとき
      console.error(`ファイル読み込みエラー: ${err.message}`);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ファイルが見つかりませんでした。');
    }

  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('お探しのページは見つかりませんでした。');
  }
});

const PORT = 8888;
server.listen(PORT, () => {
  console.log(`サーバーが起動中じゃ: http://localhost:${PORT}/`);
});
