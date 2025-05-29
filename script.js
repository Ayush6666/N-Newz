const API_KEY = '777bd21504694a1898f19e9bfd864db1';
const newsContainer = document.getElementById('news-container');
const loading = document.getElementById('loading');
const input = document.getElementById('categoryInput');
const categoryButtons = document.querySelectorAll('nav button');
const themeToggle = document.getElementById('themeToggle');

let page = 1;
let isLoading = false;

function getSearchParams() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get('q');
  const category = url.searchParams.get('category');
  if (q) return { mode: 'search', value: q };
  return { mode: 'category', value: category || 'general' };
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
  categoryButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === category);
  });
}

async function fetchNews(reset = false) {
  if (isLoading) return;
  isLoading = true;
  loading.style.display = 'block';

  const { mode, value } = getSearchParams();
  let url = '';

  if (mode === 'search') {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(value)}&pageSize=10&page=${page}&apiKey=${API_KEY}`;
  } else {
    url = `https://newsapi.org/v2/top-headlines?country=us&category=${value}&pageSize=10&page=${page}&apiKey=${API_KEY}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (reset) newsContainer.innerHTML = '';

    if (data.articles && data.articles.length > 0) {
      data.articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" alt="">
          <h2>${article.title}</h2>
          <p>${article.description || 'No description available.'}</p>
          <a href="${article.url}" target="_blank">Read More &rarr;</a>
        `;
        newsContainer.appendChild(card);
        requestAnimationFrame(() => {
          card.classList.add('fade-in');
        });
      });
      page++;
    } else {
      if (reset) newsContainer.innerHTML = `<p>No news found for <b>${value}</b>.</p>`;
    }
  } catch (err) {
    console.error('Error:', err);
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
      page = 1;
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
    page = 1;
    fetchNews(true);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const { mode, value } = getSearchParams();
  if (mode === 'category') setActiveCategory(value);
  else input.value = value;
  fetchNews(true);
}
)