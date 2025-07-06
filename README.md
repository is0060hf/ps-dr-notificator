# PlanetScale Slack Integration for Vercel

PlanetScaleのDeploy Request (DR) イベントをSlackに通知するVercelサーバーレス関数です。

## 機能

- PlanetScale Webhookの署名検証
- Deploy Request関連イベントの通知
  - DR開始
  - DRキューイング
  - スキーマ適用
  - DRクローズ
  - カットオーバー待機
- エラーハンドリングとSlackへのエラー通知

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env.local`にコピーして、値を設定：

```bash
cp .env.example .env.local
```

### 3. Vercelへのデプロイ

```bash
# 開発環境で確認
npm run dev

# 本番環境にデプロイ
npm run deploy
```

## 設定

### PlanetScale

1. Database Settings → Webhooks でWebhookを作成
2. Webhook URLに `https://your-app.vercel.app/api/webhook/planetscale` を設定
3. Deploy Request関連のイベントを選択
4. Webhook Secretを環境変数に設定

### Slack

1. [Slack API](https://api.slack.com/apps)で新規アプリを作成
2. Incoming Webhooksを有効化
3. Webhook URLを環境変数に設定

## プロジェクト構造

```
├── api/
│   └── webhook/
│       └── planetscale.js    # Webhookエンドポイント
├── lib/
│   ├── slack.js              # Slack通知ロジック
│   └── verify.js             # 署名検証
├── package.json
├── vercel.json
└── README.md
```

## トラブルシューティング

- **401エラー**: Webhook Secretを確認
- **500エラー**: Slack Webhook URLを確認
- **通知が届かない**: Vercelログで詳細を確認

## ライセンス

MIT