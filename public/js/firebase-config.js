// Firebase Configuration
// Replace these values with your Firebase project configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyBKJZGYvHBm6f63SeMSpdTG4snbMgYmDTE",
//   authDomain: "sharpplay-web.firebaseapp.com",
//   databaseURL: "https://sharpplay-web-default-rtdb.firebaseio.com",
//   projectId: "sharpplay-web",
//   storageBucket: "sharpplay-web.firebasestorage.app",
//   messagingSenderId: "950111005870",
//   appId: "1:950111005870:web:YOUR_APP_ID_HERE",
//   measurementId: "G-YOUR_MEASUREMENT_ID"
// };
// const firebaseConfig = {
//   apiKey: "AIzaSyBKJZGYvHBm6f63SeMSpdTG4snbMgYmDTE",
//   authDomain: "sharpplay-web.firebaseapp.com",
//   databaseURL: "https://sharpplay-web-default-rtdb.firebaseio.com",
//   projectId: "sharpplay-web",
//   storageBucket: "sharpplay-web.firebasestorage.app",
//   messagingSenderId: "950111005870",
//   appId: "1:950111005870:web:YOUR_APP_ID_HERE",
//   measurementId: "G-YOUR_MEASUREMENT_ID"
// };


const firebaseConfig = {
  apiKey: "AIzaSyA5fMjf2JoTCoiIGlGc43H24e-ZSH4ngqk",
  authDomain: "sharpplay-web.firebaseapp.com",
  projectId: "sharpplay-web",
  storageBucket: "sharpplay-web.firebasestorage.app",
  messagingSenderId: "950111005870",
  appId: "1:950111005870:web:60841a9d8ec51183d9513f",
  measurementId: "G-Z22DMNMHKK"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Enable offline persistence (updated method to avoid deprecation)
try {
  db.enablePersistence({
    synchronizeTabs: true
  });
  console.log('Firebase offline persistence enabled');
} catch (err) {
  if (err.code == 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.log('The current browser does not support offline persistence');
  }
  console.log('Offline persistence error:', err);
}

// Auth state observer
let currentUser = null;

auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    console.log('User logged in:', user.uid);
    await ensureUserDocument(user);
    updateUIForLoggedInUser(user);
  } else {
    console.log('User logged out');
    updateUIForLoggedOutUser();
  }
});

// Ensure user document exists in Firestore
async function ensureUserDocument(user) {
  const userRef = db.collection('users').doc(user.uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    const referralCode = generateReferralCode();
    await userRef.set({
      username: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || '',
      walletAddress: '',
      bestScore: 0,
      dailyStreak: 0,
      lastPlayedAt: null,
      tokensBalance: 0,
      totalEarned: 0,
      referralCode: referralCode,
      invitedBy: localStorage.getItem('referralCode') || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update photoURL if it changed (e.g., from Google)
    const userData = userDoc.data();
    if (user.photoURL && user.photoURL !== userData.photoURL) {
      await userRef.update({
        photoURL: user.photoURL
      });
    }
  }
}

// Generate unique referral code
function generateReferralCode() {
  return 'SHARP' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Google Sign In with popup method
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await auth.signInWithPopup(provider);
    console.log('Successfully signed in:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    
    // Handle specific OAuth domain error
    if (error.code === 'auth/unauthorized-domain') {
      alert('⚠️ OAuth Error: This domain is not authorized.\n\nPlease add this domain to Firebase Console:\n1. Go to Firebase Console > Authentication > Settings\n2. Add this domain to "Authorized domains"\n3. Try signing in again');
    } else if (error.code === 'auth/popup-blocked') {
      alert('Pop-up blocked! Please allow pop-ups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log('User closed the sign-in popup');
    } else {
      alert('Sign in failed: ' + error.message);
    }
    throw error;
  }
}

// Email/Password Sign Up
async function signUpWithEmail(email, password, username) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName: username });
    return result.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

// Email/Password Sign In
async function signInWithEmail(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign Out
async function signOut() {
  try {
    // Disconnect wallet if connected
    if (typeof disconnectWallet !== 'undefined') {
      disconnectWallet();
    }
    
    // Clear wallet connection state
    localStorage.removeItem('walletConnected');
    
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// UI Updates
function updateUIForLoggedInUser(user) {
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  
  if (loginBtn) loginBtn.style.display = 'none';
  if (userProfile) {
    userProfile.style.display = 'flex';
  }
  if (userName) {
    userName.textContent = user.displayName || user.email;
  }
  
  // Load and display profile photo
  loadNavProfilePhoto(user.uid);
  
  // Update wallet button state (enable it now that user is logged in)
  if (typeof updateWalletUI === 'function') {
    updateWalletUI(false); // Update to show "Connect Wallet" instead of "Sign In to Connect"
  }
}

async function loadNavProfilePhoto(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      // Prioritize Firebase stored photo, then auth photo
      const photoURL = userData.photoURL || (currentUser && currentUser.photoURL) || '';
      updateNavProfilePhoto(photoURL);
    } else if (currentUser && currentUser.photoURL) {
      // Fallback to auth photo if document doesn't exist yet
      updateNavProfilePhoto(currentUser.photoURL);
    }
  } catch (error) {
    console.error('Error loading profile photo:', error);
    // Try to use auth photo as fallback
    if (currentUser && currentUser.photoURL) {
      updateNavProfilePhoto(currentUser.photoURL);
    }
  }
}

function updateNavProfilePhoto(photoURL) {
  const photoImg = document.getElementById('navProfilePhoto');
  const iconSpan = document.getElementById('navProfileIcon');
  
  if (photoImg && iconSpan) {
    if (photoURL) {
      photoImg.src = photoURL;
      photoImg.style.display = 'block';
      iconSpan.style.display = 'none';
    } else {
      photoImg.style.display = 'none';
      iconSpan.style.display = 'block';
    }
  }
}

function updateUIForLoggedOutUser() {
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  
  if (loginBtn) loginBtn.style.display = 'block';
  if (userProfile) userProfile.style.display = 'none';
  
  // Update wallet button state (show sign in required)
  if (typeof updateWalletUI === 'function') {
    updateWalletUI(false); // Update to show "Sign In to Connect"
  }
}

// Check authentication
function requireAuth() {
  if (!currentUser) {
    alert('Please sign in to continue');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
