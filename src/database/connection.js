import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDatabaseAsync } from 'expo-sqlite';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { runMigrations } from './migrations';
import { runSeeds } from './seeds';
import { colors } from '../theme';

const DatabaseContext = createContext(null);

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Use DatabaseProvider.');
  }
  return dbInstance;
}

async function initDatabase() {
  if (dbInstance) return dbInstance;
  const db = await openDatabaseAsync('mymoneykeeper.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  await runSeeds(db);
  dbInstance = db;
  return db;
}

export function DatabaseProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => console.error('Database init error:', e));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={dbInstance}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDB() {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('useDB must be used within DatabaseProvider');
  return db;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
