import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

export default function ImageAttachment({ images, onAddFromCamera, onAddFromLibrary, onRemove, readonly }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {images.map((img, index) => (
        <View key={img.id || index} style={styles.imageWrap}>
          <Image source={{ uri: img.file_path || img.uri }} style={styles.image} />
          {!readonly && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                Alert.alert('删除图片', '确定要删除这张图片吗？', [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: () => onRemove?.(index) },
                ]);
              }}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {!readonly && (
        <View style={styles.addButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={onAddFromCamera}>
            <MaterialCommunityIcons name="camera" size={24} color={colors.textSecondary} />
            <Text style={styles.addText}>拍照</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={onAddFromLibrary}>
            <MaterialCommunityIcons name="image-plus" size={24} color={colors.textSecondary} />
            <Text style={styles.addText}>相册</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  addButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
