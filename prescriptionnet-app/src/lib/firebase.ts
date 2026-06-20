import { initializeApp, getApps, getApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDGVfav5wNV7K1qlGT2Pt00unvSRS5PR_8",
  authDomain: "apex-cad60.firebaseapp.com",
  projectId: "apex-cad60",
  storageBucket: "apex-cad60.firebasestorage.app",
  messagingSenderId: "888198538340",
  appId: "1:888198538340:web:a84ea199308499604a6b71"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export { 
  app,
  auth, 
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
}
