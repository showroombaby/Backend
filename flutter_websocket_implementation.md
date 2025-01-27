# Implémentation WebSocket pour Flutter - Messagerie en temps réel

## Table des matières

1. [Installation des dépendances](#installation-des-dépendances)
2. [Service de messagerie](#service-de-messagerie)
3. [Interface utilisateur](#interface-utilisateur)
4. [Gestion de l'état](#gestion-de-létat)

## Installation des dépendances

Ajoutez les dépendances suivantes à votre fichier `pubspec.yaml` :

```yaml
dependencies:
  socket_io_client: ^2.0.3+1
  jwt_decoder: ^2.0.1
```

Exécutez ensuite :

```bash
flutter pub get
```

## Service de messagerie

Créez une classe `MessageService` pour gérer les connexions WebSocket :

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class MessageService {
  late IO.Socket socket;
  final String token;

  MessageService({required this.token}) {
    _initSocket();
  }

  void _initSocket() {
    socket = IO.io('http://votre-api:3000/messaging', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
      'extraHeaders': {'Authorization': 'Bearer $token'}
    });

    // Gestion des événements de connexion
    socket.onConnect((_) {
      print('Connecté à la messagerie');
    });

    socket.onDisconnect((_) {
      print('Déconnecté de la messagerie');
    });

    socket.onConnectError((data) {
      print('Erreur de connexion: $data');
    });

    // Écoute des nouveaux messages
    socket.on('newMessage', (data) {
      print('Nouveau message: $data');
    });

    // Écoute des indicateurs de frappe
    socket.on('userTyping', (data) {
      print('Utilisateur en train d\'écrire: $data');
    });

    socket.connect();
  }

  // Envoyer un message
  void sendMessage({
    required String recipientId,
    required String content,
    String? productId,
  }) {
    socket.emit('message', {
      'recipientId': recipientId,
      'content': content,
      if (productId != null) 'productId': productId,
    });
  }

  // Marquer un message comme lu
  void markMessageAsRead(String messageId) {
    socket.emit('read', {'messageId': messageId});
  }

  // Indiquer que l'utilisateur est en train d'écrire
  void sendTypingIndicator(String recipientId, bool isTyping) {
    socket.emit('typing', {
      'recipientId': recipientId,
      'isTyping': isTyping,
    });
  }

  // Déconnexion
  void disconnect() {
    socket.disconnect();
  }
}
```

## Interface utilisateur

Implémentation d'un écran de chat basique :

```dart
class ChatScreen extends StatefulWidget {
  final String recipientId;

  ChatScreen({required this.recipientId});

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late MessageService messageService;
  final TextEditingController _messageController = TextEditingController();
  List<Message> messages = [];
  bool isTyping = false;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    // Initialiser le service avec votre token JWT
    messageService = MessageService(token: 'votre-jwt-token');

    // Écouter les nouveaux messages
    messageService.socket.on('newMessage', (data) {
      setState(() {
        messages.add(Message.fromJson(data));
      });
    });

    // Écouter les indicateurs de frappe
    messageService.socket.on('userTyping', (data) {
      if (data['userId'] == widget.recipientId) {
        setState(() {
          isTyping = data['isTyping'];
        });
      }
    });
  }

  void _handleTyping() {
    _typingTimer?.cancel();
    messageService.sendTypingIndicator(widget.recipientId, true);

    _typingTimer = Timer(Duration(milliseconds: 1000), () {
      messageService.sendTypingIndicator(widget.recipientId, false);
    });
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    messageService.sendMessage(
      recipientId: widget.recipientId,
      content: _messageController.text,
    );

    _messageController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chat')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) {
                return MessageBubble(message: messages[index]);
              },
            ),
          ),
          if (isTyping)
            Padding(
              padding: EdgeInsets.all(8.0),
              child: Text('En train d\'écrire...'),
            ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: (_) => _handleTyping(),
                    decoration: InputDecoration(
                      hintText: 'Votre message...',
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    messageService.disconnect();
    _typingTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }
}
```

## Gestion de l'état

Utilisation de Provider pour une meilleure gestion de l'état :

```dart
class ChatProvider extends ChangeNotifier {
  final MessageService messageService;
  List<Message> messages = [];
  Map<String, bool> typingUsers = {};

  ChatProvider({required String token})
      : messageService = MessageService(token: token) {
    _initializeListeners();
  }

  void _initializeListeners() {
    messageService.socket.on('newMessage', (data) {
      messages.add(Message.fromJson(data));
      notifyListeners();
    });

    messageService.socket.on('userTyping', (data) {
      typingUsers[data['userId']] = data['isTyping'];
      notifyListeners();
    });
  }

  void sendMessage(String recipientId, String content) {
    messageService.sendMessage(
      recipientId: recipientId,
      content: content,
    );
  }
}
```

## Fonctionnalités incluses

- ✅ Connexion/déconnexion automatique
- ✅ Gestion des messages en temps réel
- ✅ Indicateurs de frappe
- ✅ Gestion des erreurs
- ✅ État de connexion
- ✅ Notifications de lecture des messages

## Événements WebSocket disponibles

### Émission (client vers serveur)

- `message` : Envoyer un nouveau message
- `read` : Marquer un message comme lu
- `typing` : Indiquer que l'utilisateur est en train d'écrire
- `archiveMessage` : Archiver un message
- `unarchiveMessage` : Désarchiver un message

### Réception (serveur vers client)

- `newMessage` : Réception d'un nouveau message
- `messageSent` : Confirmation d'envoi de message
- `messageRead` : Notification de lecture de message
- `userTyping` : Indication qu'un utilisateur est en train d'écrire
- `messageArchived` : Notification d'archivage de message
- `messageUnarchived` : Notification de désarchivage de message

## Notes importantes

1. Remplacez `'http://votre-api:3000'` par l'URL de votre backend
2. Assurez-vous d'avoir un token JWT valide
3. Gérez correctement le cycle de vie des connexions WebSocket
4. Implémentez une logique de reconnexion en cas de perte de connexion
5. Considérez l'ajout d'une mise en cache locale des messages

## Exemple d'utilisation avec Provider

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => ChatProvider(token: 'votre-jwt-token'),
        ),
      ],
      child: MyApp(),
    ),
  );
}
```
