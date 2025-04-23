document.addEventListener('DOMContentLoaded', function() {
    const studentForm = document.getElementById('studentForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    let isEditMode = false;
    
    // Load all students when page loads
    loadStudents();
    
    // Form submit event
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const studentData = {
            id: document.getElementById('id').value,
            student_id: document.getElementById('student_id').value,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            course: document.getElementById('course').value,
            enrollment_date: document.getElementById('enrollment_date').value,
            status: document.getElementById('status').value
        };
        
        if (isEditMode) {
            updateStudent(studentData);
        } else {
            addStudent(studentData);
        }
    });
    
    // Cancel button event
    cancelBtn.addEventListener('click', resetForm);
    
    // Search button event
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchStudents(searchTerm);
        } else {
            loadStudents();
        }
    });
    
    // Search input event (for real-time search)
    searchInput.addEventListener('keyup', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length > 2 || searchTerm.length === 0) {
            if (searchTerm) {
                searchStudents(searchTerm);
            } else {
                loadStudents();
            }
        }
    });
    
    // Function to load all students
    function loadStudents() {
        fetch('api/students.php?action=read')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle both response formats
                const students = data.success ? data.data : data;
                displayStudents(students);
            })
            .catch(error => {
                console.error('Error loading students:', error);
                alert('Failed to load students. Please try again.');
            });
    }
    
    // Function to search students
    function searchStudents(searchTerm) {
        fetch(`api/students.php?action=search&term=${encodeURIComponent(searchTerm)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle both response formats
                const students = data.success ? data.data : data;
                displayStudents(students);
            })
            .catch(error => {
                console.error('Error searching students:', error);
                alert('Failed to search students. Please try again.');
            });
    }
    
    // Function to add a new student
    function addStudent(studentData) {
        fetch('api/students.php?action=create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Failed to add student');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resetForm();
                loadStudents();
                alert('Student added successfully!');
            } else {
                throw new Error(data.message || 'Error adding student');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    }
    
    // Function to update a student
    function updateStudent(studentData) {
        fetch('api/students.php?action=update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Failed to update student');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resetForm();
                loadStudents();
                alert('Student updated successfully!');
            } else {
                throw new Error(data.message || 'Error updating student');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    }
    
    // Function to delete a student
    function deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            fetch(`api/students.php?action=delete&id=${id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.message || 'Failed to delete student');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    loadStudents();
                    alert('Student deleted successfully!');
                } else {
                    throw new Error(data.message || 'Error deleting student');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            });
        }
    }
    
    // Function to display students in the table
    function displayStudents(students) {
        const tableBody = document.getElementById('studentTableBody');
        tableBody.innerHTML = '';
        
        if (!students || students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No students found</td></tr>';
            return;
        }
        
        students.forEach(student => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.email}</td>
                <td>${student.course}</td>
                <td>${student.status}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${student.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${student.id}">Delete</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editStudent(id);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteStudent(this.getAttribute('data-id'));
            });
        });
    }
    
    function editStudent(id) {
        fetch(`api/students.php?action=read&id=${id}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.message || 'Failed to load student');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Handle both response formats
                const student = data.success ? data.data : data;
                
                if (!student || !student.id) {
                    throw new Error('Invalid student data received');
                }
                
                isEditMode = true;
                
                // Fill the form with student data
                document.getElementById('id').value = student.id;
                document.getElementById('student_id').value = student.student_id;
                document.getElementById('first_name').value = student.first_name;
                document.getElementById('last_name').value = student.last_name;
                document.getElementById('email').value = student.email;
                document.getElementById('phone').value = student.phone || '';
                document.getElementById('course').value = student.course;
                document.getElementById('enrollment_date').value = student.enrollment_date;
                document.getElementById('status').value = student.status;
                
                // Scroll to form
                document.querySelector('.form-container').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            })
            .catch(error => {
                console.error('Error fetching student:', error);
                alert(error.message);
            });
    }
    
    // Function to reset the form
    function resetForm() {
        studentForm.reset();
        document.getElementById('id').value = '';
        isEditMode = false;
    }

    function loadStudents() {
        fetch('api/students.php?action=read')
            .then(response => {
                // First check the raw text response
                return response.text().then(text => {
                    console.log("Raw response:", text);
                    // Then try to parse as JSON
                    return JSON.parse(text);
                });
            })
            .then(data => {
                const students = data.success ? data.data : data;
                displayStudents(students);
            })
            .catch(error => {
                console.error('Error loading students:', error);
                alert('Failed to load students. Please check console for details.');
            });
    }
});