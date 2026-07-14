// ============================================================
// _data/products.js
// ------------------------------------------------------------
// Le catalogue est désormais chargé en DIRECT depuis Supabase
// (côté navigateur, voir assets/js/supabase.js).
// Eleventy n'a donc plus besoin de générer les cartes au build.
//
// On renvoie une liste VIDE pour deux raisons :
//  1. La boucle {% for p in products %} ne plante pas au build.
//  2. La grille reste vide dans le HTML, puis JS la remplit.
//
// ⚠️ Si tu veux revenir à un catalogue généré au build (Façon 2),
//    il suffira de remettre ici la lecture d'un fichier de données.
// ============================================================
module.exports = [];
