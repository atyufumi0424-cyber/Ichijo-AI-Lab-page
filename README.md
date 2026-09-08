# Ichijo AI Lab website

一条高校 Ichijo AI Lab の公式サイト試作版です。

## ページ

- `index.html` — 閲覧用サイト（紹介・アプリ・ブログ・依頼・問い合わせ）
- `runner.html` — 登録したHTML/CSS/JavaScriptアプリの実行ページ

## 現在のデータ保存

Supabaseを利用して、アプリ・ブログ・お問い合わせの共有データを読み書きします。管理者機能は別リポジトリ `Ichijo-AI-Lab-admin` に分離されています。

お問い合わせはSupabaseの管理画面に保存され、FormSubmit経由で通知メールも送信されます。最初の送信時に届くFormSubmitの有効化メールを承認してください。

## GitHub Pages

リポジトリの Settings → Pages から、`main` ブランチのルートを公開元に指定すると公開できます。
