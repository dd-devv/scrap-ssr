const fs = require('fs');
const path = require('path');

const apiUrl = 'https://api2.acllabay.com/api/';
const domain = 'https://acllabay.com';

// Función para configurar fetch
function setupFetch() {
  if (typeof fetch === 'undefined') {
    try {
      const fetch = require('node-fetch');
      global.fetch = fetch;
    } catch (error) {
      process.exit(1);
    }
  }
}

// Función para hacer peticiones con manejo correcto de respuestas
async function fetchData(url, description) {

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PrerenderBot/1.0)'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // La API devuelve un array directo, no un objeto con propiedad 'data'
    if (Array.isArray(data)) {

      // Mostrar muestra del primer elemento
      if (data.length > 0) {
        const firstItem = data[0];
      }

      return data;
    } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      return [];
    }

  } catch (error) {
    return [];
  }
}

// Asegurar que la carpeta public existe
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

(async () => {
  try {

    // Configurar fetch
    setupFetch();

    const [productsList, productsOffList] = await Promise.all([
      fetchData(`${apiUrl}scraping/products-public`, 'productos'),
      fetchData(`${apiUrl}scraping/latest-results-public`, 'ofertas')
    ]);

    // Verificar que tenemos datos válidos
    if (productsList.length === 0) {
    } else {
      // Mostrar estadísticas de los productos
      const urlIds = productsList.map(p => p.urlId || p.id || p._id).filter(Boolean);
      const validProducts = urlIds.length;

      if (validProducts !== productsList.length) {
        console.log('   ⚠️ Algunos productos no tienen ID válido');
      }
    }

    // Generar fecha actual en formato ISO
    const currentDate = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      '/',
      '/about',
      '/plans',
      '/contact',
      '/faqs',
      '/tutorials',
      '/seguimientos',
      '/ofertas'
    ];

    const dynamicRoutes = productsList
      .map(product => {
        const urlId = product.urlId || product.id || product._id;
        return urlId ? `/seguimientos/${urlId}` : null;
      })
      .filter(Boolean);

    const dynamicRoutesOff = productsOffList
      .map(product => {
        const urlId = product.urlId || product.id || product._id;
        return urlId ? `/ofertas/${urlId}` : null;
      })
      .filter(Boolean);

    const allRoutes = [...staticRoutes, ...dynamicRoutes, ...dynamicRoutesOff];
    const routesContent = allRoutes.join('\n');

    // Generar en la raíz
    fs.writeFileSync('routes.txt', routesContent);

    // Generar también en public/
    fs.writeFileSync(path.join(publicDir, 'routes.txt'), routesContent);

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Página principal -->
  <url>
    <loc>${domain}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Acerca de -->
  <url>
    <loc>${domain}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Planes -->
  <url>
    <loc>${domain}/plans</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Contacto -->
  <url>
    <loc>${domain}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- FAQs -->
  <url>
    <loc>${domain}/faqs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Tutoriales -->
  <url>
    <loc>${domain}/tutorials</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Seguimientos (página principal) -->
  <url>
    <loc>${domain}/seguimientos</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Ofertas (página principal) -->
  <url>
    <loc>${domain}/ofertas</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Productos individuales -->
${productsList.map(product => {
      const urlId = product.urlId || product.id || product._id;
      if (!urlId) return '';

      const updatedAt = product.updatedAt || product.updated_at || product.lastModified;
      const lastmod = updatedAt ?
        new Date(updatedAt).toISOString().split('T')[0] :
        currentDate;

      return `  <url>
    <loc>${domain}/seguimientos/${urlId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).filter(Boolean).join('\n')}

      <!-- Ofertas -->
${productsOffList.map(product => {
      const urlId = product.urlId || product.id || product._id;
      if (!urlId) return '';

      const updatedAt = product.updatedAt || product.updated_at || product.lastModified;
      const lastmod = updatedAt ?
        new Date(updatedAt).toISOString().split('T')[0] :
        currentDate;

      return `  <url>
    <loc>${domain}/ofertas/${urlId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).filter(Boolean).join('\n')}

</urlset>`;

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);

    // 3. Generar robots.txt
    const robotsContent = `User-agent: *

# Permitir indexación de rutas públicas
Allow: /
Allow: /about
Allow: /plans
Allow: /contact
Allow: /faqs
Allow: /tutorials
Allow: /seguimientos/
Allow: /ofertas/

# Bloquear rutas de autenticación y privadas
Allow: /login
Allow: /register
Disallow: /forgot-password
Disallow: /reset-password/
Disallow: /verify-whatsapp
Allow: /seguimientos
Disallow: /datos
Disallow: /notificaciones

# Permitir sitemap
Allow: /sitemap.xml

# Ubicación del sitemap
Sitemap: ${domain}/sitemap.xml

# Crawl-delay opcional (en segundos)
Crawl-delay: 1`;

    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent);

  } catch (error) {
    process.exit(1);
  }
})();
