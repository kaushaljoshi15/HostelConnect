import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import firebase from 'firebase/app';

// Local Storage Keys
const USERS_KEY = 'hostelconnect_users';
const CURRENT_USER_KEY = 'hostelconnect_current_user';

// Initialize local storage with some default data if empty
function initializeStorage() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify({}));
    }
}

// Check authentication state
function checkAuthState() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            updateUIForUser(userData);
        } else {
            updateUIForGuest();
        }
    });
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const userDoc = await firebase.firestore().collection('users').doc(userCredential.user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User data not found.');
        }

        window.location.href = 'index.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Register function
async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('userRole').value;

    if (password.length < 6) {
        alert('Password should be at least 6 characters long');
        return;
    }

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Create user document in Firestore
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            email,
            role,
            hostelFeePaid: false,
            gymFeePaid: false,
            createdAt: new Date().toISOString()
        });

        window.location.href = 'index.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'login.html';
    } catch (error) {
        alert('Error signing out: ' + error.message);
    }
}

// Toggle between login and register forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Update UI based on authentication state
function updateUIForUser(userData) {
    const authLink = document.getElementById('authLink');
    if (authLink) {
        authLink.textContent = 'Logout';
        authLink.onclick = logout;
        authLink.href = '#';
    }

    // Show/hide admin features based on role
    const adminElements = document.querySelectorAll('.admin-only');
    const studentElements = document.querySelectorAll('.student-only');
    
    adminElements.forEach(element => {
        element.style.display = userData.role === 'admin' ? 'block' : 'none';
    });
    
    studentElements.forEach(element => {
        element.style.display = userData.role === 'student' ? 'block' : 'none';
    });
}

// Update UI for guest users
function updateUIForGuest() {
    const authLink = document.getElementById('authLink');
    if (authLink) {
        authLink.textContent = 'Login';
        authLink.onclick = null;
        authLink.href = 'login.html';
    }

    // Hide admin and student features
    const adminElements = document.querySelectorAll('.admin-only');
    const studentElements = document.querySelectorAll('.student-only');
    
    adminElements.forEach(element => {
        element.style.display = 'none';
    });
    
    studentElements.forEach(element => {
        element.style.display = 'none';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    checkAuthState();
});
import { auth, db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

auth.onAuthStateChanged(async user => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';

    document.querySelector('.admin-only').style.display = isAdmin ? 'block' : 'none';
  } else {
    document.querySelector('.admin-only').style.display = 'none';
  }
});
