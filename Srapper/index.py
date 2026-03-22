"""
Complete Product Scraper with Image Download
For ResNet50 Feature Extraction + XGBoost Price Estimation
Downloads: Images locally + CSV with all metadata
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import time
import random
import re
import os
import hashlib
from urllib.parse import urljoin, quote_plus, urlparse
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import List, Dict, Optional
from pathlib import Path
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Selenium for Facebook
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# curl_cffi for Amazon (bypasses bot detection)
from curl_cffi import requests as curl_requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class ProductData:
    """Complete data structure for price estimation model"""
    source: str
    product_id: str
    title: str
    price: float
    currency: str
    category: str
    condition: str  # new, used, like_new, good, fair, poor
    age: float  # in years, 0 for new
    brand: str
    location: str
    description: str
    specifications: Dict
    image_urls: List[str] = field(default_factory=list)
    local_image_paths: List[str] = field(default_factory=list)  # Downloaded image paths
    reviews_count: int = 0
    rating: float = 0.0
    url: str = ""
    scraped_at: str = ""
    seller_name: str = ""
    seller_rating: float = 0.0


class ImageDownloader:
    """Handles image downloading with retry logic and organization"""
    
    def __init__(self, base_dir="dataset/images"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36'
        })
        
    def download_image(self, url: str, product_id: str, source: str, index: int = 0) -> Optional[str]:
        """Download single image and return local path"""
        if not url or not url.startswith('http'):
            return None
            
        try:
            # Create source-specific subdirectory
            source_dir = self.base_dir / source.lower()
            source_dir.mkdir(exist_ok=True)
            
            # Generate filename
            ext = self._get_extension(url)
            filename = f"{product_id}_{index}{ext}"
            filepath = source_dir / filename
            
            # Skip if already exists
            if filepath.exists():
                return str(filepath)
            
            # Download with retry
            for attempt in range(3):
                try:
                    response = self.session.get(url, timeout=30, stream=True)
                    if response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            for chunk in response.iter_content(1024):
                                f.write(chunk)
                        return str(filepath)
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    logger.error(f"Attempt {attempt + 1} failed for {url}: {e}")
                    
        except Exception as e:
            logger.error(f"Error downloading image {url}: {e}")
        
        return None
    
    def _get_extension(self, url: str) -> str:
        """Extract image extension from URL"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        if '.jpg' in path or '.jpeg' in path:
            return '.jpg'
        elif '.png' in path:
            return '.png'
        elif '.webp' in path:
            return '.webp'
        else:
            return '.jpg'  # Default
    
    def download_product_images(self, product: ProductData, max_images: int = 5) -> List[str]:
        """Download all images for a product"""
        local_paths = []
        
        for i, url in enumerate(product.image_urls[:max_images]):
            path = self.download_image(url, product.product_id, product.source, i)
            if path:
                local_paths.append(path)
            time.sleep(random.uniform(0.5, 1.5))  # Be nice to servers
        
        return local_paths


