import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TransactionItem from './TransactionItem';
import { useTheme, typography, spacing } from '../../theme';

export default function TransactionList({ data, onItemPress, emptyText }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText || '暂无记录'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem item={item} onPress={onItemPress} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={styles.list}
    />
  );
}

const createStyles = (colors) => StyleSheet.create({
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 68,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textLight,
  },
});
