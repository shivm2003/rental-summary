"""
Complete Quikr India Scraper
Covers ALL categories shown in the image with organized image folders
For ResNet50 + XGBoost Price Estimation Model
"""

import requests
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
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('quikr_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class ProductData:
    """Complete data structure for price estimation model"""
    source: str = "Quikr"
    product_id: str = ""
    title: str = ""
    price: float = 0.0
    currency: str = "INR"
    category: str = ""  # Main category (Furniture, Electronics, etc.)
    subcategory: str = ""  # Sub-category (Sofa, Mobile, etc.)
    condition: str = ""  # New, Used, Like New, etc.
    age: float = 0.0  # Age in years
    brand: str = ""
    location: str = ""  # City/Area
    description: str = ""
    specifications: Dict = field(default_factory=dict)
    image_urls: List[str] = field(default_factory=list)
    local_image_paths: List[str] = field(default_factory=list)
    seller_name: str = ""
    seller_type: str = ""  # Individual or Dealer
    posting_date: str = ""
    url: str = ""
    scraped_at: str = field(default_factory=lambda: datetime.now().isoformat())
    # Additional fields for Quikr
    year: str = ""  # For cars/bikes
    km_driven: str = ""  # For vehicles
    fuel_type: str = ""  # For cars


class ImageDownloader:
    """Handles concurrent image downloading with organization by category"""
    
    def __init__(self, base_dir="quikr_dataset/images"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.quikr.com/'
        })
        self.downloaded_count = 0
        self.failed_count = 0
        
    def download_image(self, url: str, category: str, product_id: str, index: int = 0) -> Optional[str]:
        """Download single image organized by category folder"""
        if not url or not url.startswith('http'):
            return None
            
        try:
            # Create category-specific subdirectory
            category_clean = re.sub(r'[^\w\s-]', '', category).strip().replace(' ', '_')
            category_dir = self.base_dir / category_clean
            category_dir.mkdir(exist_ok=True)
            
            # Generate filename
            ext = self._get_extension(url)
            filename = f"{product_id}_{index}{ext}"
            filepath = category_dir / filename
            
            # Skip if already exists
            if filepath.exists():
                return str(filepath.relative_to(self.base_dir.parent))
            
            # Download with retry
            for attempt in range(3):
                try:
                    response = self.session.get(url, timeout=30, stream=True, verify=False)
                    if response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            for chunk in response.iter_content(8192):
                                if chunk:
                                    f.write(chunk)
                        self.downloaded_count += 1
                        return str(filepath.relative_to(self.base_dir.parent))
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    if attempt == 2:
                        logger.error(f"Failed to download {url}: {e}")
                    time.sleep(random.uniform(1, 3))
                    
        except Exception as e:
            logger.error(f"Error downloading image {url}: {e}")
        
        self.failed_count += 1
        return None
    
    def _get_extension(self, url: str) -> str:
        """Extract image extension from URL"""
        parsed = urlparse(url)
        path = parsed.path.lower()
        if any(x in path for x in ['.jpg', '.jpeg']):
            return '.jpg'
        elif '.png' in path:
            return '.png'
        elif '.webp' in path:
            return '.webp'
        else:
            return '.jpg'
    
    def download_product_images(self, product: ProductData, max_images: int = 10) -> List[str]:
        """Download all images for a product"""
        local_paths = []
        
        for i, url in enumerate(product.image_urls[:max_images]):
            path = self.download_image(url, product.category, product.product_id, i)
            if path:
                local_paths.append(path)
            # Small delay between images of same product
            time.sleep(random.uniform(0.3, 0.8))
        
        return local_paths
    
    def get_stats(self):
        """Return download statistics"""
        return {
            'downloaded': self.downloaded_count,
            'failed': self.failed_count
        }


