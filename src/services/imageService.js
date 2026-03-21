import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { generateId } from '../utils/id';
import dayjs from 'dayjs';

const IMAGE_DIR = 'images';

async function ensureDir(dirUri) {
  if (Platform.OS === 'web') return;
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

export const imageService = {
  async pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要相册访问权限');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return [];
    return result.assets;
  },

  async takePhoto() {
    if (Platform.OS === 'web') {
      return this.pickImage();
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要相机访问权限');
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled) return [];
    return result.assets;
  },

  async saveImage(sourceUri) {
    if (Platform.OS === 'web') {
      return { filePath: sourceUri, thumbnailPath: sourceUri };
    }

    const now = dayjs();
    const dir = `${FileSystem.documentDirectory}${IMAGE_DIR}/${now.format('YYYY')}/${now.format('MM')}/`;
    await ensureDir(dir);

    const id = generateId();
    const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filePath = `${dir}${id}.${ext}`;

    await FileSystem.copyAsync({ from: sourceUri, to: filePath });

    return { filePath, thumbnailPath: filePath };
  },

  async deleteImage(filePath) {
    if (Platform.OS === 'web') return;
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (e) {
      console.warn('Delete image failed:', e);
    }
  },
};
