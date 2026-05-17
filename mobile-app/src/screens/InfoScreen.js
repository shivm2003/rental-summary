import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InfoScreen({ route, navigation }) {
  const { type } = route.params || { type: 'About' };

  const getContent = () => {
    switch (type) {
      case 'FAQ':
        return {
          title: 'Frequently Asked Questions',
          items: [
            { q: 'How do I rent an item?', a: 'Search for the item, add to cart, and checkout. Its that simple!' },
            { q: 'How do I become a lender?', a: 'Go to the "Become a Lender" section in your profile to start onboarding.' },
            { q: 'Is there a security deposit?', a: 'Some premium items may require a refundable deposit.' },
            { q: 'How long can I rent for?', a: 'Rental periods are flexible. You can choose any duration during booking.' }
          ]
        };
      case 'Terms':
        return {
          title: 'Terms & Conditions',
          text: 'Welcome to EveryThing Rental. By using our app, you agree to our terms of service. Users must be 18+ to list or rent items. All payments are processed securely. Lenders are responsible for item accuracy.'
        };
      case 'Careers':
        return {
          title: 'Careers',
          text: 'We are always looking for passionate people to join the EveryThing Rental team. Check our website for open positions in engineering, marketing, and operations.'
        };
      default:
        return {
          title: 'About Us',
          text: 'EveryThing Rental is Indias premier peer-to-peer rental marketplace. Our mission is to make expensive equipment accessible to everyone while helping owners monetize their assets.'
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {type === 'FAQ' ? (
          content.items.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.bodyText}>{content.text}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  faqItem: { marginBottom: 25 },
  question: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  answer: { fontSize: 14, color: '#64748b', lineHeight: 22 },
  bodyText: { fontSize: 15, color: '#334155', lineHeight: 24 }
});
