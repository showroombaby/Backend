import { config } from 'dotenv';
import { join } from 'path';

// Charger les variables d'environnement de test
config({ path: join(__dirname, '../../config/test.env') });

// Configuration globale pour Jest
jest.setTimeout(30000); // 30 secondes

// Mock des services externes
jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ sub: '1', email: 'test@example.com' }),
  })),
}));

// Mock du service de stockage
jest.mock('../../modules/storage/services/storage.service', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue('test-image.jpg'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock du service d'email
jest.mock('../../modules/email/services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  })),
}));
