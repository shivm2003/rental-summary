import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OPENINGS = [
  { title: 'Full Stack Developer', dept: 'Engineering', type: 'Full-time', loc: 'Remote' },
  { title: 'UI/UX Designer', dept: 'Design', type: 'Full-time', loc: 'Lucknow' },
  { title: 'Marketing Manager', dept: 'Marketing', type: 'Full-time', loc: 'Remote' },
  { title: 'Customer Support Lead', dept: 'Operations', type: 'Full-time', loc: 'Lucknow' },
  { title: 'Data Analyst', dept: 'Analytics', type: 'Contract', loc: 'Remote' },
];

export default function CareersScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Careers</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBox}>
          <Text style={styles.heroEmoji}>🚀</Text>
          <Text style={styles.heroTitle}>Join Our Team</Text>
          <Text style={styles.heroSub}>Help us build the future of renting in India</Text>
        </View>

        <Text style={styles.sectionTitle}>Open Positions</Text>
        {OPENINGS.map((job, i) => (
          <TouchableOpacity key={i} style={styles.jobCard} onPress={() => Linking.openURL('mailto:careers@everythingrental.in')}>
            <View style={styles.jobTop}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.typeBadge}><Text style={styles.typeText}>{job.type}</Text></View>
            </View>
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="business-outline" size={14} color="#64748b" />
                <Text style={styles.metaTxt}>{job.dept}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.metaTxt}>{job.loc}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Don't see your role? Send us your resume!</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => Linking.openURL('mailto:careers@everythingrental.in')}>
            <Text style={styles.ctaBtnText}>EMAIL US</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 20 },
  heroBox: { alignItems: 'center', paddingVertical: 30 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 10 },
  heroSub: { fontSize: 14, color: '#64748b', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  jobCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  typeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 11, color: '#2874f0', fontWeight: '600' },
  jobMeta: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 12, color: '#64748b' },
  cta: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  ctaText: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  ctaBtn: { backgroundColor: '#1e293b', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10 },
  ctaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});
