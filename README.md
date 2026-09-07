# Ichijo AI Lab website

一条高校 Ichijo AI Lab の公式サイト試作版です。

## ページ

- `index.html` — 閲覧用サイト（紹介・アプリ・ブログ・依頼・問い合わせ）
- `admin.html` — 管理者用コンソール

## 現在のデータ保存

初版ではブラウザの `localStorage` を使用しています。管理画面の変更とフォーム送信は、同じ端末・同じブラウザでのみ確認できます。本番運用時は認証と共有データベースへの接続が必要です。

## GitHub Pages

リポジトリの Settings → Pages から、`main` ブランチのルートを公開元に指定すると公開できます。
