import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Message } from './entities/message.entity';

export const ApiWebSocketConnection = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Connexion WebSocket',
      description: `
Pour établir une connexion WebSocket :

\`\`\`javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'votre-token-jwt'
  }
});
\`\`\`
      `,
    }),
    ApiResponse({
      status: 101,
      description: 'Connexion WebSocket établie',
    }),
    ApiResponse({
      status: 401,
      description: 'Token JWT invalide ou manquant',
    }),
  );

export const ApiSendMessage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Envoyer un message',
      description: `
Émet un événement 'message' avec les données suivantes :

\`\`\`javascript
socket.emit('message', {
  recipientId: 'id-destinataire',
  content: 'Contenu du message',
  productId: 'id-produit' // Optionnel
});
\`\`\`
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Message envoyé avec succès',
      type: Message,
    }),
  );

export const ApiTypingIndicator = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Indicateur de frappe',
      description: `
Émet un événement 'typing' :

\`\`\`javascript
socket.emit('typing', {
  recipientId: 'id-destinataire',
  isTyping: true
});
\`\`\`
      `,
    }),
  );

export const ApiMarkAsRead = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Marquer comme lu',
      description: `
Émet un événement 'read' :

\`\`\`javascript
socket.emit('read', {
  messageId: 'id-message'
});
\`\`\`
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Message marqué comme lu',
      type: Message,
    }),
  );
