import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs } from "firebase/firestore";

// Upload image as base64 to Firestore
async function uploadImage(event) {
    event.preventDefault();

    const file = document.getElementById("imageFile").files[0];
    if (!file) return alert("Please select an image.");

    const title = document.getElementById("imageTitle").value;
    const description = document.getElementById("imageDescription").value;
    const category = document.getElementById("category").value;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Image = reader.result;

        await addDoc(collection(db, "gallery"), {
            title,
            description,
            category,
            imageBase64: base64Image,
            timestamp: new Date(),
            uploadedBy: auth.currentUser ? auth.currentUser.uid : "anonymous"
        });

        alert("Image uploaded successfully!");
        document.getElementById("uploadForm").reset();
        document.getElementById("uploadProgress").innerText = "";
        loadGallery();
    };

    document.getElementById("uploadProgress").innerText = "Uploading... 100%";
    reader.readAsDataURL(file);
}
window.uploadImage = uploadImage;

// Load images from Firestore
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';

    const snapshot = await getDocs(collection(db, 'gallery'));
    snapshot.forEach(doc => {
        const data = doc.data();
        const imageElement = document.createElement('div');
        imageElement.classList.add('relative', 'group', 'rounded-lg');
        imageElement.innerHTML = `
            <img src="${data.imageBase64}" alt="${data.title}" class="w-full h-auto rounded-lg shadow-lg transform transition duration-300 group-hover:scale-105">
            <div class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition">
                <span class="text-white text-lg font-semibold">${data.title}</span>
            </div>
        `;
        galleryGrid.appendChild(imageElement);
    });
}
window.loadGallery = loadGallery;

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    loadGallery();
});
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const uploadSection = document.getElementById('uploadSection');
const uploadForm = document.getElementById('uploadForm');
const galleryGrid = document.getElementById('galleryGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const authLink = document.getElementById('authLink');

// Check user role and update UI
function checkUserRole() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // User is signed in
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                const userData = userDoc.data();

                // Update auth link
                authLink.textContent = 'Logout';
                authLink.onclick = () => {
                    firebase.auth().signOut();
                    window.location.href = 'login.html';
                };

                console.log('User role:', userData.role); // Debug log

                // Show upload section only for admin
                if (userData.role === 'admin') {
                    uploadSection.classList.remove('hidden');
                    console.log('Showing upload section for admin'); // Debug log
                } else {
                    uploadSection.classList.add('hidden');
                    console.log('Hiding upload section for non-admin'); // Debug log
                }
            } catch (error) {
                console.error('Error checking user role:', error);
            }
        } else {
            // User is signed out
            authLink.textContent = 'Login';
            authLink.onclick = () => {
                window.location.href = 'login.html';
            };
            uploadSection.classList.add('hidden');
            console.log('User is signed out, hiding upload section'); // Debug log
        }
    });
}

// Handle image upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const imageFile = document.getElementById('imageFile').files[0];
    const imageTitle = document.getElementById('imageTitle').value;
    const imageDescription = document.getElementById('imageDescription').value;
    const category = document.getElementById('category').value;

    if (!imageFile) {
        alert('Please select an image to upload');
        return;
    }

    // Check file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }

    loadingIndicator.classList.remove('hidden');
    const submitButton = uploadForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Uploading...';

    try {
        // Create a unique filename
        const timestamp = new Date().getTime();
        const fileExtension = imageFile.name.split('.').pop();
        const uniqueFilename = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        
        // Create storage reference
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`gallery/${uniqueFilename}`);

        // Create upload task
        const uploadTask = imageRef.put(imageFile, {
            contentType: imageFile.type
        });

        // Monitor upload progress
        uploadTask.on('state_changed',
            (snapshot) => {
                // Handle progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                submitButton.textContent = `Uploading... ${Math.round(progress)}%`;
            },
            (error) => {
                // Handle error
                console.error('Upload error:', error);
                alert(`Error uploading image: ${error.message}`);
                submitButton.disabled = false;
                submitButton.textContent = 'Upload Image';
                loadingIndicator.classList.add('hidden');
            },
            async () => {
                try {
                    // Upload completed successfully
                    const imageUrl = await uploadTask.snapshot.ref.getDownloadURL();

                    // Save image metadata to Firestore
                    await firebase.firestore().collection('gallery').add({
                        url: imageUrl,
                        title: imageTitle,
                        description: imageDescription,
                        category: category,
                        filename: uniqueFilename,
                        originalFilename: imageFile.name,
                        size: imageFile.size,
                        type: imageFile.type,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        uploadedBy: firebase.auth().currentUser.uid
                    });

                    alert('Image uploaded successfully!');
                    uploadForm.reset();
                } catch (error) {
                    console.error('Firestore error:', error);
                    alert(`Error saving image data: ${error.message}`);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Upload Image';
                    loadingIndicator.classList.add('hidden');
                }
            }
        );
    } catch (error) {
        console.error('Error starting upload:', error);
        alert(`Error starting upload: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Upload Image';
        loadingIndicator.classList.add('hidden');
    }
});

// Load gallery images with error handling and retry
function loadGalleryImages() {
    loadingIndicator.classList.remove('hidden');
    let retryCount = 0;
    const maxRetries = 3;

    function tryLoadImages() {
        firebase.firestore().collection('gallery')
            .orderBy('timestamp', 'desc')
            .get()
            .then((snapshot) => {
                galleryGrid.innerHTML = '';
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.className = 'gallery-item bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300';
                    div.innerHTML = `
                        <img src="${data.url}" 
                            alt="${data.title || data.filename}" 
                            class="w-full h-64 object-cover rounded-lg mb-4"
                            onerror="this.onerror=null; this.src='placeholder.jpg';">
                        ${data.title ? `<h3 class="text-lg font-semibold mb-2">${data.title}</h3>` : ''}
                        ${data.description ? `<p class="text-gray-600 mb-2">${data.description}</p>` : ''}
                        <p class="text-sm text-gray-500">
                            ${data.category ? data.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
                        </p>
                    `;
                    galleryGrid.appendChild(div);
                });

                loadingIndicator.classList.add('hidden');
            })
            .catch((error) => {
                console.error('Error loading gallery:', error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying... (${retryCount}/${maxRetries})`);
                    setTimeout(tryLoadImages, 1000 * retryCount);
                } else {
                    alert('Error loading gallery. Please refresh the page.');
                    loadingIndicator.classList.add('hidden');
                }
            });
    }

    tryLoadImages();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkUserRole();
    loadGalleryImages();
});

// Handle mobile menu
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
});