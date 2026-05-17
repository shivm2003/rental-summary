import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message || 'An unexpected error occurred.'}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={styles.btnTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#f8fafc' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 15, marginBottom: 8 },
  message: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  btn: { backgroundColor: '#2874f0', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10, elevation: 3 },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});
