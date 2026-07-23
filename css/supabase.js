// =============================================
// AMSAMA STYLE - Supabase Integration
// =============================================
// REMPLACE ces valeurs par celles de ton projet Supabase
// Tu les trouves dans : Supabase > Settings > API
const SUPABASE_URL = 'https://lrlnsehmfqyjvfrygcyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybG5zZWhtZnF5anZmcnlnY3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg4OTYsImV4cCI6MjA5MTAzNDg5Nn0.QA8lbZS_atYb5iUrqSP2XoW7i0nb38DdvRnJv20no50';

// Client Supabase simple (sans librairie externe)
const supabase = {
  async insert(table, data) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    return { ok: res.ok, status: res.status };
  },
  async select(table, query) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*&' + (query || ''), {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    return res.ok ? await res.json() : [];
  }
};

// =============================================
// CHARGER LES AVIS APPROUVÉS
// =============================================
var _reviews = [];
async function loadReviews() {
  var grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  try {
    _reviews = await supabase.select('reviews', 'approved=eq.true&order=created_at.desc&limit=12');
    renderReviews();
  } catch (e) {
    console.log('Erreur chargement avis:', e);
  }
}

function renderReviews() {
  var grid = document.getElementById('reviewsGrid');
  if (!grid || !_reviews.length) return;
  var lang = currentLang();
  grid.innerHTML = _reviews.map(function(r) {
    // choisir la version selon la langue, avec repli
    var txt;
    if (lang === 'en') txt = r.message_en || r.message_fr || r.message;
    else               txt = r.message_fr || r.message || r.message_en;
    return '<div class="review-card">' +
      '<div class="review-stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div>' +
      '<p class="review-text">"' + escapeHtml(txt || '') + '"</p>' +
      '<div class="review-author">' + escapeHtml(r.name) + '</div>' +
      '<div class="review-location">' + escapeHtml(r.city || 'Canada') + '</div>' +
    '</div>';
  }).join('');
}

// =============================================
// SOUMETTRE UN AVIS
// =============================================
async function submitReview() {
  var name = document.getElementById('revName').value.trim();
  var city = document.getElementById('revCity').value.trim();
  var text = document.getElementById('revText').value.trim();
  var rating = window._currentRating || 0;

  if (!name || !text || !rating) {
    showNotif(document.body.classList.contains('en') 
      ? 'Please fill all fields and give a rating.' 
      : 'Remplissez tous les champs et donnez une note.');
    return;
  }

  var lang = currentLang();
  var result = await supabase.insert('reviews', {
    name: name,
    city: city,
    rating: rating,
    message: text,
    lang: lang,
    message_fr: lang === 'fr' ? text : null,
    message_en: lang === 'en' ? text : null
  });

  if (result.ok) {
    showNotif(document.body.classList.contains('en')
      ? 'Thank you! Your review will appear after approval.'
      : 'Merci ! Votre avis apparaîtra après validation.');
    document.getElementById('revName').value = '';
    document.getElementById('revCity').value = '';
    document.getElementById('revText').value = '';
    window._currentRating = 0;
    document.querySelectorAll('#starRating span').forEach(function(s) { s.classList.remove('active'); });
  } else {
    showNotif(document.body.classList.contains('en')
      ? 'Error sending your review. Please try again.'
      : 'Erreur lors de l\'envoi. Veuillez réessayer.');
  }
}

// =============================================
// SOUMETTRE UNE COMMANDE
// =============================================
async function submitOrder(form) {
  var prod = form.querySelector('[name="product_name"]');
  var data = {
    first_name: form.querySelector('[name="prenom"]').value.trim(),
    last_name: form.querySelector('[name="nom"]').value.trim(),
    email: form.querySelector('[name="email"]').value.trim(),
    phone: form.querySelector('[name="phone"]').value.trim(),
    description: form.querySelector('[name="description"]').value.trim(),
    product_name: prod ? prod.value.trim() : null
  };

  var result = await supabase.insert('orders', data);

  if (result.ok) {
    showNotif(document.body.classList.contains('en')
      ? 'Order submitted! Aminata will contact you within 24h.'
      : 'Commande envoyée ! Aminata vous contactera sous 24h.');
    form.reset();
  } else {
    showNotif(document.body.classList.contains('en')
      ? 'Error. Please try again or use WhatsApp.'
      : 'Erreur. Réessayez ou utilisez WhatsApp.');
  }
}

// =============================================
// SOUMETTRE UN MESSAGE DE CONTACT
// =============================================
async function submitContact(form) {
  var data = {
    name: form.querySelector('[name="name"]').value.trim(),
    email: form.querySelector('[name="email"]').value.trim(),
    message: form.querySelector('[name="message"]').value.trim()
  };

  var result = await supabase.insert('messages', data);

  if (result.ok) {
    showNotif(document.body.classList.contains('en')
      ? 'Message sent!'
      : 'Message envoyé !');
    form.reset();
  } else {
    showNotif(document.body.classList.contains('en')
      ? 'Error. Please try again.'
      : 'Erreur. Réessayez.');
  }
}

