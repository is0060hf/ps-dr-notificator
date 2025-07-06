// lib/slack.js
import { IncomingWebhook } from '@slack/webhook';

// Slack Webhookクライアントの初期化
let webhook;
function getWebhook() {
  if (!webhook) {
    webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  }
  return webhook;
}

// イベント設定
const EVENT_CONFIGS = {
  'deploy_request.opened': {
    emoji: '🚀',
    color: '#36a64f',
    title: 'Deploy Request Opened'
  },
  'deploy_request.queued': {
    emoji: '⏳',
    color: '#439FE0',
    title: 'Deploy Request Queued'
  },
  'deploy_request.schema_applied': {
    emoji: '✅',
    color: '#36a64f',
    title: 'Schema Applied Successfully'
  },
  'deploy_request.closed': {
    emoji: '🔒',
    color: '#ff9900',
    title: 'Deploy Request Closed'
  },
  'deploy_request.pending_cutover': {
    emoji: '⚠️',
    color: '#ff9900',
    title: 'Pending Cutover - Action Required'
  },
  'error': {
    emoji: '❌',
    color: '#ff0000',
    title: 'Webhook Processing Error'
  }
};

export async function sendSlackNotification(event, payload) {
  const webhook = getWebhook();
  
  if (event === 'error') {
    // エラー通知の特別処理
    return webhook.send({
      text: `${EVENT_CONFIGS.error.emoji} ${EVENT_CONFIGS.error.title}`,
      attachments: [{
        color: EVENT_CONFIGS.error.color,
        title: EVENT_CONFIGS.error.title,
        text: payload.error,
        fields: [{
          title: 'Event',
          value: payload.event,
          short: true
        }],
        footer: 'PlanetScale Integration',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  // 通常のDeploy Request通知
  const { resource, database, organization, timestamp } = payload;
  const config = EVENT_CONFIGS[event] || {
    emoji: '📌',
    color: '#808080',
    title: event
  };

  // Deploy Requestの状態に応じて色を調整
  if (event === 'deploy_request.closed' && resource.approved) {
    config.color = '#36a64f';
  }

  const message = {
    text: `${config.emoji} ${config.title} - DR #${resource.id}`,
    attachments: [{
      color: config.color,
      title: `${config.title}: DR #${resource.id}`,
      title_link: `https://app.planetscale.com/${organization}/${database}/deploy-requests/${resource.id}`,
      fields: [
        {
          title: 'Database',
          value: database,
          short: true
        },
        {
          title: 'Organization',
          value: organization,
          short: true
        },
        {
          title: 'Branch Flow',
          value: `\`${resource.branch}\` → \`${resource.into_branch}\``,
          short: true
        },
        {
          title: 'Actor',
          value: resource.actor?.display_name || 'System',
          short: true
        },
        {
          title: 'State',
          value: resource.state,
          short: true
        },
        {
          title: 'Deployment State',
          value: resource.deployment_state || 'N/A',
          short: true
        }
      ],
      footer: 'PlanetScale Integration',
      ts: timestamp || Math.floor(Date.now() / 1000)
    }]
  };

  // 特定のイベントに追加情報を含める
  if (event === 'deploy_request.pending_cutover') {
    message.attachments[0].actions = [{
      type: 'button',
      text: 'Go to PlanetScale',
      url: `https://app.planetscale.com/${organization}/${database}/deploy-requests/${resource.id}`,
      style: 'primary'
    }];
  }

  return webhook.send(message);
}