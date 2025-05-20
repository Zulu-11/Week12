import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, StyleSheet, Text, View, Button, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// — Firebase setup —————————————————————————————————————
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_APP.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
};
initializeApp(firebaseConfig);
const db = getFirestore();

// — Notification handler —————————————————————————————————
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// — Register for push notifications ————————————————————————
async function registerForPushNotificationsAsync(): Promise<string> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  if (!Device.isDevice) throw new Error('Physical device required');
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Push permission not granted');
  }
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) throw new Error('EAS projectId missing');
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

// — Schedule a local notification ———————————————————————————
async function scheduleLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // segera tampil
  });
}

// — Main App ———————————————————————————————————————————————
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // 1) Push token + 2) Listeners
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(setExpoPushToken)
      .catch(err => Alert.alert('Push Error', err.message));

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // — Firestore + Location + Notification ——————————————————————
  const addData = useCallback(async () => {
    // 1) Minta lokasi
    let latitude = 0, longitude = 0;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Lokasi tidak diizinkan');
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      ({ latitude, longitude } = coords);
    } catch (locErr: any) {
      console.warn('Lokasi error:', locErr.message);
      // kita lanjut saja tanpa lokasi
    }

    // 2) Tambah ke Firestore
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        first: 'Raditya',
        last: 'HerKristito',
        born: 2002,
        createdAt: new Date(),
      });

      const successMsg = `Success! ID: ${docRef.id}\nLat: ${latitude.toFixed(
        5
      )}, Lon: ${longitude.toFixed(5)}`;
      console.log(successMsg);
      Alert.alert('Firestore', successMsg);
      await scheduleLocalNotification('Firestore Success', successMsg);
    } catch (err: any) {
      const errorMsg = `Error: ${err.message}\nLat: ${latitude.toFixed(
        5
      )}, Lon: ${longitude.toFixed(5)}`;
      console.error(errorMsg);
      Alert.alert('Firestore Error', errorMsg);
      await scheduleLocalNotification('Firestore Error', errorMsg);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text>Your Expo push token:</Text>
      <Text selectable style={styles.token}>{expoPushToken}</Text>
      <View style={styles.buttons}>
        <Button title="Add User & Notify" onPress={addData} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  token: {
    marginVertical: 10,
  },
  buttons: {
    marginTop: 20,
  },
});
