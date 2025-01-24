#!/bin/bash

# Obtenir le token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@showroom.com","password":"Admin123!"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Créer le produit
curl -s -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Produit",
    "description": "Description test",
    "price": 100,
    "categoryId": "76a8a8b2-ac93-4271-abbf-8528767ca68e",
    "condition": "like_new",
    "city": "Paris",
    "address": "1 rue de la Paix",
    "zipCode": "75001",
    "phone": "0123456789",
    "latitude": 48.8566,
    "longitude": 2.3522
  }' | jq . 