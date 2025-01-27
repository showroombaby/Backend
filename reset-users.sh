#!/bin/bash

# Définir les valeurs par défaut
DB_NAME="showroom_baby"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo "Suppression des utilisateurs non-admin..."

# Commande SQL pour supprimer tous les utilisateurs sauf l'admin
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME << EOF
-- Supprimer d'abord les dépendances (produits, messages, etc.)
DELETE FROM products WHERE seller_id IN (SELECT id FROM users WHERE role != 'admin');
DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE role != 'admin') 
    OR recipient_id IN (SELECT id FROM users WHERE role != 'admin');
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE role != 'admin');
DELETE FROM favorites WHERE user_id IN (SELECT id FROM users WHERE role != 'admin');
DELETE FROM reports WHERE reporter_id IN (SELECT id FROM users WHERE role != 'admin');

-- Supprimer les utilisateurs non-admin
DELETE FROM users WHERE role != 'admin';
EOF

echo "Suppression terminée !"
echo "Nombre d'utilisateurs restants :"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -c "SELECT role, COUNT(*) FROM users GROUP BY role;" 