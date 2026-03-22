// Cross-platform file reading utilities for Web (blob URLs) and Native
import { decodeGBK } from './gbkDecode';
import * as FileSystem from 'expo-file-system';

// Check if running on native platform (iOS/Android)
function isNativePlatform() {
  return typeof window === 'undefined' ||
         (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
}

// Read file as Uint8Array - for binary files like XLSX
export async function readFileContent(uri) {
  console.log('[fileRead] readFileContent:', uri.substring(0, 100));

  // Native platform: handle file:// and content:// URIs
  if (isNativePlatform() || uri.startsWith('file://') || uri.startsWith('content://')) {
    console.log('[fileRead] Using expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  if (uri.startsWith('blob:')) {
    console.log('[fileRead] Using blob XHR');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Uint8Array(xhr.response));
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send();
    });
  } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
    console.log('[fileRead] Using http XHR');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Uint8Array(xhr.response));
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send();
    });
  } else {
    // Web but not blob/http - try fetch API
    console.log('[fileRead] Using fetch API');
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

// Read file as text - for CSV files
export async function readTextFile(uri, encoding = 'utf8') {
  // Native platform: handle file:// and content:// URIs
  if (isNativePlatform() || uri.startsWith('file://') || uri.startsWith('content://')) {
    if (encoding === 'gbk') {
      // For GBK, read as base64 and decode
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return decodeGBK(bytes);
    }
    // For UTF-8, read directly as string
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  }

  if (uri.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'text';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send();
    });
  } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'text';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send();
    });
  } else {
    // Web but not blob/http - try fetch API
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  }
}
