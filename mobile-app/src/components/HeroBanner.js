import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import api from '../api/api';
import { useNavigation } from '@react-navigation/native';

export default function HeroBanner() {

  const { width } = useWindowDimensions();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/hero/active');
      if (res.data && res.data.banners) {
        setBanners(res.data.banners);
      }
    } catch (err) {
      console.error('Failed to load hero banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const loopedBanners = banners.length > 1 
    ? [banners[banners.length - 1], ...banners, banners[0]]
    : banners;

  useEffect(() => {
    if (banners.length > 1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({ x: width, animated: false });
      }, 0);
    }
  }, [banners.length, width]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const nextRealIndex = (prev + 1) % banners.length;
        scrollViewRef.current?.scrollTo({ x: (nextRealIndex + 1) * width, animated: true });
        return nextRealIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, width]);

  const handleScroll = (event) => {
    if (banners.length <= 1) return;
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / slideSize);

    if (index === 0) {
      // Scrolled to left clone (which is the last banner)
      scrollViewRef.current?.scrollTo({ x: banners.length * slideSize, animated: false });
      setActiveIndex(banners.length - 1);
    } else if (index === banners.length + 1) {
      // Scrolled to right clone (which is the first banner)
      scrollViewRef.current?.scrollTo({ x: slideSize, animated: false });
      setActiveIndex(0);
    } else {
      setActiveIndex(index - 1);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={200}
      >
        {loopedBanners.map((item, idx) => (
          <View key={`${item.id}-${idx}`} style={[styles.slide, { width }]}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />


            <View style={styles.textContainer}>
              <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.heroSub} numberOfLines={2}>{item.subtitle}</Text> : null}

              {item.button_text && item.button_link && (
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => {
                    if (item.button_link.includes('/category/')) {
                      const slug = item.button_link.split('/category/')[1];
                      navigation.navigate('CategoryPage', { 
                        slug: slug, 
                        categoryName: item.title || 'Category' 
                      });
                    } else if (item.button_link.includes('/product/')) {
                      const pid = item.button_link.split('/product/')[1];
                      navigation.navigate('ProductDetails', { id: pid });
                    } else {
                      // Fallback to All Categories if link is generic
                      navigation.navigate('AllCategories');
                    }
                  }}
                >
                  <Text style={styles.heroBtnText}>{item.button_text}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.dotsContainer}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === activeIndex ? 16 : 6,
                  backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#1e293b',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  slide: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    bottom: 25,
    left: 15,
    right: 15,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginBottom: 10,
  },
  heroBtn: {
    backgroundColor: '#2874f0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  }
});