class AmazonScraper:
    """Amazon scraper with full metadata extraction and image download"""
    
    def __init__(self, use_proxies=False):
        self.base_url = "https://www.amazon.com"
        self.session = curl_requests.Session()
        self.use_proxies = use_proxies
        self.image_downloader = ImageDownloader()
        
        self.headers_pool = [
            {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
            }
        ]
        
    def _get_headers(self):
        headers = random.choice(self.headers_pool).copy()
        headers['X-Forwarded-For'] = f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        return headers
    
    def _safe_request(self, url, max_retries=3):
        """Make safe request with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.session.get(
                    url, 
                    headers=self._get_headers(),
                    timeout=30,
                    impersonate="chrome"
                )
                
                if response.status_code == 200:
                    if any(x in response.text.lower() for x in ['captcha', 'robot check']):
                        logger.warning(f"CAPTCHA detected, attempt {attempt + 1}")
                        time.sleep(random.uniform(5, 10))
                        continue
                    return response
                elif response.status_code == 503:
                    time.sleep(random.uniform(3, 7))
                else:
                    time.sleep(random.uniform(2, 5))
            except Exception as e:
                logger.error(f"Request error: {e}")
                time.sleep(random.uniform(2, 5))
        return None
    
    def search_products(self, query, max_pages=3):
        """Search and return ASINs"""
        asins = []
        encoded_query = quote_plus(query)
        
        for page in range(1, max_pages + 1):
            url = f"{self.base_url}/s?k={encoded_query}&page={page}"
            logger.info(f"Searching Amazon page {page}: {query}")
            
            response = self._safe_request(url)
            if not response:
                continue
            
            soup = BeautifulSoup(response.text, 'lxml')
            products = soup.find_all('div', {'data-component-type': 's-search-result'})
            
            for product in products:
                asin = product.get('data-asin')
                if asin and asin not in asins:
                    asins.append(asin)
            
            time.sleep(random.uniform(2, 4))
        
        return asins
    
    def scrape_product_details(self, asin: str) -> Optional[ProductData]:
        """Scrape full product details"""
        url = f"{self.base_url}/dp/{asin}"
        logger.info(f"Scraping Amazon product: {asin}")
        
        response = self._safe_request(url)
        if not response:
            return None
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        try:
            data = {
                'source': 'Amazon',
                'product_id': asin,
                'url': url,
                'scraped_at': datetime.now().isoformat(),
                'condition': 'New',
                'age': 0.0,
                'location': 'Online',
                'seller_name': 'Amazon',
            }
            
            # Title
            title_elem = soup.find('span', {'id': 'productTitle'})
            data['title'] = title_elem.get_text(strip=True) if title_elem else "Unknown"
            
            # Brand extraction
            brand_elem = soup.find('a', {'id': 'bylineInfo'}) or soup.find('span', class_='a-size-medium a-color-base')
            if brand_elem:
                brand_text = brand_elem.get_text(strip=True)
                # Clean up "Visit the [Brand] Store" or "Brand: [Brand]"
                brand_match = re.search(r'(?:Visit the|Brand:)\s*(\w+)', brand_text)
                data['brand'] = brand_match.group(1) if brand_match else brand_text.split()[0]
            else:
                # Try to extract from title
                data['brand'] = data['title'].split()[0] if data['title'] else "Unknown"
            
            # Price extraction (multiple selectors)
            price = 0.0
            price_selectors = [
                'span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay span.a-offscreen',
                'span.a-price.a-text-price.a-size-medium.apexPriceToPay span.a-offscreen',
                'span.a-price-whole',
                'span.a-price.a-text-price span.a-offscreen'
            ]
            
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    price_match = re.search(r'[\d,]+\.?\d*', price_text.replace(',', ''))
                    if price_match:
                        price = float(price_match.group())
                        break
            
            data['price'] = price
            data['currency'] = 'USD'
            
            # Rating and Reviews
            rating_elem = soup.find('span', {'id': 'acrPopover'})
            data['rating'] = 0.0
            if rating_elem:
                rating_text = rating_elem.get('title', '')
                rating_match = re.search(r'([\d.]+) out of 5', rating_text)
                data['rating'] = float(rating_match.group(1)) if rating_match else 0.0
            
            reviews_elem = soup.find('span', {'id': 'acrCustomerReviewText'})
            data['reviews_count'] = 0
            if reviews_elem:
                reviews_text = reviews_elem.get_text(strip=True)
                reviews_match = re.search(r'([\d,]+)', reviews_text.replace(',', ''))
                data['reviews_count'] = int(reviews_match.group(1)) if reviews_match else 0
            
            # Category/Breadcrumbs
            breadcrumb_elems = soup.find_all('li', class_='a-breadcrumb-item')
            if breadcrumb_elems:
                categories = [bc.get_text(strip=True) for bc in breadcrumb_elems]
                data['category'] = ' > '.join(categories)
            else:
                data['category'] = "Unknown"
            
            # Description (combine bullets and description)
            description_parts = []
            
            # Feature bullets
            feature_bullets = soup.find('div', {'id': 'feature-bullets'})
            if feature_bullets:
                bullets = feature_bullets.find_all('span', class_='a-list-item')
                description_parts.extend([b.get_text(strip=True) for b in bullets if b.get_text(strip=True)])
            
            # Product description
            desc_elem = soup.find('div', {'id': 'productDescription'})
            if desc_elem:
                description_parts.append(desc_elem.get_text(strip=True))
            
            data['description'] = ' | '.join(description_parts) if description_parts else "No description"
            
            # Specifications
            specs = {}
            
            # Technical details table
            tech_specs = soup.find('table', {'id': 'productDetails_techSpec_section_1'})
            if tech_specs:
                for row in tech_specs.find_all('tr'):
                    cells = row.find_all(['th', 'td'])
                    if len(cells) == 2:
                        key = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        specs[key] = value
            
            # Detail bullets
            detail_bullets = soup.find('div', {'id': 'detailBullets_feature_div'})
            if detail_bullets:
                for bullet in detail_bullets.find_all('span', class_='a-list-item'):
                    text = bullet.get_text(strip=True)
                    if ':' in text:
                        key, value = text.split(':', 1)
                        specs[key.strip()] = value.strip()
            
            data['specifications'] = specs
            
            # Extract age from specifications if available
            data['age'] = self._extract_age_from_specs(specs)
            
            # Images - High resolution extraction
            image_urls = []
            
            # Method 1: From JavaScript data (highest quality)
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'hiRes' in script.string:
                    matches = re.findall(r'"hiRes":"(https://[^"]+)"', script.string)
                    image_urls.extend(matches)
                    
                    # Also get large images
                    large_matches = re.findall(r'"large":"(https://[^"]+)"', script.string)
                    image_urls.extend(large_matches)
            
            # Method 2: From image container
            image_container = soup.find('div', {'id': 'altImages'})
            if image_container:
                for img in image_container.find_all('img'):
                    src = img.get('src')
                    if src and 'images-na.ssl-images-amazon.com' in src:
                        high_res = src.replace('_SS40_', '_SL1200_').replace('_US40_', '_SL1200_')
                        if high_res not in image_urls:
                            image_urls.append(high_res)
            
            # Method 3: Main image
            main_img = soup.find('img', {'id': 'landingImage'})
            if main_img:
                src = main_img.get('data-old-hires') or main_img.get('src')
                if src and src not in image_urls:
                    image_urls.append(src)
            
            data['image_urls'] = list(dict.fromkeys(image_urls))  # Remove duplicates
            
            product = ProductData(**data)
            
            # Download images
            product.local_image_paths = self.image_downloader.download_product_images(product, max_images=5)
            
            return product
            
        except Exception as e:
            logger.error(f"Error scraping Amazon product {asin}: {e}")
            return None
    
    def _extract_age_from_specs(self, specs: Dict) -> float:
        """Try to extract product age from specifications"""
        age_keywords = ['Date First Available', 'Release Date', 'model year', 'year']
        for key, value in specs.items():
            if any(kw.lower() in key.lower() for kw in age_keywords):
                # Try to find year
                year_match = re.search(r'20\d{2}', value)
                if year_match:
                    year = int(year_match.group())
                    current_year = datetime.now().year
                    return max(0, current_year - year)
        return 0.0
    
    def scrape_category(self, category_queries: Dict[str, List[str]], max_per_category: int = 20):
        """Scrape multiple categories with organized storage"""
        all_products = []
        
        for category, queries in category_queries.items():
            logger.info(f"Scraping category: {category}")
            category_products = []
            
            for query in queries:
                asins = self.search_products(query, max_pages=2)
                
                for asin in asins[:max_per_category]:
                    product = self.scrape_product_details(asin)
                    if product:
                        # Override category with our classification
                        product.category = category
                        category_products.append(product)
                        all_products.append(product)
                    
                    time.sleep(random.uniform(2, 5))
            
            # Save category-specific CSV
            self._save_to_csv(category_products, f'amazon_{category.lower().replace(" ", "_")}.csv')
        
        return all_products
    
    def _save_to_csv(self, products: List[ProductData], filename: str):
        """Save products to CSV with image paths"""
        if not products:
            return
        
        flat_data = []
        for p in products:
            d = asdict(p)
            d['specifications'] = json.dumps(d['specifications'])
            d['image_urls'] = json.dumps(d['image_urls'])
            d['local_image_paths'] = json.dumps(d['local_image_paths'])
            flat_data.append(d)
        
        keys = flat_data[0].keys()
        filepath = Path('dataset') / filename
        filepath.parent.mkdir(exist_ok=True)
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(flat_data)
        
        logger.info(f"Saved {len(products)} products to {filepath}")


class FacebookMarketplaceScraper:
    """Facebook Marketplace scraper with image download"""
    
    def __init__(self, cookies_file=None, headless=True):
        self.cookies_file = cookies_file
        self.headless = headless
        self.driver = None
        self.base_url = "https://www.facebook.com/marketplace"
        self.image_downloader = ImageDownloader()
        
    def _init_driver(self):
        """Initialize Selenium WebDriver"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument('--headless=new')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36'
        ]
        chrome_options.add_argument(f'--user-agent={random.choice(user_agents)}')
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            if self.cookies_file and os.path.exists(self.cookies_file):
                self.driver.get("https://www.facebook.com")
                with open(self.cookies_file, 'r') as f:
                    cookies = json.load(f)
                    for cookie in cookies:
                        try:
                            self.driver.add_cookie(cookie)
                        except:
                            pass
                logger.info("Cookies loaded")
            
            return True
        except Exception as e:
            logger.error(f"Driver init failed: {e}")
            return False
    
    def login(self, email: str, password: str) -> bool:
        """Manual login"""
        if not self.driver:
            if not self._init_driver():
                return False
        
        try:
            self.driver.get("https://www.facebook.com/login")
            time.sleep(3)
            
            self.driver.find_element(By.ID, "email").send_keys(email)
            self.driver.find_element(By.ID, "pass").send_keys(password)
            self.driver.find_element(By.NAME, "login").click()
            
            time.sleep(5)
            
            if "login" not in self.driver.current_url:
                cookies = self.driver.get_cookies()
                with open('fb_cookies.json', 'w') as f:
                    json.dump(cookies, f)
                return True
            return False
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False
    
    def search_marketplace(self, query: str, location: str = None, max_items: int = 50) -> List[ProductData]:
        """Search marketplace and return products"""
        if not self.driver:
            if not self._init_driver():
                return []
        
        products = []
        
        try:
            search_url = f"{self.base_url}/search/?query={quote_plus(query)}"
            if location:
                search_url += f"&location={quote_plus(location)}"
            
            logger.info(f"Accessing Facebook Marketplace: {search_url}")
            self.driver.get(search_url)
            time.sleep(5)
            
            # Scroll and collect items
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            items_found = 0
            scroll_attempts = 0
            processed_ids = set()
            
            while items_found < max_items and scroll_attempts < 15:
                soup = BeautifulSoup(self.driver.page_source, 'lxml')
                
                # Find product cards
                cards = soup.find_all('div', {'role': 'article'}) or \
                       soup.find_all('a', href=re.compile(r'/marketplace/item/\d+'))
                
                for card in cards:
                    if items_found >= max_items:
                        break
                    
                    try:
                        product = self._parse_card(card, query)
                        if product and product.product_id not in processed_ids:
                            processed_ids.add(product.product_id)
                            
                            # Visit detail page for more info
                            detail_info = self._get_detail_info(product.url)
                            if detail_info:
                                product.description = detail_info.get('description', product.description)
                                product.condition = detail_info.get('condition', product.condition)
                                product.brand = detail_info.get('brand', product.brand)
                                product.age = detail_info.get('age', product.age)
                                product.image_urls = detail_info.get('images', product.image_urls)
                                product.seller_name = detail_info.get('seller_name', product.seller_name)
                                product.seller_rating = detail_info.get('seller_rating', 0.0)
                            
                            # Download images
                            product.local_image_paths = self.image_downloader.download_product_images(product, max_images=5)
                            
                            products.append(product)
                            items_found += 1
                    except Exception as e:
                        logger.error(f"Error parsing card: {e}")
                
                # Scroll
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3)
                
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                last_height = new_height
            
        except Exception as e:
            logger.error(f"Marketplace search error: {e}")
        
        return products
    
    def _parse_card(self, card, search_query: str) -> Optional[ProductData]:
        """Parse marketplace card"""
        try:
            # Extract ID and URL
            link_elem = card if card.name == 'a' else card.find('a', href=re.compile(r'/marketplace/item/\d+'))
            if not link_elem:
                return None
            
            href = link_elem.get('href', '')
            match = re.search(r'/marketplace/item/(\d+)', href)
            product_id = match.group(1) if match else hashlib.md5(href.encode()).hexdigest()[:12]
            
            # Title
            title_elem = card.find('span', text=re.compile(r'.{5,}')) or card.find('span', {'dir': 'auto'})
            title = title_elem.get_text(strip=True) if title_elem else "Unknown"
            
            # Price
            price = 0.0
            price_elem = card.find(string=re.compile(r'\$\d+')) or card.find('span', string=re.compile(r'\$\d+'))
            if price_elem:
                price_text = price_elem.get_text(strip=True) if hasattr(price_elem, 'get_text') else str(price_elem)
                price_match = re.search(r'\$([\d,]+)', price_text.replace(',', ''))
                price = float(price_match.group(1)) if price_match else 0.0
            
            # Location
            location_elem = card.find(string=re.compile(r'.+,.{2}'))
            location = ""
            if location_elem:
                location = location_elem.get_text(strip=True) if hasattr(location_elem, 'get_text') else str(location_elem)
            
            # Image
            img_urls = []
            img_elem = card.find('img')
            if img_elem:
                src = img_elem.get('src') or img_elem.get('data-src')
                if src:
                    img_urls.append(src)
            
            # Determine category from search query or title
            category = self._categorize_item(title, search_query)
            
            # Determine condition from title
            condition = self._extract_condition(title)
            
            return ProductData(
                source='Facebook_Marketplace',
                product_id=product_id,
                title=title,
                price=price,
                currency='USD',
                category=category,
                condition=condition,
                age=0.0,  # Will be updated from detail page
                brand="Unknown",  # Will be updated from detail page
                location=location,
                description=title,
                specifications={},
                image_urls=img_urls,
                url=urljoin("https://www.facebook.com", href),
                scraped_at=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return None
    
    def _get_detail_info(self, url: str) -> Dict:
        """Get detailed info from product page"""
        if not url:
            return {}
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'lxml')
            info = {}
            
            # Description
            desc_elem = soup.find('div', {'dir': 'auto'}) or soup.find('span', {'dir': 'auto'})
            if desc_elem:
                info['description'] = desc_elem.get_text(strip=True)
            
            # Seller
            seller_elem = soup.find('a', href=re.compile(r'/marketplace/profile/\d+'))
            if seller_elem:
                info['seller_name'] = seller_elem.get_text(strip=True)
            
            # Condition - look for specific text
            condition_patterns = ['Condition: (\\w+)', '(New|Like New|Used - Good|Used - Fair|Used - Poor)']
            page_text = soup.get_text()
            for pattern in condition_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    info['condition'] = match.group(1).capitalize()
                    break
            
            # Brand extraction from description
            brand_patterns = ['Brand: (\\w+)', 'Brand is (\\w+)', '(\\w+) (?:laptop|phone|tablet|camera)']
            for pattern in brand_patterns:
                match = re.search(pattern, info.get('description', ''), re.IGNORECASE)
                if match:
                    info['brand'] = match.group(1).capitalize()
                    break
            
            # All images
            images = []
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src')
                if src and 'scontent' in src:  # Facebook CDN
                    images.append(src)
            info['images'] = list(dict.fromkeys(images))  # Remove duplicates
            
            return info
            
        except Exception as e:
            logger.error(f"Detail scrape error: {e}")
            return {}
    
    def _categorize_item(self, title: str, query: str) -> str:
        """Categorize item based on title and query"""
        title_lower = title.lower()
        categories = {
            'Electronics': ['laptop', 'phone', 'iphone', 'samsung', 'computer', 'tablet', 'camera', 'tv', 'headphone', 'console', 'game', 'watch', 'airpods', 'macbook', 'ipad'],
            'Furniture': ['couch', 'sofa', 'table', 'chair', 'desk', 'bed', 'dresser', 'shelf', 'lamp'],
            'Vehicles': ['car', 'truck', 'bike', 'bicycle', 'motorcycle', 'honda', 'toyota', 'ford'],
            'Clothing': ['shirt', 'shoes', 'dress', 'jacket', 'pants', 'jeans', 'shoe', 'sneaker'],
            'Home & Garden': ['lawn', 'garden', 'tool', 'appliance', 'kitchen', 'vacuum'],
            'Sports': ['golf', 'tennis', 'basketball', 'football', 'exercise', 'gym', 'bike']
        }
        
        for cat, keywords in categories.items():
            if any(kw in title_lower for kw in keywords):
                return cat
        
        # Default to query-based
        return query.split()[0].capitalize()
    
    def _extract_condition(self, title: str) -> str:
        """Extract condition from title"""
        title_lower = title.lower()
        if any(x in title_lower for x in ['new', 'brand new', 'unopened']):
            return 'New'
        elif any(x in title_lower for x in ['like new', 'excellent', 'mint']):
            return 'Like New'
        elif any(x in title_lower for x in ['good', 'great condition']):
            return 'Good'
        elif any(x in title_lower for x in ['fair', 'decent']):
            return 'Fair'
        elif any(x in title_lower for x in ['poor', 'for parts', 'broken']):
            return 'Poor'
        return 'Used'
    
    def close(self):
        if self.driver:
            self.driver.quit()


