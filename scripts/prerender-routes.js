const fs = require('fs');
const path = require('path');

// Variables configurables
const apiUrl = 'https://api2.acllabay.com/api/';
const domain = 'https://acllabay.com';
const currentDate = new Date().toISOString().split('T')[0];
const publicDir = path.join(__dirname, '..', 'public');
const routesTxtPath = path.join(__dirname, '..', 'routes.txt');
const publicRoutesTxtPath = path.join(publicDir, 'routes.txt');

// Asegurar fetch
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (err) {
    console.error('❌ No se pudo cargar fetch:', err.message);
    process.exit(1);
  }
}

// Asegurar carpeta public
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Borrar versiones anteriores de routes.txt
try {
  if (fs.existsSync(routesTxtPath)) fs.unlinkSync(routesTxtPath);
  if (fs.existsSync(publicRoutesTxtPath)) fs.unlinkSync(publicRoutesTxtPath);
} catch (e) {
  console.warn('⚠️ No se pudo eliminar routes.txt anteriores:', e.message);
}

// Fetch con control de errores
const fetchData = async (url, label) => {
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PrerenderBot/1.0)'
      },
      timeout: 15000
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
  } catch (err) {
    console.warn(`⚠️ Error al obtener ${label}:`, err.message);
    return [];
  }
};

(async () => {
  try {
    const [products, offers] = await Promise.all([
      fetchData(`${apiUrl}scraping/products-public`, 'productos'),
      fetchData(`${apiUrl}scraping/latest-results-public`, 'ofertas')
    ]);

    const staticRoutes = [
      '/', '/about', '/plans', '/contact',
      '/faqs', '/tutorials', '/seguimientos', '/ofertas'
    ];

    // const productRoutes = products.map(p => {
    //   const id = p.urlId || p.id || p._id;
    //   return id ? `/seguimientos/${id}` : null;
    // }).filter(Boolean);

    const offerRoutes = offers.map(p => {
      const id = p.urlId || p.id || p._id;
      return id ? `/ofertas/${id}` : null;
    }).filter(Boolean);

    // Fusionar rutas y eliminar cualquier "/productos"
    const allRoutes = [...staticRoutes, ...offerRoutes].filter(r => r !== '/productos');
    const routesContent = allRoutes.join('\n');

    // Escribir routes.txt
    fs.writeFileSync(routesTxtPath, routesContent);
    fs.writeFileSync(publicRoutesTxtPath, routesContent);

    // Mostrar rutas para depuración
    console.log('\n📄 Rutas que se van a prerenderizar:');
    console.log(allRoutes.join('\n'));

    // Generar sitemap.xml
    const sitemapEntries = [
      ...staticRoutes.map(route => ({
        loc: `${domain}${route}`,
        changefreq: route === '/' ? 'daily' : 'monthly',
        priority: route === '/' ? '1.0' : '0.7',
        lastmod: currentDate
      })),
      ...offers.map(p => {
        const id = p.urlId || p.id || p._id;
        if (!id) return null;
        const mod = p.updatedAt || p.updated_at || p.lastModified;
        return {
          loc: `${domain}/ofertas/${id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: mod ? new Date(mod).toISOString().split('T')[0] : currentDate
        };
      }).filter(Boolean)
    ];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(e => `
  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}\n</urlset>`;

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);

    // Crear robots.txt
    const robotsTxt = `User-agent: *

Allow: /
Allow: /about
Allow: /plans
Allow: /contact
Allow: /faqs
Allow: /tutorials
Allow: /seguimientos/
Allow: /ofertas/

Disallow: /forgot-password
Disallow: /reset-password/
Disallow: /verify-whatsapp
Disallow: /datos
Disallow: /notificaciones

Sitemap: ${domain}/sitemap.xml
Crawl-delay: 1`;

    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);

    console.log(`✅ Rutas generadas: ${allRoutes.length}`);
    console.log(`✅ Sitemap y robots.txt escritos en ${publicDir}`);

  } catch (err) {
    console.error('❌ Error general del script:', err);
    process.exit(1);
  }
})();
