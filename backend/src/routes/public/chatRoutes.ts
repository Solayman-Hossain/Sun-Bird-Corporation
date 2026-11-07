import { Router } from 'express';
import { ChatController } from '../../controllers/ChatController';

const router = Router();

// POST /api/v1/public/chat/message
router.post('/message', ChatController.sendMessage);

// GET /api/v1/public/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', ChatController.getRoomMessages);

export default router;

