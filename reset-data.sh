#!/bin/bash

echo "🗑️  Suppression des produits et des utilisateurs (sauf admin)..."

# Se connecter à la base de données et exécuter les requêtes SQL
psql -U postgres -d showroom_baby << EOF
-- Supprimer d'abord les images des produits (table liée)
DELETE FROM product_images;

-- Supprimer tous les produits
DELETE FROM products;

-- Supprimer tous les utilisateurs sauf l'admin
DELETE FROM users 
WHERE email != 'admin@showroom.com';

-- Réinitialiser les séquences
SELECT setval(pg_get_serial_sequence('products', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('product_images', 'id'), 1, false);
EOF

echo "✅ Données réinitialisées avec succès !"
echo "🔐 Le compte admin et les catégories ont été préservés" 