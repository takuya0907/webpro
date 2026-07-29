console.log('hello!');
document.addEventListener('DOMContentLoaded', () => {
  // 1. 必要なHTML要素（インプット、ボタン、リスト）を取得する
  const input = document.querySelector('#todo-input');
  const button = document.querySelector('#add-button');
  const ul = document.querySelector('#items');

  input.value = 'こんにちは';

  // 2. ボタンがクリックされたときの処理（イベントリスナー）を設定する
  button.addEventListener('click', () => {
    // 入力された文字を取得（前後の余分な空白を削除）
    const text = input.value.trim();

    // もし何も入力されていなければ、何もしない（空のliが作られるのを防ぐ）
    if (text === '') {
      return;
    }

    // 3. 新しい <li> 要素を作成し、文字を設定する
    const li = document.createElement('li');
    li.textContent = text;

    // 4. 作成した <li> を <ul> の中に追加する
    ul.appendChild(li);

    // 5. 次の入力がしやすいように、入力欄を空にしてフォーカスを合わせる
    input.value = '';
    input.focus();
  });
});