class QuikrScraper:
    """
    Quikr India Scraper using public API and web scraping
    Covers all categories from the image
    """
    
    # All categories from your image with their Quikr category IDs/URLs
    CATEGORIES = {
        'Furniture_Decor': {
            'id': 67,
            'subcategories': ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'decor', 'dining-set']
        },
        'Appliances_ACs': {
            'id': 68,
            'subcategories': ['refrigerator', 'washing-machine', 'ac', 'microwave', 'tv', 'cooler']
        },
        'Services': {
            'id': 69,
            'subcategories': ['home-cleaning', 'repair', 'packers-movers', 'plumbing', 'electrician']
        },
        'Jobs': {
            'id': 70,
            'subcategories': ['it-software', 'sales', 'marketing', 'accounts', 'hr', 'teaching']
        },
        'Cars': {
            'id': 71,
            'subcategories': ['sedan', 'hatchback', 'suv', 'luxury', 'commercial']
        },
        'Bikes': {
            'id': 72,
            'subcategories': ['scooter', 'motorcycle', 'sports-bike', 'electric-bike']
        },
        'Homes': {
            'id': 73,
            'subcategories': ['apartment', 'house', 'pg', 'room', 'hostel']
        },
        'Mobiles_Tablets': {
            'id': 74,
            'subcategories': ['mobile-phones', 'tablets', 'accessories', 'iphone', 'samsung']
        },
        'Co_working_Spaces': {
            'id': 75,
            'subcategories': ['office-space', 'coworking', 'commercial']
        },
        'Personal_Loan': {
            'id': 76,
            'subcategories': ['personal-loan', 'home-loan', 'business-loan']
        },
        'Sports_Hobbies_Fashion': {
            'id': 77,
            'subcategories': ['gym-fitness', 'sports-equipment', 'musical-instruments', 'fashion']
        },
        'Kids_Toys': {
            'id': 78,
            'subcategories': ['toys', 'baby-products', 'stroller', 'furniture']
        },
        'Education': {
            'id': 79,
            'subcategories': ['books', 'tuition', 'coaching', 'online-courses']
        },
        'Commercial_Real_Estate': {
            'id': 80,
            'subcategories': ['shop', 'office', 'warehouse', 'showroom']
        },
        'Pets_Pet_Care': {
            'id': 81,
            'subcategories': ['dogs', 'cats', 'birds', 'pet-food', 'pet-services']
        },
        'Home_Lifestyle': {
            'id': 82,
            'subcategories': ['kitchen', 'home-decor', 'garden', 'paintings']
        },
        'B2B_Suppliers': {
            'id': 83,
            'subcategories': ['machinery', 'industrial', 'wholesale', 'equipment']
        },
        'Entertainment': {
            'id': 84,
            'subcategories': ['events', 'party', 'wedding', 'dj', 'catering']
        }
    }
    
    # Major cities to scrape
    CITIES = [
        'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 
        'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow',
        'chandigarh', 'kochi', 'bhopal', 'indore', 'nagpur'
    ]
    
    def __init__(self):
        self.base_url = "https://www.quikr.com"
        self.api_base = "https://api.quikr.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        })
        self.image_downloader = ImageDownloader()
        self.all_products: List[ProductData] = []
        
    def _safe_request(self, url: str, max_retries: int = 3, is_api: bool = False) -> Optional[dict]:
        """Make safe request with retry logic"""
        for attempt in range(max_retries):
            try:
                headers = self.session.headers.copy()
                if is_api:
                    headers['X-Requested-With'] = 'XMLHttpRequest'
                    headers['Referer'] = 'https://www.quikr.com/'
                
                response = self.session.get(url, headers=headers, timeout=30, verify=False)
                
                if response.status_code == 200:
                    try:
                        return response.json()
                    except:
                        return {'html': response.text}
                elif response.status_code == 429:
                    logger.warning(f"Rate limited, waiting...")
                    time.sleep(random.uniform(10, 20))
                else:
                    time.sleep(random.uniform(2, 5))
                    
            except Exception as e:
                logger.error(f"Request error (attempt {attempt+1}): {e}")
                time.sleep(random.uniform(2, 5))
        
        return None
    
    def get_category_listings_api(self, category_id: int, city: str, start: int = 0, size: int = 25) -> List[Dict]:
        """Fetch listings using Quikr public API"""
        # Using the public adsByCategory endpoint
        url = f"https://api.quikr.com/public/adsByCategory?categoryId={category_id}&city={city}&from={start}&size={size}"
        
        data = self._safe_request(url, is_api=True)
        if data and 'AdsByCategoryResponse' in data:
            return data['AdsByCategoryResponse'].get('AdsByCategoryData', {}).get('docs', [])
        return []
    
    def parse_api_listing(self, item: Dict, category_name: str) -> Optional[ProductData]:
        """Parse API response into ProductData"""
        try:
            product = ProductData()
            product.source = "Quikr"
            product.category = category_name
            product.product_id = str(item.get('order_table_id', '')) or str(item.get('adId', hashlib.md5(str(item).encode()).hexdigest()[:12]))
            
            # Basic info
            product.title = item.get('title', 'Unknown')
            product.description = item.get('content', '')
            product.location = f"{item.get('cityName', '')}, {item.get('ad_locality', '')}"
            product.posting_date = item.get('createdTime', '')
            product.url = f"https://www.quikr.com/{item.get('categoryName', '').replace(' ', '-')}/{'-'.join(product.title.split()[:5])}-{product.product_id}"
            
            # Price
            price_str = item.get('attribute_Price', '0')
            try:
                product.price = float(re.sub(r'[^\d.]', '', str(price_str)))
            except:
                product.price = 0.0
            
            # Category info
            product.subcategory = item.get('categoryName', '')
            
            # Condition
            product.condition = item.get('attribute_Condition', 'Used')
            if not product.condition:
                product.condition = 'Used'
            
            # Brand
            product.brand = item.get('attribute_Brand_name', '')
            if not product.brand:
                # Try to extract from title
                words = product.title.split()
                if words:
                    product.brand = words[0]
            
            # Age calculation
            year = item.get('attribute_Year', '') or item.get('year', '')
            product.year = year
            if year and year.isdigit():
                current_year = datetime.now().year
                product.age = max(0, current_year - int(year))
            else:
                # Estimate from posting date
                if product.posting_date:
                    try:
                        post_year = int(product.posting_date[:4])
                        product.age = max(0, datetime.now().year - post_year)
                    except:
                        product.age = 0.0
            
            # Vehicle specific fields
            product.km_driven = item.get('kms_Driven', '') or item.get('attribute_Kms_Driven', '')
            product.fuel_type = item.get('attribute_Fuel_Type', '')
            
            # Seller info
            product.seller_type = item.get('attribute_You_are', 'Individual')
            product.seller_name = item.get('attribute_Contact_Name', 'Unknown')
            
            # Images
            images = item.get('images', [])
            if isinstance(images, str):
                # Sometimes images might be comma-separated
                images = [img.strip() for img in images.split(',') if img.strip()]
            product.image_urls = [img for img in images if img.startswith('http')]
            
            # Specifications
            specs = {}
            for key, value in item.items():
                if key.startswith('attribute_') and key not in ['attribute_Price', 'attribute_Condition', 'attribute_Brand_name', 'attribute_Ad_Type', 'attribute_You_are']:
                    clean_key = key.replace('attribute_', '')
                    specs[clean_key] = value
            product.specifications = specs
            
            return product
            
        except Exception as e:
            logger.error(f"Error parsing API item: {e}")
            return None
    
    def scrape_category(self, category_key: str, category_info: Dict, max_products: int = 100) -> List[ProductData]:
        """Scrape all products from a category across multiple cities"""
        products = []
        category_id = category_info['id']
        category_name = category_key.replace('_', ' ')
        
        logger.info(f"Scraping category: {category_name} (ID: {category_id})")
        
        for city in self.CITIES:
            if len(products) >= max_products:
                break
                
            logger.info(f"  City: {city}")
            start = 0
            batch_size = 25
            
            while len(products) < max_products and start < max_products * 2:
                try:
                    listings = self.get_category_listings_api(category_id, city, start, batch_size)
                    
                    if not listings:
                        break
                    
                    for item in listings:
                        if len(products) >= max_products:
                            break
                            
                        product = self.parse_api_listing(item, category_name)
                        if product and product.price > 0:  # Only products with price
                            # Download images
                            product.local_image_paths = self.image_downloader.download_product_images(
                                product, max_images=8
                            )
                            products.append(product)
                            self.all_products.append(product)
                    
                    start += batch_size
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    logger.error(f"Error in batch starting at {start}: {e}")
                    break
        
        logger.info(f"Collected {len(products)} products from {category_name}")
        return products
    
    def scrape_all_categories(self, max_per_category: int = 50):
        """Scrape all categories"""
        for category_key, category_info in self.CATEGORIES.items():
            self.scrape_category(category_key, category_info, max_per_category)
            
            # Save progress after each category
            self._save_checkpoint()
            
            # Delay between categories
            time.sleep(random.uniform(5, 10))
        
        return len(self.all_products)
    
    def scrape_by_search(self, query: str, category: str = None, max_results: int = 100) -> List[ProductData]:
        """Alternative: Scrape using search functionality"""
        products = []
        
        for city in self.CITIES[:5]:  # Limit cities for search
            url = f"https://www.quikr.com/{city}/{quote_plus(query)}"
            logger.info(f"Searching: {url}")
            
            # This would require Selenium for JavaScript-rendered content
            # For now, using API method is more reliable
            
            time.sleep(random.uniform(2, 4))
        
        return products
    
    def _save_checkpoint(self):
        """Save intermediate results"""
        if not self.all_products:
            return
        
        checkpoint_dir = Path('quikr_dataset/checkpoints')
        checkpoint_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._save_to_csv(
            self.all_products, 
            f'quikr_dataset/checkpoints/checkpoint_{timestamp}.csv'
        )
        logger.info(f"Checkpoint saved: {len(self.all_products)} total products")
    
    def _save_to_csv(self, products: List[ProductData], filepath: str):
        """Save products to CSV"""
        if not products:
            return
        
        flat_data = []
        for p in products:
            d = asdict(p)
            # Serialize complex fields
            d['specifications'] = json.dumps(d['specifications'])
            d['image_urls'] = json.dumps(d['image_urls'])
            d['local_image_paths'] = json.dumps(d['local_image_paths'])
            flat_data.append(d)
        
        keys = flat_data[0].keys()
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(flat_data)
        
        logger.info(f"Saved {len(products)} products to {filepath}")
    
    def save_final_dataset(self):
        """Save final organized dataset"""
        if not self.all_products:
            logger.warning("No products to save")
            return
        
        # Save main dataset
        self._save_to_csv(self.all_products, 'quikr_dataset/quikr_complete_dataset.csv')
        
        # Save by category
        categories = {}
        for p in self.all_products:
            cat = p.category
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(p)
        
        for cat, prods in categories.items():
            safe_name = re.sub(r'[^\w\s-]', '', cat).strip().replace(' ', '_')
            self._save_to_csv(prods, f'quikr_dataset/by_category/{safe_name}.csv')
        
        # Save metadata
        stats = self.image_downloader.get_stats()
        metadata = {
            'total_products': len(self.all_products),
            'categories': list(categories.keys()),
            'products_per_category': {k: len(v) for k, v in categories.items()},
            'total_images_downloaded': stats['downloaded'],
            'failed_downloads': stats['failed'],
            'avg_price': sum([p.price for p in self.all_products if p.price > 0]) / max(1, len([p for p in self.all_products if p.price > 0])),
            'price_range': {
                'min': min([p.price for p in self.all_products if p.price > 0], default=0),
                'max': max([p.price for p in self.all_products if p.price > 0], default=0)
            },
            'conditions': list(set([p.condition for p in self.all_products])),
            'scraped_at': datetime.now().isoformat()
        }
        
        with open('quikr_dataset/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info("=" * 50)
        logger.info("DATASET COMPLETE")
        logger.info("=" * 50)
        logger.info(f"Total Products: {metadata['total_products']}")
        logger.info(f"Images Downloaded: {stats['downloaded']}")
        logger.info(f"Categories: {len(metadata['categories'])}")
        logger.info(f"Saved to: quikr_dataset/")
        
        return metadata


class QuikrWebScraper:
    """
    Alternative web scraper using Selenium for JavaScript-heavy pages
    Use this if API limits are reached
    """
    
    def __init__(self):
        self.driver = None
        self.image_downloader = ImageDownloader()
        
    def init_driver(self):
        """Initialize Selenium driver"""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return True
        except Exception as e:
            logger.error(f"Driver init failed: {e}")
            return False
    
    def scrape_listing_page(self, url: str) -> List[ProductData]:
        """Scrape listings from a category page"""
        if not self.driver and not self.init_driver():
            return []
        
        products = []
        try:
            self.driver.get(url)
            time.sleep(5)
            
            # Parse with BeautifulSoup
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(self.driver.page_source, 'lxml')
            
            # Find product cards (Quikr uses specific class names that change frequently)
            # This is a generic approach
            cards = soup.find_all('div', class_=re.compile(r'product|listing|ad-item'))
            
            for card in cards:
                try:
                    # Extract data based on current Quikr HTML structure
                    # This needs to be updated based on actual site inspection
                    product = ProductData()
                    # ... extraction logic ...
                    products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing card: {e}")
                    
        except Exception as e:
            logger.error(f"Page scrape error: {e}")
        
        return products
    
    def close(self):
        if self.driver:
            self.driver.quit()


# Main execution
if __name__ == "__main__":
    print("=" * 60)
    print("QUIKR INDIA COMPLETE SCRAPER")
    print("All Categories + Image Download + ML-Ready Dataset")
    print("=" * 60)
    
    # Initialize scraper
    scraper = QuikrScraper()
    
    # Scrape all categories (adjust max_per_category as needed)
    # For full dataset, increase max_per_category (e.g., 500-1000 per category)
    total_products = scraper.scrape_all_categories(max_per_category=20)  # Demo: 20 per category
    
    # Save final dataset
    metadata = scraper.save_final_dataset()
    
    print("\n" + "=" * 60)
    print("SCRAPING COMPLETE!")
    print("=" * 60)
    print(f"Total Products: {metadata['total_products']}")
    print(f"Images Downloaded: {metadata['total_images_downloaded']}")
    print(f"Categories Covered: {len(metadata['categories'])}")
    print("\nDataset Structure:")
    print("quikr_dataset/")
    print("├── images/                    # All product images organized by category")
    print("│   ├── Furniture_Decor/")
    print("│   ├── Appliances_ACs/")
    print("│   ├── Cars/")
    print("│   ├── Bikes/")
    print("│   ├── Mobiles_Tablets/")
    print("│   └── ... (all 18 categories)")
    print("├── quikr_complete_dataset.csv # Master CSV with all products")
    print("├── by_category/               # Individual CSV per category")
    print("├── checkpoints/               # Progress backups")
    print("└── metadata.json              # Dataset statistics")
    print("\nReady for ResNet50 + XGBoost training!")