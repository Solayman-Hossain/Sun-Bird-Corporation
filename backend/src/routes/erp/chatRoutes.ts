import { Router } from 'express';
import { ChatController } from '../../controllers/ChatController';

const router = Router();

// GET /api/v1/erp/chat/inbox (Slide 37)
router.get('/inbox', ChatController.getInboxSummary);

// GET /api/v1/erp/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);

// POST /api/v1/erp/chat/message (Agent reply)
router.post('/message', ChatController.sendMessage);

// PATCH /api/v1/erp/chat/rooms/:roomId/read
router.patch('/rooms/:roomId/read', ChatController.markAsRead);

export default router;

