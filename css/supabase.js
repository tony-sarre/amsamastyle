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
async function loadReviews() {
  var grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  
  try {
    var reviews = await supabase.select('reviews', 'approved=eq.true&order=created_at.desc&limit=12');
    
    if (reviews.length > 0) {
      grid.innerHTML = reviews.map(function(r) {
        return '<div class="review-card">' +
          '<div class="review-stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div>' +
          '<p class="review-text">"' + escapeHtml(r.message) + '"</p>' +
          '<div class="review-author">' + escapeHtml(r.name) + '</div>' +
          '<div class="review-location">' + escapeHtml(r.city || 'Canada') + '</div>' +
        '</div>';
      }).join('');
    }
  } catch (e) {
    console.log('Erreur chargement avis:', e);
  }
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

  var result = await supabase.insert('reviews', {
    name: name,
    city: city,
    rating: rating,
    message: text
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
  var data = {
    first_name: form.querySelector('[name="prenom"]').value.trim(),
    last_name: form.querySelector('[name="nom"]').value.trim(),
    email: form.querySelector('[name="email"]').value.trim(),
    phone: form.querySelector('[name="phone"]').value.trim(),
    description: form.querySelector('[name="description"]').value.trim()
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
