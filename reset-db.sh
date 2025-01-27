#!/bin/bash

# Configuration de la base de données
DB_NAME="showroom_baby"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Configuration de l'admin par défaut
ADMIN_EMAIL="admin@showroom.com"
ADMIN_PASSWORD="Admin123!"
ADMIN_FIRSTNAME="Admin"
ADMIN_LASTNAME="System"
ADMIN_PASSWORD_HASH='$2b$10$Ncbg4VNisQXnE955uB2LgOjK3xFaqWmPBwSToMgNT6i3HnDSLU3mS'

echo "🗑️  Nettoyage de la base de données..."

# Commande SQL pour supprimer toutes les données sauf les catégories
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME << EOF
-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Supprimer toutes les données des tables dépendantes
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE favorites CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE users CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- Vérifier si l'admin existe déjà
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = '$ADMIN_EMAIL') THEN
        -- Créer l'admin avec le mot de passe hashé
        INSERT INTO users (
            email,
            password,
            first_name,
            last_name,
            role,
            is_email_verified
        ) VALUES (
            '$ADMIN_EMAIL',
            '$ADMIN_PASSWORD_HASH',
            '$ADMIN_FIRSTNAME',
            '$ADMIN_LASTNAME',
            'admin',
            true
        );
        RAISE NOTICE 'Admin user created successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END
\$\$;

-- Créer les logs d'accès pour l'admin
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les permissions d'admin
CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission)
);

-- Insérer toutes les permissions pour l'admin
INSERT INTO admin_permissions (user_id, permission)
SELECT 
    u.id,
    p.permission
FROM users u
CROSS JOIN (
    VALUES 
        ('manage_users'),
        ('manage_products'),
        ('manage_categories'),
        ('manage_reports'),
        ('view_analytics'),
        ('manage_settings')
) AS p(permission)
WHERE u.email = '$ADMIN_EMAIL'
ON CONFLICT (user_id, permission) DO NOTHING;

EOF

echo "✨ Base de données nettoyée !"
echo "📊 État actuel de la base de données :"

# Afficher un résumé des tables
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME << EOF
\echo '\n--- Nombre de catégories ---'
SELECT COUNT(*) as categories_count FROM categories;

\echo '\n--- Utilisateurs par rôle ---'
SELECT role, COUNT(*) FROM users GROUP BY role;

\echo '\n--- Permissions admin ---'
SELECT p.permission, COUNT(*) 
FROM admin_permissions p 
JOIN users u ON p.user_id = u.id 
WHERE u.role = 'admin' 
GROUP BY p.permission;
EOF

echo "✅ Réinitialisation terminée !"
echo "🔑 Identifiants admin :"
echo "Email: $ADMIN_EMAIL"
echo "Mot de passe: $ADMIN_PASSWORD" 