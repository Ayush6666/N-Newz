const API_KEY = 'pub_26dbb5b22f5c46fa9730e78775239e27';
let nextPageToken = null;
const newsContainer = document.getElementById('news-container');
const loading = document.getElementById('loading');
const input = document.getElementById('categoryInput');
const categoryButtons = document.querySelectorAll('nav button');
const themeToggle = document.getElementById('themeToggle');

let isLoading = false;

// Map categories to your own images
const categoryImages = {
  top: '/images/top.jpg', // For "Headlines" category
  general: '/images/general.jpg',
  technology: '/images/technology.jpg',
  sports: '/images/sports.jpg',
  business: '/images/business.jpg',
  entertainment: '/images/entertainment.jpg',
  science: '/images/science.jpg',
  health: '/images/health.jpg',
  default: '/images/default.jpg' // For search mode or unknown categories
};

// Debug: Log number of category buttons found
console.log('Category buttons found:', categoryButtons.length, Array.from(categoryButtons).map(btn => btn.getAttribute('data-category')));

function getSearchParams() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get('q');
  const category = url.searchParams.get('category');
  if (q) return { mode: 'search', value: q };
  return { mode: 'category', value: category || 'top' };
}

function setQueryInUrl(q) {
  const url = new URL(window.location.href);
  url.searchParams.delete('category');
  url.searchParams.set('q', q);
  window.history.pushState({}, '', url);
}

function setCategoryInUrl(category) {
  const url = new URL(window.location.href);
  url.searchParams.delete('q');
  url.searchParams.set('category', category);
  window.history.pushState({}, '', url);
}

function setActiveCategory(category) {
  console.log('Setting active category:', category);
  let found = false;
  categoryButtons.forEach(btn => {
    const isActive = btn.getAttribute('data-category') === category;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      console.log('Activated button:', btn.textContent, btn.getAttribute('data-category'));
      found = true;
    }
  });
  if (!found && category) {
    console.warn(`No button found for category: ${category}`);
    const fallbackButton = document.querySelector('button[data-category="top"]');
    if (fallbackButton) {
      fallbackButton.classList.add('active');
      console.log('Fallback: Activated Headlines button');
    }
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
}

// Helper function to validate image URLs
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return url.match(/\.(jpeg|jpg|png|gif|webp)$/i) !== null;
  } catch {
    return false;
  }
}

async function fetchNews(reset = false) {
  if (isLoading) return;
  isLoading = true;
  if (!reset) {
    loading.style.display = 'block';
  }
  
  if (reset) {
    nextPageToken = null;
    newsContainer.innerHTML = '';
  }
  
  const { mode, value } = getSearchParams();
  let params = new URLSearchParams();
  params.append('apikey', API_KEY);
  params.append('language', 'en');
  params.append('size', '10');
  
  if (mode === 'search') {
    params.append('q', encodeURIComponent(value));
  } else if (mode === 'category') {
    params.append('category', value);
  }
  
  if (nextPageToken) {
    params.append('page', nextPageToken);
  }
  
  const url = `https://newsdata.io/api/1/news?${params.toString()}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
    }
    const data = await res.json();
    
    if (data.status === 'success') {
      if (data.results && data.results.length > 0) {
        for (const article of data.results) {
          let imageSrc = article.image_url;
          if (!isValidImageUrl(imageSrc)) {
            console.log('Using fallback image for:', article.title, 'image_url:', imageSrc);
            // Use category-specific image or default
            if (mode === 'category' && categoryImages[value]) {
              imageSrc = categoryImages[value];
            } else {
              imageSrc = categoryImages.default;
            }
          }
          
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <img src="${imageSrc}" alt="${article.title}" loading="lazy">
            <h2>${article.title}</h2>
            <small>By ${article.source_id || 'Unknown Source'}</small>
            <p>${article.description || 'No description available.'}</p>
            <small>${formatDate(article.pubDate)}</small>
            <a href="${article.link}" target="_blank">Read More →</a>
          `;
          newsContainer.appendChild(card);
          requestAnimationFrame(() => {
            card.classList.add('fade-in');
          });
        }
      } else {
        const fallbackImage = mode === 'category' ? (categoryImages[value] || categoryImages.default) : categoryImages.default;
        newsContainer.innerHTML = `
          <p>No news found for <b>${value}</b>.</p>
          <img src="${fallbackImage}" alt="No news available" style="max-width: 100%;">
        `;
      }
      nextPageToken = data.nextPage || null;
    } else {
      console.error('API error:', data);
      if (reset) newsContainer.innerHTML = `<p>Error: ${data.message || 'Failed to fetch news'}</p>`;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    if (reset) newsContainer.innerHTML = `<p>Error: ${err.message}</p>`;
  } finally {
    isLoading = false;
    loading.style.display = 'none';
  }
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = input.value.trim();
    if (val) {
      setQueryInUrl(val);
      setActiveCategory(null);
      fetchNews(true);
    }
  }
});

categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.getAttribute('data-category');
    setCategoryInUrl(cat);
    input.value = '';
    setActiveCategory(cat);
    fetchNews(true);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting initial state');
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    if (localStorage.getItem('theme') === 'dark-mode') {
      document.body.classList.add('dark-mode');
      themeToggle.checked = true;
    }
    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode');
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark-mode');
      } else {
        localStorage.removeItem('theme');
      }
    });
  }
  
  const { mode, value } = getSearchParams();
  console.log('Initial mode:', mode, 'value:', value);
  if (mode === 'category') {
    setActiveCategory(value); // Ensure "Headlines" (top) is active by default
  } else if (mode === 'search') {
    input.value = value;
    setActiveCategory(null);
  }
  fetchNews(true);
});

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    fetchNews();
  }
});
