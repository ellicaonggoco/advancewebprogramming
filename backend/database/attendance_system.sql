-- =======================================================
-- EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM DATABASE SCRIPT
-- Group Members:
--   1. Ellica Chris Onggoco (Group Leader & System Admin)
--   2. John Herzsel Datul
--   3. John Rafael Corpuz
--   4. Neil Chester Mari Garcia
--   5. John Michael Nolasco
--   6. Diether Baculpo
--   7. Clark Manlapaz
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB
-- Contains: 5 Tables, PKs, FKs, Constraints, Indexes & Sample Records
-- =======================================================

DROP DATABASE IF EXISTS employee_attendance_db;
CREATE DATABASE employee_attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_attendance_db;

-- -------------------------------------------------------
-- Table 1: DEPARTMENTS
-- -------------------------------------------------------
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    manager_name VARCHAR(100),
    budget DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Table 2: EMPLOYEES
-- -------------------------------------------------------
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    position VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Active', 'On Leave', 'Terminated') NOT NULL DEFAULT 'Active',
    shift VARCHAR(50) DEFAULT 'Standard (9:00 AM - 5:00 PM)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Table 3: USERS (Authentication & Role-Based Access)
-- -------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'employee',
    employee_id INT NULL UNIQUE,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Table 4: ATTENDANCE (Time Tracking & Daily Status)
-- -------------------------------------------------------
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NULL,
    time_out TIME NULL,
    status ENUM('Present', 'Late', 'Absent', 'Half-Day', 'Undertime', 'Incomplete Shift', 'On Leave') NOT NULL DEFAULT 'Present',
    work_hours DECIMAL(4, 2) DEFAULT 0.00,
    late_minutes INT DEFAULT 0,
    method VARCHAR(50) DEFAULT 'Web Clock-In',
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_employee_date (employee_id, date),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Table 5: LEAVE_REQUESTS (Approval Workflow)
-- -------------------------------------------------------
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type ENUM('Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Maternity/Paternity Leave', 'Bereavement Leave') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    reviewed_by VARCHAR(100) NULL,
    review_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- Table 6: ATTENDANCE_ADJUSTMENTS (Time Correction Requests)
-- -------------------------------------------------------
CREATE TABLE attendance_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    requested_time_in VARCHAR(20) NOT NULL,
    requested_time_out VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    reviewed_by VARCHAR(100) NULL,
    review_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_adjustment_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =======================================================
-- SAMPLE DATA INSERTION (DML)
-- =======================================================

-- Departments
INSERT INTO departments (name, code, description, manager_name, budget) VALUES
('Executive & Project Management', 'EXEC', 'Strategic direction, project leadership, and organizational administration', 'Ellica Chris Onggoco', 650000.00),
('Information Technology & Engineering', 'IT', 'Software architecture, database infrastructure, and UI/UX design', 'John Herzsel Datul', 550000.00),
('Human Resources & Compliance', 'HR', 'Workforce timekeeping, personnel relations, and employee records', 'Diether Baculpo', 300000.00),
('Operations & Quality Assurance', 'OPS', 'Quality assurance testing, operational logistics, and systems support', 'John Michael Nolasco', 350000.00),
('Finance & Business Analytics', 'FIN', 'Financial reporting, budgets, payroll calculations, and fiscal audits', 'Clark Manlapaz', 400000.00);

