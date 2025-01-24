#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZGRkNWEwMC03ODhjLTQ1MDItYWU2ZC05MzdkZjFlYzQ2MTUiLCJlbWFpbCI6ImFkbWluQHNob3dyb29tLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNzY2OTI5NCwiZXhwIjoxNzM3NzU1Njk0fQ.sj-H5cLlPHdzMU4n3LO39upHBjxZd2YfXpwLV-LQNE4"

# Fonction pour créer une catégorie
create_category() {
    local name="$1"
    local description="$2"
    
    curl -X POST http://localhost:3000/categories \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer $TOKEN" \
         -d "{\"name\":\"$name\",\"description\":\"$description\"}"
    echo
}

# Création des catégories
create_category "Poussettes" "Poussettes et accessoires de transport"
create_category "Vêtements" "Vêtements pour bébé et enfant"
create_category "Jouets" "Jouets et jeux pour tous les âges"
create_category "Mobilier" "Lits, commodes, tables à langer et autres meubles"
create_category "Équipement" "Sièges auto, transats, chaises hautes"
create_category "Puériculture" "Articles de soin et d'hygiène"
create_category "Alimentation" "Biberons, chauffe-biberons, stérilisateurs"
create_category "Éveil et Loisirs" "Tapis d'éveil, livres, instruments de musique"
create_category "Sécurité" "Barrières, moniteurs, protections"
create_category "Autres" "Autres articles pour bébé et enfant" 