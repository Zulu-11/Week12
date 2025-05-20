import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  

const firebaseConfig = {
  apiKey: "AIzaSyCayFeARZMXRoPct6MNaHTB5BAB3or7rCM",
  authDomain: "fir-week11-lab.firebaseapp.com",
  projectId: "fir-week11-lab",
  storageBucket: "fir-week11-lab.firebasestorage.app",
  messagingSenderId: "870909762413",
  appId: "1:870909762413:web:be72141ceaef2360a91864",
  measurementId: "G-ENKKENPTCH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default firebaseConfig