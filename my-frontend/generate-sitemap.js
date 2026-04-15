import { SitemapStream, streamToPromise } from 'sitemap';
import fs from 'fs';

const sitemap = new SitemapStream({ hostname: 'https://everythingrental.in' });

sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
sitemap.write({ url: '/about', changefreq: 'monthly', priority: 0.5 });
sitemap.write({ url: '/contact', changefreq: 'monthly', priority: 0.5 });
sitemap.write({ url: '/category/electronics', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/home-furniture', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/fashion', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/sports-fitness', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/automotive', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/jewellery', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/lehenga', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/dresses', changefreq: 'weekly', priority: 0.8 });
sitemap.write({ url: '/category/Home/pg', changefreq: 'weekly', priority: 0.8 });

sitemap.end();

streamToPromise(sitemap).then(sm => {
  fs.writeFileSync('./public/sitemap.xml', sm);
  console.log('sitemap.xml has been generated successfully!');
}).catch(err => {
  console.error('Error generating sitemap:', err);
});
