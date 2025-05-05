// Update fee structure (Admin only)
async function updateFeeStructure(event) {
    event.preventDefault();

    const hostelFee = Number(document.getElementById('hostelFee').value);
    const gymFee = Number(document.getElementById('gymFee').value);

    try {
        await db.collection('feeStructure').doc('current').set({
            hostelFee,
            gymFee,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Fee structure updated successfully!');
        loadFeeStructure();
    } catch (error) {
        alert('Error updating fee structure: ' + error.message);
    }
}

// Load fee structure
async function loadFeeStructure() {
    try {
        const doc = await db.collection('feeStructure').doc('current').get();
        if (doc.exists) {
            const data = doc.data();
            if (document.getElementById('hostelFee')) {
                document.getElementById('hostelFee').value = data.hostelFee;
            }
            if (document.getElementById('gymFee')) {
                document.getElementById('gymFee').value = data.gymFee;
            }
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error loading fee structure:', error);
        return null;
    }
}

// Load student fee records (Admin only)
async function loadStudentFeeRecords() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData.role === 'admin') {
            const recordsDiv = document.getElementById('studentFeeRecords');
            
            // Real-time updates for student records
            db.collection('users')
                .where('role', '==', 'student')
                .onSnapshot((snapshot) => {
                    recordsDiv.innerHTML = '<table class="fees-table"><tr><th>Student Email</th><th>Hostel Fee Status</th><th>Gym Fee Status</th><th>Actions</th></tr>';
                    
                    snapshot.forEach((doc) => {
                        const student = doc.data();
                        const row = createStudentFeeRow(doc.id, student);
                        recordsDiv.querySelector('table').appendChild(row);
                    });
                    
                    recordsDiv.innerHTML += '</table>';
                });
        }
    } catch (error) {
        console.error('Error loading student records:', error);
    }
}

// Create student fee row
function createStudentFeeRow(studentId, student) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${student.email}</td>
        <td>${student.hostelFeePaid ? 'Paid' : 'Pending'}</td>
        <td>${student.gymFeePaid ? 'Paid' : 'Pending'}</td>
        <td>
            <button onclick="updateFeeStatus('${studentId}', 'hostel', ${!student.hostelFeePaid})" class="btn">
                ${student.hostelFeePaid ? 'Mark Hostel Unpaid' : 'Mark Hostel Paid'}
            </button>
            <button onclick="updateFeeStatus('${studentId}', 'gym', ${!student.gymFeePaid})" class="btn">
                ${student.gymFeePaid ? 'Mark Gym Unpaid' : 'Mark Gym Paid'}
            </button>
        </td>
    `;
    
    return tr;
}

// Update student fee status (Admin only)
async function updateFeeStatus(studentId, feeType, status) {
    try {
        const update = {};
        update[`${feeType}FeePaid`] = status;
        
        await db.collection('users').doc(studentId).update(update);
        alert(`${feeType.charAt(0).toUpperCase() + feeType.slice(1)} fee status updated successfully!`);
    } catch (error) {
        alert('Error updating fee status: ' + error.message);
    }
}

// Load student's personal fee status
async function loadPersonalFeeStatus() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData.role === 'student') {
            const feeStructure = await loadFeeStructure();
            const feeDetails = document.getElementById('feeDetails');
            
            if (feeStructure) {
                feeDetails.innerHTML = `
                    <div class="fee-status">
                        <h4>Hostel Fee</h4>
                        <p>Amount: ₹${feeStructure.hostelFee}</p>
                        <p>Status: ${userData.hostelFeePaid ? '<span class="paid">Paid</span>' : '<span class="pending">Pending</span>'}</p>
                    </div>
                    <div class="fee-status">
                        <h4>Gym Fee</h4>
                        <p>Amount: ₹${feeStructure.gymFee}</p>
                        <p>Status: ${userData.gymFeePaid ? '<span class="paid">Paid</span>' : '<span class="pending">Pending</span>'}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading personal fee status:', error);
    }
}

// Initialize fees page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                const userData = doc.data();
                
                // Show/hide views based on role
                document.getElementById('guestView').style.display = 'none';
                
                if (userData.role === 'admin') {
                    document.querySelector('.admin-only').style.display = 'block';
                    document.querySelector('.student-only').style.display = 'none';
                    loadFeeStructure();
                    loadStudentFeeRecords();
                } else if (userData.role === 'student') {
                    document.querySelector('.admin-only').style.display = 'none';
                    document.querySelector('.student-only').style.display = 'block';
                    loadPersonalFeeStatus();
                }
            });
        } else {
            document.getElementById('guestView').style.display = 'block';
            document.querySelector('.admin-only').style.display = 'none';
            document.querySelector('.student-only').style.display = 'none';
        }
    });
}); 