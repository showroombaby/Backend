#!/bin/bash

echo "🗑️  Arrêt des processus PostgreSQL..."
brew services stop postgresql@15

echo "🚀 Redémarrage de PostgreSQL..."
brew services start postgresql@15

echo "⏳ Attente du démarrage de PostgreSQL (5 secondes)..."
sleep 5

echo "🗑️  Suppression de la base de données..."
psql -U postgres -c "DROP DATABASE IF EXISTS showroom_baby;"

echo "🚀 Création de la nouvelle base de données..."
psql -U postgres -c "CREATE DATABASE showroom_baby;"

echo "⚡️ Exécution des migrations..."
npm run migration:run

echo "✅ Base de données réinitialisée avec succès !"
echo "🚀 Pour démarrer le serveur, exécutez : npm run start:dev" 