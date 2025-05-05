import { auth, db } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import firebase from 'firebase/app';

// Submit feedback
async function submitFeedback(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    try {
        await firebase.firestore().collection('feedback').add({
            name: name,
            email: email,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        document.getElementById('feedbackForm').reset();
        alert('Feedback submitted successfully!');
    } catch (error) {
        alert('Error submitting feedback: ' + error.message);
    }
}

// Load feedback for admin view
async function loadFeedback() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData.role === 'admin') {
            const feedbackList = document.getElementById('feedbackList');
            
            // Real-time feedback updates
            firebase.firestore().collection('feedback')
                .orderBy('timestamp', 'desc')
                .onSnapshot((snapshot) => {
                    feedbackList.innerHTML = '';
                    
                    snapshot.forEach((doc) => {
                        const feedback = doc.data();
                        const feedbackElement = createFeedbackElement(feedback);
                        feedbackList.appendChild(feedbackElement);
                    });
                });
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

// Create feedback element
function createFeedbackElement(feedback) {
    const div = document.createElement('div');
    div.className = 'feedback-item';
    
    const date = feedback.timestamp ? new Date(feedback.timestamp.toDate()).toLocaleString() : 'Date not available';
    
    div.innerHTML = `
        <h4>${feedback.name}</h4>
        <p><strong>Email:</strong> ${feedback.email}</p>
        <p><strong>Message:</strong> ${feedback.message}</p>
        <p><small>Submitted on: ${date}</small></p>
        <hr>
    `;
    
    return div;
}

// Initialize feedback functionality
document.addEventListener('DOMContentLoaded', () => {
    loadFeedback();
}); 