class DatasetBuilder:
    """Build unified dataset for ML training"""
    
    def __init__(self):
        self.amazon_scraper = AmazonScraper()
        self.fb_scraper = None
        self.all_products: List[ProductData] = []
        
        # Create dataset directories
        Path('dataset/images/amazon').mkdir(parents=True, exist_ok=True)
        Path('dataset/images/facebook_marketplace').mkdir(parents=True, exist_ok=True)
        Path('dataset/csv').mkdir(parents=True, exist_ok=True)
    
    def build_dataset(self, amazon_queries: Dict[str, List[str]], fb_queries: List[str], 
                     fb_cookies: str = None, max_per_query: int = 20):
        """Build complete dataset"""
        
        # Scrape Amazon
        logger.info("Starting Amazon scraping...")
        amazon_products = self.amazon_scraper.scrape_category(amazon_queries, max_per_query)
        self.all_products.extend(amazon_products)
        
        # Scrape Facebook if cookies provided
        if fb_cookies:
            logger.info("Starting Facebook Marketplace scraping...")
            self.fb_scraper = FacebookMarketplaceScraper(cookies_file=fb_cookies, headless=False)
            
            for query in fb_queries:
                products = self.fb_scraper.search_marketplace(query, max_items=max_per_query)
                self.all_products.extend(products)
                time.sleep(random.uniform(5, 10))
            
            self.fb_scraper.close()
        
        # Save unified dataset
        self._save_unified_dataset()
        
        return len(self.all_products)
    
    def _save_unified_dataset(self):
        """Save final dataset with all fields"""
        if not self.all_products:
            return
        
        # Prepare data
        flat_data = []
        for p in self.all_products:
            d = asdict(p)
            # Serialize complex fields
            d['specifications'] = json.dumps(d['specifications'])
            d['image_urls'] = json.dumps(d['image_urls'])
            d['local_image_paths'] = json.dumps(d['local_image_paths'])
            flat_data.append(d)
        
        # Save CSV
        keys = flat_data[0].keys()
        csv_path = Path('dataset/csv/unified_products.csv')
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(flat_data)
        
        # Save metadata
        metadata = {
            'total_products': len(self.all_products),
            'amazon_count': len([p for p in self.all_products if p.source == 'Amazon']),
            'facebook_count': len([p for p in self.all_products if p.source == 'Facebook_Marketplace']),
            'categories': list(set([p.category for p in self.all_products])),
            'conditions': list(set([p.condition for p in self.all_products])),
            'avg_price': sum([p.price for p in self.all_products if p.price > 0]) / max(1, len([p for p in self.all_products if p.price > 0])),
            'total_images_downloaded': sum([len(p.local_image_paths) for p in self.all_products])
        }
        
        with open('dataset/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Dataset complete: {metadata['total_products']} products, {metadata['total_images_downloaded']} images")
        logger.info(f"Categories: {metadata['categories']}")
        logger.info(f"Saved to: dataset/")


# Usage Example
if __name__ == "__main__":
    
    # Define categories and search queries
    AMAZON_CATEGORIES = {
        'Electronics': ['laptop computer', 'smartphone iphone samsung', 'digital camera', 'wireless headphones'],
        'Furniture': ['office desk', 'sofa couch', 'dining table', 'office chair'],
        'Appliances': ['coffee maker', 'vacuum cleaner', 'microwave oven', 'air fryer']
    }
    
    FACEBOOK_QUERIES = [
        'used laptop', 'iphone used', 'furniture used', 'camera used',
        'used bike', 'car used', 'sofa', 'desk'
    ]
    
    # Initialize builder
    builder = DatasetBuilder()
    
    # Build dataset (Amazon only, or both if you have FB cookies)
    total = builder.build_dataset(
        amazon_queries=AMAZON_CATEGORIES,
        fb_queries=FACEBOOK_QUERIES,
        # fb_cookies='fb_cookies.json',  # Uncomment if you have Facebook cookies
        max_per_query=10  # Adjust based on your needs
    )
    
    print(f"\nDataset building complete! Collected {total} products.")
    print("Directory structure:")
    print("dataset/")
    print("├── images/")
    print("│   ├── amazon/")
    print("│   └── facebook_marketplace/")
    print("├── csv/")
    print("│   └── unified_products.csv")
    print("└── metadata.json")