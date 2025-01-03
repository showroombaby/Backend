# Architecture de l'Application

## Vue d'ensemble

L'application est construite sur une architecture modulaire NestJS, suivant les principes SOLID et le pattern Repository. Chaque fonctionnalité majeure est encapsulée dans son propre module.

## Structure des Dossiers

```
src/
├── common/                 # Code partagé entre les modules
│   ├── decorators/        # Décorateurs personnalisés
│   ├── filters/           # Filtres d'exception
│   ├── guards/            # Guards d'authentification
│   ├── interceptors/      # Intercepteurs
│   └── pipes/             # Pipes de validation
├── config/                # Configuration de l'application
│   ├── typeorm.config.ts  # Configuration TypeORM
│   ├── redis.config.ts    # Configuration Redis
│   └── swagger.config.ts  # Configuration Swagger
├── modules/               # Modules de l'application
│   ├── auth/             # Module d'authentification
│   ├── users/            # Module utilisateurs
│   ├── products/         # Module annonces
│   ├── messaging/        # Module messagerie
│   ├── notifications/    # Module notifications
│   └── monitoring/       # Module monitoring
└── main.ts               # Point d'entrée de l'application
```

## Modules Principaux

### AuthModule

Gère l'authentification et l'autorisation :

- Stratégies JWT
- Guards
- Service de tokens
- Vérification d'email
- Reset password

### UsersModule

Gère les utilisateurs et leurs profils :

- CRUD utilisateurs
- Gestion des profils
- Préférences
- Relations avec autres entités

### ProductsModule

Gère les annonces :

- CRUD annonces
- Upload et gestion des images
- Recherche et filtrage
- Géolocalisation
- Favoris

### MessagingModule

Gère la messagerie en temps réel :

- WebSocket Gateway
- Gestion des rooms
- Archivage
- Notifications

### NotificationsModule

Gère les notifications :

- Notifications temps réel
- Push notifications iOS
- Préférences de notification
- Archivage

## Patterns et Principes

### Dependency Injection

Utilisation intensive de l'injection de dépendances de NestJS :

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}
}
```

### Repository Pattern

Chaque entité a son propre repository :

```typescript
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByEmail(email: string): Promise<User> {
    return this.findOne({ where: { email } });
  }
}
```

### Service Layer

Les services encapsulent la logique métier :

```typescript
@Injectable()
export class ProductService {
  async create(dto: CreateProductDto): Promise<Product> {
    // Validation et logique métier
    return this.productRepository.save(product);
  }
}
```

### DTO Pattern

Utilisation de DTOs pour la validation et la transformation des données :

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## Base de Données

### Schéma

Utilisation de TypeORM avec PostgreSQL :

- Migrations automatiques
- Relations
- Indexation
- Soft delete

### Cache

Redis pour :

- Cache de données
- Sessions
- Files d'attente
- Pub/Sub

## Sécurité

### Authentification

- JWT avec rotation des tokens
- Refresh tokens
- Sessions Redis

### Protection

- Helmet pour les headers HTTP
- Rate limiting
- CORS configuré
- Validation des données
- Protection XSS et CSRF

## Performance

### Optimisations

- Cache Redis
- Compression des réponses
- Pagination
- Lazy loading
- Indexation DB

### Monitoring

- Métriques Prometheus
- Logging Winston
- Traces de performance
- Alertes

## WebSocket

### Configuration

```typescript
@WebSocketGateway({
  cors: true,
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
}
```

### Authentification

```typescript
@UseGuards(WsJwtGuard)
async handleConnection(client: Socket) {
  const user = client.data.user;
  await this.handleUserConnection(user, client);
}
```

### Gestion des Events

```typescript
@SubscribeMessage('message')
async handleMessage(
  @MessageBody() data: any,
  @ConnectedSocket() client: Socket,
) {
  // Traitement du message
}
```

## Tests

### Tests Unitaires

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should find a user by email', async () => {
    const user = { id: 1, email: 'test@test.com' };
    repository.findOne.mockReturnValue(user);
    expect(await service.findByEmail('test@test.com')).toEqual(user);
  });
});
```

### Tests d'Intégration

```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password' })
      .expect(200)
      .expect((res) => {
        expect(res.body.token).toBeDefined();
      });
  });
});
```

## Déploiement

### Configuration Production

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});

app.use(helmet());
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Variables d'Environnement

Utilisation de ConfigService :

```typescript
@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {
    const dbHost = this.configService.get<string>('DB_HOST');
  }
}
```

### Monitoring Production

- Métriques Prometheus
- Logging centralisé
- Alertes
- Monitoring des performances
