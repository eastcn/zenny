import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { parseText } from '../../services/textParser';

export default function SmartInput({ categories, onParseResult, onVoicePress }) {
  const [text, setText] = useState('');
  const [parseResult, setParseResult] = useState(null);

  const handleTextChange = useCallback((val) => {
    setText(val);
    if (val.trim().length >= 2) {
      const result = parseText(val, categories);
      setParseResult(result);
    } else {
      setParseResult(null);
    }
  }, [categories]);

  const handleApply = useCallback(() => {
    if (parseResult && parseResult.confidence > 0) {
      onParseResult?.(parseResult);
      setText('');
      setParseResult(null);
    }
  }, [parseResult, onParseResult]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primary} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder='快捷输入，如"午饭35元"'
          placeholderTextColor={colors.textLight}
          value={text}
          onChangeText={handleTextChange}
          returnKeyType="done"
          onSubmitEditing={handleApply}
        />
        {onVoicePress && (
          <TouchableOpacity onPress={onVoicePress} style={styles.voiceBtn}>
            <MaterialCommunityIcons name="microphone" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {parseResult && parseResult.confidence > 0 && (
        <TouchableOpacity style={styles.resultCard} onPress={handleApply} activeOpacity={0.7}>
          <View style={styles.resultRow}>
            {parseResult.amount !== null && (
              <View style={styles.resultTag}>
                <Text style={styles.resultLabel}>金额</Text>
                <Text style={styles.resultValue}>¥{parseResult.amount}</Text>
              </View>
            )}
            {parseResult.categoryName && (
              <View style={styles.resultTag}>
                <Text style={styles.resultLabel}>分类</Text>
                <Text style={styles.resultValue}>{parseResult.categoryName}</Text>
              </View>
            )}
            {parseResult.note ? (
              <View style={styles.resultTag}>
                <Text style={styles.resultLabel}>备注</Text>
                <Text style={styles.resultValue} numberOfLines={1}>{parseResult.note}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.applyText}>点击应用</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    height: '100%',
  },
  voiceBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  resultCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  resultRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  resultLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: 4,
  },
  resultValue: {
    ...typography.smallBold,
    color: colors.primary,
  },
  applyText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
});
