import { Router } from 'express';
import { WebhookController } from '../../controllers/WebhookController';

const router = Router();

// ── External Payment & Courier Webhooks (§9.1 - §9.3) ──────────────────────

router.post(
  '/sslcommerz/ipn',
  WebhookController.handleSslcommerzIpn
);

router.post(
  '/pathao/status',
  WebhookController.handlePathaoWebhook
);

router.post(
  '/steadfast/status',
  WebhookController.handleSteadfastWebhook
);

export default router;
