<?php
// Ensure no output before headers
if (ob_get_level()) ob_end_clean();

// Set headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

require_once '../config/database.php';

// Get request data
$action = $_GET['action'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Handle preflight request
if ($requestMethod === 'OPTIONS') {
    exit(0);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();

    switch ($action) {
        case 'create':
            if ($requestMethod === 'POST') {
                createStudent($db);
            } else {
                sendResponse(405, ['success' => false, 'message' => 'Method not allowed']);
            }
            break;
            
        case 'read':
            if ($requestMethod === 'GET') {
                if (isset($_GET['id'])) {
                    getStudent($db, $_GET['id']);
                } else {
                    getStudents($db);
                }
            } else {
                sendResponse(405, ['success' => false, 'message' => 'Method not allowed']);
            }
            break;
            
        case 'update':
            if ($requestMethod === 'POST') {
                updateStudent($db);
            } else {
                sendResponse(405, ['success' => false, 'message' => 'Method not allowed']);
            }
            break;
            
        case 'delete':
            if ($requestMethod === 'DELETE') {
                if (!isset($_GET['id'])) {
                    sendResponse(400, ['success' => false, 'message' => 'Missing student ID']);
                }
                deleteStudent($db, $_GET['id']);
            } else {
                sendResponse(405, ['success' => false, 'message' => 'Method not allowed']);
            }
            break;
            
        case 'search':
            if ($requestMethod === 'GET') {
                if (!isset($_GET['term'])) {
                    sendResponse(400, ['success' => false, 'message' => 'Missing search term']);
                }
                searchStudents($db, $_GET['term']);
            } else {
                sendResponse(405, ['success' => false, 'message' => 'Method not allowed']);
            }
            break;
            
        default:
            sendResponse(400, ['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (PDOException $e) {
    sendResponse(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    sendResponse(500, ['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

// Helper function to standardize JSON responses
function sendResponse($statusCode, $data) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function createStudent($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        sendResponse(400, ['success' => false, 'message' => 'Invalid request data']);
    }

    $query = "INSERT INTO students 
              (student_id, first_name, last_name, email, phone, course, enrollment_date, status) 
              VALUES 
              (:student_id, :first_name, :last_name, :email, :phone, :course, :enrollment_date, :status)";
    
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':first_name' => $data['first_name'],
            ':last_name' => $data['last_name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'] ?? null,
            ':course' => $data['course'],
            ':enrollment_date' => $data['enrollment_date'],
            ':status' => $data['status']
        ]);
        
        sendResponse(201, [
            'success' => true,
            'id' => $db->lastInsertId(),
            'message' => 'Student created successfully'
        ]);
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Student creation failed: ' . $e->getMessage()
        ]);
    }
}

function getStudents($db) {
    $query = "SELECT * FROM students ORDER BY last_name, first_name";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(200, [
            'success' => true,
            'data' => $students
        ]);
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Failed to fetch students: ' . $e->getMessage()
        ]);
    }
}

function getStudent($db, $id) {
    $query = "SELECT * FROM students WHERE id = :id";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([':id' => $id]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($student) {
            sendResponse(200, [
                'success' => true,
                'data' => $student
            ]);
        } else {
            sendResponse(404, [
                'success' => false,
                'message' => 'Student not found'
            ]);
        }
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Failed to fetch student: ' . $e->getMessage()
        ]);
    }
}

function updateStudent($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data || !isset($data['id'])) {
        sendResponse(400, ['success' => false, 'message' => 'Invalid request data']);
    }

    $query = "UPDATE students SET 
              student_id = :student_id,
              first_name = :first_name,
              last_name = :last_name,
              email = :email,
              phone = :phone,
              course = :course,
              enrollment_date = :enrollment_date,
              status = :status
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([
            ':id' => $data['id'],
            ':student_id' => $data['student_id'],
            ':first_name' => $data['first_name'],
            ':last_name' => $data['last_name'],
            ':email' => $data['email'],
            ':phone' => $data['phone'] ?? null,
            ':course' => $data['course'],
            ':enrollment_date' => $data['enrollment_date'],
            ':status' => $data['status']
        ]);
        
        sendResponse(200, [
            'success' => true,
            'message' => 'Student updated successfully'
        ]);
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Student update failed: ' . $e->getMessage()
        ]);
    }
}

function deleteStudent($db, $id) {
    $query = "DELETE FROM students WHERE id = :id";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() > 0) {
            sendResponse(200, [
                'success' => true,
                'message' => 'Student deleted successfully'
            ]);
        } else {
            sendResponse(404, [
                'success' => false,
                'message' => 'Student not found'
            ]);
        }
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Student deletion failed: ' . $e->getMessage()
        ]);
    }
}

function searchStudents($db, $term) {
    $query = "SELECT * FROM students 
              WHERE student_id LIKE :term 
              OR first_name LIKE :term 
              OR last_name LIKE :term 
              OR email LIKE :term 
              OR course LIKE :term
              ORDER BY last_name, first_name";
    
    $stmt = $db->prepare($query);
    $searchTerm = "%$term%";
    
    try {
        $stmt->execute([':term' => $searchTerm]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, [
            'success' => true,
            'data' => $students
        ]);
    } catch (PDOException $e) {
        sendResponse(500, [
            'success' => false,
            'message' => 'Search failed: ' . $e->getMessage()
        ]);
    }
}