// =============================================
// UTILITAIRES
// =============================================
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotif(msg) {
  var el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 4000);
}

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // Charger les avis approuvés
  loadReviews();

  // Formulaire de commande
  var orderForm = document.querySelector('form[name="orders"]');
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitOrder(this);
    });
  }

  // Formulaire de contact
  var contactForm = document.querySelector('form[name="contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitContact(this);
    });
  }

  // Bouton soumettre avis
  var revBtn = document.getElementById('revSubmit');
  if (revBtn) {
    revBtn.addEventListener('click', submitReview);
  }

  // Étoiles de notation
  window._currentRating = 0;
  document.querySelectorAll('#starRating span').forEach(function(s, i) {
    s.addEventListener('click', function() {
      window._currentRating = i + 1;
      document.querySelectorAll('#starRating span').forEach(function(x, j) {
        x.classList.toggle('active', j <= i);
      });
    });
  });
});

// =============================================
// CATALOGUE DYNAMIQUE — adapté structure Eleventy bilingue
// Grille #productsGrid, filtres #filterBtns (data-f),
// cartes .product-card (data-cat). Bilingue via .lang-fr/.lang-en
// =============================================
var WHATSAPP = '14318667385';
var _products = [];

function currentLang() {
  // le site bascule via une classe sur <body> ; par défaut FR
  return document.body.classList.contains('en') ? 'en' : 'fr';
}

async function loadProductsCatalog() {
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  try {
    _products = await supabase.select('products', 'published=eq.true&order=sort_order.asc');
    renderCatalog();
  } catch (e) {
    console.log('Erreur produits:', e);
  }
}

