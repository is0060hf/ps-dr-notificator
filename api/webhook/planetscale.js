// api/webhook/planetscale.js
import { verifyPlanetScaleSignature } from '../../lib/verify';
import { sendSlackNotification } from '../../lib/slack';

// Vercel API設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Deploy Request関連イベント
const DEPLOY_REQUEST_EVENTS = [
  'deploy_request.opened',
  'deploy_request.queued',
  'deploy_request.schema_applied',
  'deploy_request.closed',
  'deploy_request.pending_cutover'
];

export default async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 署名検証
    const signature = req.headers['x-planetscale-signature'];
    if (!signature) {
      console.error('No signature header present');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // リクエストボディを文字列として取得
    const payload = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);

    const isValid = await verifyPlanetScaleSignature(
      payload,
      signature,
      process.env.PLANETSCALE_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // パースされたボディを取得
    const body = typeof req.body === 'string' 
      ? JSON.parse(req.body) 
      : req.body;

    const { event, timestamp } = body;

    console.log(`Received webhook: ${event} at ${new Date(timestamp * 1000).toISOString()}`);

    // Deploy Request関連イベントのみ処理
    if (!DEPLOY_REQUEST_EVENTS.includes(event)) {
      console.log(`Ignoring non-DR event: ${event}`);
      return res.status(200).json({ status: 'ignored' });
    }

    // Slack通知を送信
    await sendSlackNotification(event, body);

    console.log(`Successfully sent Slack notification for ${event}`);
    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Error processing webhook:', error);

    // エラー通知を試行（ベストエフォート）
    try {
      await sendSlackNotification('error', {
        error: error.message,
        event: req.body?.event || 'unknown'
      });
    } catch (slackError) {
      console.error('Failed to send error notification:', slackError);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}