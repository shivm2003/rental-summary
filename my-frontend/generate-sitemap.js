import { SitemapStream, streamToPromise } from 'sitemap';
import fs from 'fs';

const sitemap = new SitemapStream({ hostname: 'https://everythingrental.in' });

sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
sitemap.write({ url: '/rent-bike', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/rent-furniture', changefreq: 'weekly', priority: 0.8 });

sitemap.end();

streamToPromise(sitemap).then(sm => {
  fs.writeFileSync('./public/sitemap.xml', sm);
  console.log('sitemap.xml has been generated successfully!');
}).catch(err => {
  console.error('Error generating sitemap:', err);
});
