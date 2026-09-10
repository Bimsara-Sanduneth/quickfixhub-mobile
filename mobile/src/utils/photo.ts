import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PickPhotoOptions = {
  // [1, 1] for an avatar-style crop, [3, 1] for a wide banner/cover crop.
  aspect?: [number, number];
  // Only the width is set on the resize - the height is calculated automatically to preserve
  // the aspect ratio the user already cropped to.
  maxWidth?: number;
};

// Shared by every photo picker in the app (profile photo, cover photo, provider-onboarding's
// account-creation photo) - requests permission, lets the user pick + crop, then resizes/
// compresses client-side so the payload stays small regardless of the source photo's resolution.
// Returns null if the user cancels or denies permission.
export async function pickAndEncodePhoto(options: PickPhotoOptions = {}): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.aspect ?? [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const rendered = await ImageManipulator.manipulate(result.assets[0].uri).resize({ width: options.maxWidth ?? 512 }).renderAsync();
  const saved = await rendered.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : null;
}