function renderCatalog() {
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  // On rend TOUTES les cartes ; le filtre de layout.njk se charge
  // ensuite d'afficher/masquer selon la catégorie active.
  var list = _products;

  if (!list.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--terre-light,#999);padding:2rem">'
      + '<span class="lang-fr">Aucun article pour le moment.</span>'
      + '<span class="lang-en">No items yet.</span></p>';
    applyLang();
    return;
  }

  grid.innerHTML = list.map(function (p) {
    var nameFr = p.name_fr || '';
    var nameEn = p.name_en || p.name_fr || '';
    var badge = '';
    if (p.badge_fr || p.badge_en) {
      badge = '<div class="product-badge">'
        + '<span class="lang-fr">' + escapeHtml(p.badge_fr || '') + '</span>'
        + '<span class="lang-en">' + escapeHtml(p.badge_en || p.badge_fr || '') + '</span></div>';
    }
    var unit = p.unit || '';
    var oldPrice = p.old_price
      ? ' <span class="old">CAD $' + p.old_price + '</span>' : '';
    var waFr = 'https://wa.me/' + WHATSAPP + '?text='
      + encodeURIComponent('Bonjour ! Je suis intéressé(e) par ' + nameFr + ' (CAD $' + (p.price || '') + ')');
    var waEn = 'https://wa.me/' + WHATSAPP + '?text='
      + encodeURIComponent('Hello! Interested in ' + nameEn + ' (CAD $' + (p.price || '') + ')');

    return '<div class="product-card" data-cat="' + escapeHtml(p.category) + '">'
      + '<div class="product-img">'
      +   '<img src="' + escapeHtml(p.image || '') + '" alt="' + escapeHtml(nameFr) + '" loading="lazy">'
      +   badge
      + '</div>'
      + '<div class="product-info">'
      +   '<div class="product-category">' + escapeHtml(p.category) + '</div>'
      +   '<div class="product-name">'
      +     '<span class="lang-fr">' + escapeHtml(nameFr) + '</span>'
      +     '<span class="lang-en">' + escapeHtml(nameEn) + '</span>'
      +   '</div>'
      +   '<div class="product-price">' + (p.price != null ? 'CAD $' + p.price : '') + escapeHtml(unit) + oldPrice + '</div>'
      +   '<div class="product-actions">'
      +     '<a href="' + waFr + '" class="btn-add-cart lang-fr" target="_blank">Commander</a>'
      +     '<a href="' + waEn + '" class="btn-add-cart lang-en" target="_blank">Order</a>'
      +     '<a href="' + waFr + '" class="btn-wa-small" target="_blank">WA</a>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }).join('');
  applyLang();
  reapplyActiveFilter();
}

// Ré-applique l'affichage de langue aux éléments injectés
function applyLang() {
  var en = currentLang() === 'en';
  document.querySelectorAll('#productsGrid .lang-fr').forEach(function (el) {
    el.style.display = en ? 'none' : '';
  });
  document.querySelectorAll('#productsGrid .lang-en').forEach(function (el) {
    el.style.display = en ? '' : 'none';
  });
}

// NOTE : le filtre par catégorie est DÉJÀ géré par ton layout.njk
// (le <script> en bas de page qui écoute .filter-btn et lit data-cat).
// On ne le redéfinit donc PAS ici, pour éviter tout doublon.
// On se contente de ré-appliquer le filtre actif après que les cartes
// ont été injectées (sinon le filtre du layout n'a rien à filtrer au
// chargement, puisque la grille est encore vide à ce moment-là).
function reapplyActiveFilter() {
  var activeBtn = document.querySelector('#filterBtns .filter-btn.active');
  var f = activeBtn ? activeBtn.getAttribute('data-f') : 'all';
  document.querySelectorAll('.product-card').forEach(function (c) {
    c.style.display = (f === 'all' || c.getAttribute('data-cat') === f) ? '' : 'none';
  });
}

// Contenu éditable du site — stocke la map globale pour le bilingue
var _content = {};

async function loadSiteContentDynamic() {
  try {
    var rows = await supabase.select('site_content', '');
    _content = {};
    rows.forEach(function (r) { _content[r.key] = r.value; });
    applyContent();
  } catch (e) { console.log('content:', e); }
}

// Applique les textes. Pour un élément data-sc="cle", si des variantes
// _fr/_en existent, on choisit selon la langue ; sinon valeur simple.
function applyContent() {
  var lang = currentLang();
  document.querySelectorAll('[data-sc]').forEach(function (el) {
    var k = el.getAttribute('data-sc');
    var val = null;
    if (_content[k + '_' + lang] != null) val = _content[k + '_' + lang];
    else if (_content[k] != null) val = _content[k];

    var attr = el.getAttribute('data-sc-attr');
    var isSocial = el.hasAttribute('data-social');

    if (isSocial) {
      // lien réseau social : masqué si vide, sinon href renseigné
      if (val && val.trim()) {
        el.setAttribute('href', val);
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
      return;
    }

    if (val != null) {
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    }
  });
}

// SERVICES dynamiques
async function loadServices() {
  var grid = document.getElementById('servicesGrid');
  if (!grid) return;
  try {
    var rows = await supabase.select('services', 'order=sort_order.asc');
    if (!rows.length) return;
    grid.innerHTML = rows.map(function (s) {
      return '<div class="service-card">'
        + '<div class="service-icon">' + escapeHtml(s.icon || '') + '</div>'
        + '<h3><span class="lang-fr">' + escapeHtml(s.title_fr || '') + '</span>'
        +     '<span class="lang-en">' + escapeHtml(s.title_en || s.title_fr || '') + '</span></h3>'
        + '<p><span class="lang-fr">' + escapeHtml(s.desc_fr || '') + '</span>'
        +    '<span class="lang-en">' + escapeHtml(s.desc_en || s.desc_fr || '') + '</span></p>'
        + '<div class="price">' + escapeHtml(s.price || '') + '</div>'
        + '</div>';
    }).join('');
    applyLangIn('#servicesGrid');
  } catch (e) { console.log('services:', e); }
}

// TRENDS dynamiques
async function loadTrends() {
  var grid = document.getElementById('trendsGrid');
  if (!grid) return;
  try {
    var rows = await supabase.select('trends', 'order=sort_order.asc');
    if (!rows.length) return;
    grid.innerHTML = rows.map(function (t, i) {
      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      return '<div class="trend-card">'
        + '<div class="trend-num">' + num + '</div>'
        + '<div><h3><span class="lang-fr">' + escapeHtml(t.title_fr || '') + '</span>'
        +         '<span class="lang-en">' + escapeHtml(t.title_en || t.title_fr || '') + '</span></h3>'
        + '<p><span class="lang-fr">' + escapeHtml(t.desc_fr || '') + '</span>'
        +    '<span class="lang-en">' + escapeHtml(t.desc_en || t.desc_fr || '') + '</span></p></div>'
        + '</div>';
    }).join('');
    applyLangIn('#trendsGrid');
  } catch (e) { console.log('trends:', e); }
}

// Applique la langue à un conteneur injecté dynamiquement
function applyLangIn(selector) {
  var en = currentLang() === 'en';
  document.querySelectorAll(selector + ' .lang-fr').forEach(function (el) {
    el.style.display = en ? 'none' : '';
  });
  document.querySelectorAll(selector + ' .lang-en').forEach(function (el) {
    el.style.display = en ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  loadProductsCatalog();
  loadSiteContentDynamic();
  loadServices();
  loadTrends();
  // au changement de langue, on réapplique tout
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      setTimeout(function () {
        applyLang();
        applyContent();
        applyLangIn('#servicesGrid');
        applyLangIn('#trendsGrid');
        renderReviews();
      }, 50);
    });
  });
});