-- Employees
INSERT INTO employees (employee_id, first_name, last_name, email, phone, department_id, position, hire_date, salary, status) VALUES
('EMP-1001', 'Ellica Chris', 'Onggoco', 'ellica.onggoco@company.com', '+63 917 123 4501', 1, 'System Administrator & Project Director', '2021-01-15', 125000.00, 'Active'),
('EMP-1002', 'John Herzsel', 'Datul', 'herzsel.datul@company.com', '+63 917 123 4502', 2, 'Lead Systems Architect & Full-Stack Engineer', '2021-03-10', 95000.00, 'Active'),
('EMP-1003', 'John Rafael', 'Corpuz', 'rafael.corpuz@company.com', '+63 917 123 4503', 2, 'Systems Analyst & Database Engineer', '2021-05-18', 88000.00, 'Active'),
('EMP-1004', 'Neil Chester Mari', 'Garcia', 'neil.garcia@company.com', '+63 917 123 4504', 2, 'Frontend Engineer & UI/UX Specialist', '2022-02-01', 85000.00, 'Active'),
('EMP-1005', 'John Michael', 'Nolasco', 'michael.nolasco@company.com', '+63 917 123 4505', 4, 'Operations & Quality Assurance Lead', '2022-04-15', 80000.00, 'Active'),
('EMP-1006', 'Diether', 'Baculpo', 'diether.baculpo@company.com', '+63 917 123 4506', 3, 'HR & Personnel Compliance Specialist', '2022-07-20', 78000.00, 'Active'),
('EMP-1007', 'Clark', 'Manlapaz', 'clark.manlapaz@company.com', '+63 917 123 4507', 5, 'Financial Operations & Analytics Specialist', '2022-09-01', 78000.00, 'Active');

-- Users
-- Passwords hashed with bcrypt: 'admin123' for admin, 'employee123' for staff
INSERT INTO users (username, email, password_hash, role, employee_id, status) VALUES
('ellica', 'ellica.onggoco@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'admin', 1, 'active'),
('herzsel', 'herzsel.datul@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 2, 'active'),
('rafael', 'rafael.corpuz@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 3, 'active'),
('neil', 'neil.garcia@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 4, 'active'),
('michael', 'michael.nolasco@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 5, 'active'),
('diether', 'diether.baculpo@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 6, 'active'),
('clark', 'clark.manlapaz@company.com', '$2a$10$wE0vP7f4eXWf9O6/mFv4t.JbZz9gK4u2M0p7E4d9hP9b0hX1s8K.m', 'employee', 7, 'active');

-- Attendance Records
INSERT INTO attendance (employee_id, date, time_in, time_out, status, work_hours, late_minutes, method, notes) VALUES
(1, CURDATE(), '08:45:00', '17:05:00', 'Present', 8.33, 0, 'Web Clock-In', 'Executive briefing'),
(2, CURDATE(), '08:52:00', '17:15:00', 'Present', 8.38, 0, 'Web Clock-In', 'Architecture sync'),
(3, CURDATE(), '08:58:00', '17:00:00', 'Present', 8.03, 0, 'Web Clock-In', 'Database replication check'),
(4, CURDATE(), '09:18:00', '17:30:00', 'Late', 8.20, 18, 'Web Clock-In', 'Transit delay'),
(5, CURDATE(), '08:40:00', '17:00:00', 'Present', 8.33, 0, 'Web Clock-In', 'QA sprint testing'),
(6, CURDATE(), '08:50:00', '13:00:00', 'Half-Day', 4.17, 0, 'Web Clock-In', 'Approved afternoon checkup'),
(7, CURDATE(), NULL, NULL, 'On Leave', 0.00, 0, 'System Auto', 'Approved Vacation Leave');

-- Leave Requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status, reviewed_by, review_notes) VALUES
(7, 'Vacation Leave', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 3, 'Annual scheduled family vacation trip', 'Approved', 'Ellica Chris Onggoco', 'Approved. Enjoy your time off!'),
(4, 'Sick Leave', DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1, 'Medical consultation and recovery', 'Pending', NULL, NULL),
(5, 'Emergency Leave', CURDATE(), CURDATE(), 1, 'Home residential electrical inspection', 'Rejected', 'Ellica Chris Onggoco', 'Please reschedule due to active QA sprint.');

-- Attendance Adjustments (Time Correction Requests)
INSERT INTO attendance_adjustments (employee_id, date, requested_time_in, requested_time_out, reason, status, reviewed_by, review_notes) VALUES
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:50 AM', '05:05 PM', 'Server maintenance emergency punch omission', 'Approved', 'Ellica Chris Onggoco', 'Verified against server maintenance log.'),
(3, CURDATE(), '08:55 AM', '05:00 PM', 'Network connectivity delay at building entrance', 'Pending', NULL, NULL);
