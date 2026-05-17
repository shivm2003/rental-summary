import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Maintenance Tracking</Text>
          <Text style={styles.emptySub}>Track product repairs, servicing, and inspections.</Text>
          <Text style={styles.emptySub}>This feature is coming soon!</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Why track maintenance?</Text>
            <Text style={styles.infoDesc}>
              Regular maintenance helps extend the life of your rental inventory, improves customer satisfaction, and reduces replacement costs.
            </Text>
          </View>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Coming Features</Text>
          {[
            'Log maintenance events for each product',
            'Set automated reminders for periodic servicing',
            'Track repair costs and warranty claims',
            'View maintenance history and analytics'
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
              <Text style={styles.stepTxt}>{s}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 5, textAlign: 'center' },
  infoCard: { flexDirection: 'row', backgroundColor: '#fffbeb', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#fef3c7', marginTop: 20, alignItems: 'flex-start' },
  infoContent: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400e' },
  infoDesc: { fontSize: 13, color: '#92400e', lineHeight: 20, marginTop: 4 },
  stepsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  stepsTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepTxt: { fontSize: 14, color: '#334155', flex: 1 }
});
