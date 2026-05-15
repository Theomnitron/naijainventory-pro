import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIBRVEijAYjaz8KTnazW4jPjKoxE47JDs",
  authDomain: "naijainventorypro.firebaseapp.com",
  projectId: "naijainventorypro",
  storageBucket: "naijainventorypro.firebasestorage.app",
  messagingSenderId: "55361497269",
  appId: "1:55361497269:web:80dc1c1d448cdbf22776fc"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const auth = getAuth(app);
export { serverTimestamp, Timestamp };
