#!/bin/bash

# Obtenir un nouveau token JWT pour l'admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@showroom.com","password":"Admin123!"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Récupérer les IDs des catégories
echo "📋 Récupération des IDs des catégories..."
CATEGORIES=$(psql -U postgres -d showroom_baby -t -A -F "," -c "SELECT id, name FROM categories;")

# Extraire les IDs par nom de catégorie
POUSSETTES_ID=$(echo "$CATEGORIES" | grep "Poussettes" | cut -d',' -f1)
VETEMENTS_ID=$(echo "$CATEGORIES" | grep "Vêtements" | cut -d',' -f1)
EVEIL_ID=$(echo "$CATEGORIES" | grep "Éveil et Loisirs" | cut -d',' -f1)
MOBILIER_ID=$(echo "$CATEGORIES" | grep "Mobilier" | cut -d',' -f1)
EQUIPEMENT_ID=$(echo "$CATEGORIES" | grep "Équipement" | cut -d',' -f1)

# Fonction pour créer un produit avec des images
create_product() {
    local title="$1"
    local description="$2"
    local price="$3"
    local category_id="$4"
    local condition="$5"
    local city="$6"
    local address="$7"
    local zipCode="$8"
    local phone="$9"
    local latitude="${10}"
    local longitude="${11}"
    shift 11
    local images=("$@")
    
    # Créer la commande curl avec les images
    cmd="curl -s -X POST http://localhost:3000/products"
    cmd="$cmd -H \"Authorization: Bearer $TOKEN\""
    cmd="$cmd -F \"title=$title\""
    cmd="$cmd -F \"description=$description\""
    cmd="$cmd -F \"price=$price\""
    cmd="$cmd -F \"categoryId=$category_id\""
    cmd="$cmd -F \"condition=$condition\""
    cmd="$cmd -F \"city=$city\""
    cmd="$cmd -F \"address=$address\""
    cmd="$cmd -F \"zipCode=$zipCode\""
    cmd="$cmd -F \"phone=$phone\""
    cmd="$cmd -F \"latitude=$latitude\""
    cmd="$cmd -F \"longitude=$longitude\""
    
    # Ajouter les images à la commande
    for image in "${images[@]}"; do
        cmd="$cmd -F \"images=@$image\""
    done
    
    # Exécuter la commande
    eval "$cmd"
}

echo "🌱 Création des produits..."

# Créer les produits avec leurs images
create_product \
    "Poussette YOYO² complète" \
    "Poussette YOYO² de BABYZEN complète 0-48m. Utilisée pendant 6 mois, excellent état. Coloris noir. Livrée avec son sac de transport." \
    450 \
    "$POUSSETTES_ID" \
    "like_new" \
    "Paris" \
    "15 Rue de la Paix" \
    "75002" \
    "0612345678" \
    48.8566 \
    2.3522 \
    "seed-images/poussette1.jpg" "seed-images/poussette2.jpg"

create_product \
    "Lot de vêtements bébé 3-6 mois" \
    "Lot de 15 vêtements bébé fille 3-6 mois. Marques diverses (Petit Bateau, Zara, H&M). Excellent état, sans taches." \
    45 \
    "$VETEMENTS_ID" \
    "good" \
    "Lyon" \
    "25 Rue de la République" \
    "69002" \
    "0623456789" \
    45.7578 \
    4.8320 \
    "seed-images/vetements1.jpg"

create_product \
    "Tapis d'éveil Sophie la Girafe" \
    "Tapis d'éveil Sophie la Girafe avec arches et jouets suspendus. Utilisé 3 mois, comme neuf. Lavé et désinfecté." \
    35 \
    "$EVEIL_ID" \
    "like_new" \
    "Marseille" \
    "45 Rue Paradis" \
    "13006" \
    "0634567890" \
    43.2965 \
    5.3698 \
    "seed-images/tapis1.jpg" "seed-images/tapis2.jpg"

create_product \
    "Lit bébé évolutif IKEA" \
    "Lit bébé SUNDVIK IKEA blanc, convertible en lit enfant. Utilisé 1 an, bon état. Vendu avec son matelas et 2 draps housses." \
    120 \
    "$MOBILIER_ID" \
    "good" \
    "Bordeaux" \
    "10 Cours de l'Intendance" \
    "33000" \
    "0645678901" \
    44.8378 \
    -0.5792 \
    "seed-images/lit1.jpg"

create_product \
    "Siège auto Cybex groupe 0+/1" \
    "Siège auto Cybex Cloud Z i-Size avec base. Acheté il y a 6 mois, état impeccable. Conforme aux dernières normes de sécurité." \
    280 \
    "$EQUIPEMENT_ID" \
    "like_new" \
    "Lille" \
    "100 Rue Nationale" \
    "59000" \
    "0656789012" \
    50.6292 \
    3.0573 \
    "seed-images/siege1.jpg" "seed-images/siege2.jpg"

echo "✅ Produits créés avec succès !" 