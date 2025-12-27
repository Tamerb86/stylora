/**
 * Dynamic sitemap.xml generator for SEO
 */

export function generateSitemap(): string {
  const baseUrl = 'https://www.stylora.no';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const pages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/funksjoner', priority: '0.9', changefreq: 'weekly' },
    { url: '/priser', priority: '0.9', changefreq: 'weekly' },
    { url: '/faq', priority: '0.8', changefreq: 'weekly' },
    { url: '/om-oss', priority: '0.7', changefreq: 'monthly' },
    { url: '/kundehistorier', priority: '0.7', changefreq: 'monthly' },
    { url: '/kundehistorier/salon-elegance', priority: '0.6', changefreq: 'monthly' },
    { url: '/book', priority: '0.8', changefreq: 'daily' },
  ];

  const urlEntries = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}
