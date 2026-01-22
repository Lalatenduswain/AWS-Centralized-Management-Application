/**
 * Client List Screen
 *
 * Displays all AWS clients and allows navigation to their resources.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clientsAPI } from '../services/api.service';

interface Client {
  id: number;
  client_name: string;
  region: string;
  notes: string | null;
}

const ClientListScreen = ({ navigation }: any) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadClients();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data.clients);
    } catch (error) {
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate('Resources', { clientId: item.id, clientName: item.client_name })}
    >
      <Text style={styles.clientName}>{item.client_name}</Text>
      <Text style={styles.clientRegion}>Region: {item.region}</Text>
      {item.notes && <Text style={styles.clientNotes}>{item.notes}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AWS Clients</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {clients.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No clients added yet</Text>
          <Text style={styles.emptySubtext}>Add a client from the web dashboard</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadClients} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  clientCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clientRegion: {
    fontSize: 14,
    color: '#666',
  },
  clientNotes: {
    fontSize: 14,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ClientListScreen;
