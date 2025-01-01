import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

export const ApiCreateMessage = () =>
  applyDecorators(
    ApiOperation({ summary: 'Envoyer un nouveau message' }),
    ApiBody({ type: CreateMessageDto }),
    ApiResponse({
      status: 201,
      description: 'Message envoyé avec succès',
      type: Message,
    }),
    ApiResponse({
      status: 400,
      description: 'Données invalides',
    }),
    ApiResponse({
      status: 404,
      description: 'Destinataire ou produit non trouvé',
    }),
  );

export const ApiGetConversations = () =>
  applyDecorators(
    ApiOperation({ summary: 'Récupérer toutes les conversations' }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Numéro de la page (commence à 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: "Nombre d'éléments par page",
    }),
    ApiResponse({
      status: 200,
      description: 'Liste des conversations',
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    otherUser: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string' },
                        avatar: { type: 'string' },
                      },
                    },
                    lastMessage: { $ref: '#/components/schemas/Message' },
                    unreadCount: { type: 'number' },
                    lastMessageDate: { type: 'string', format: 'date-time' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  lastPage: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    }),
  );

export const ApiGetConversation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Récupérer une conversation spécifique' }),
    ApiParam({
      name: 'userId',
      type: 'string',
      description: "ID de l'autre utilisateur",
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Numéro de la page (commence à 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: "Nombre d'éléments par page",
    }),
    ApiResponse({
      status: 200,
      description: 'Messages de la conversation',
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Message' },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  lastPage: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    }),
  );

export const ApiMarkMessageAsRead = () =>
  applyDecorators(
    ApiOperation({ summary: 'Marquer un message comme lu' }),
    ApiParam({
      name: 'messageId',
      type: 'string',
      description: 'ID du message',
    }),
    ApiResponse({
      status: 200,
      description: 'Message marqué comme lu',
      type: Message,
    }),
    ApiResponse({
      status: 404,
      description: 'Message non trouvé',
    }),
  );

export const ApiArchiveConversation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Archiver une conversation' }),
    ApiParam({
      name: 'userId',
      type: 'string',
      description: "ID de l'autre utilisateur",
    }),
    ApiResponse({
      status: 200,
      description: 'Conversation archivée',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
  );

export const ApiUnarchiveConversation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Désarchiver une conversation' }),
    ApiParam({
      name: 'userId',
      type: 'string',
      description: "ID de l'autre utilisateur",
    }),
    ApiResponse({
      status: 200,
      description: 'Conversation désarchivée',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    }),
  );

export const ApiSearchMessages = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rechercher dans les messages' }),
    ApiQuery({
      name: 'query',
      required: false,
      type: String,
      description: 'Texte à rechercher dans les messages',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: String,
      description: "ID de l'utilisateur pour filtrer les messages",
    }),
    ApiQuery({
      name: 'productId',
      required: false,
      type: String,
      description: 'ID du produit pour filtrer les messages',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Numéro de la page (commence à 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: "Nombre d'éléments par page",
    }),
    ApiResponse({
      status: 200,
      description: 'Résultats de la recherche',
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Message' },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  lastPage: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    }),
  );

export function ApiArchiveMessage() {
  return applyDecorators(
    ApiOperation({ summary: 'Archiver un message' }),
    ApiParam({
      name: 'messageId',
      required: true,
      description: 'ID du message à archiver',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Message archivé avec succès',
      type: Message,
    }),
    ApiResponse({
      status: 404,
      description: 'Message non trouvé',
    }),
  );
}

export function ApiUnarchiveMessage() {
  return applyDecorators(
    ApiOperation({ summary: 'Désarchiver un message' }),
    ApiParam({
      name: 'messageId',
      required: true,
      description: 'ID du message à désarchiver',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Message désarchivé avec succès',
      type: Message,
    }),
    ApiResponse({
      status: 404,
      description: 'Message non trouvé',
    }),
  );
}

export function ApiGetArchivedMessages() {
  return applyDecorators(
    ApiOperation({ summary: 'Récupérer les messages archivés' }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Numéro de la page',
      type: Number,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: "Nombre d'éléments par page",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: 'Liste des messages archivés',
      type: Message,
      isArray: true,
    }),
  );
}
