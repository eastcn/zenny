import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

export default function CategorySelector({ categories, selectedId, onSelect }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => {
          const isSelected = cat.id === selectedId;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.item, isSelected && styles.selectedItem]}
              onPress={() => onSelect(cat)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '20' }, isSelected && { backgroundColor: cat.color + '40' }]}>
                <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
              </View>
              <Text style={[styles.label, isSelected && { color: cat.color, fontWeight: '600' }]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  item: {
    width: '20%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  selectedItem: {
    // selected state handled inline
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
