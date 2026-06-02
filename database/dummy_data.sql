USE library_db;

-- 1. Insert Students
INSERT INTO students (roll_number, student_name, department, mobile, email) VALUES
('00110402724', 'Aarav Patel', 'CSE', '9876543210', 'aarav@college.edu'),
('00210402724', 'Priya Sharma', 'ECE', '8765432109', 'priya@college.edu'),
('00310402724', 'Karan Singh', 'IT', '7654321098', 'karan@college.edu'),
('00410402724', 'Sneha Gupta', 'CSE', '6543210987', 'sneha@college.edu'),
('00510402724', 'Rohan Verma', 'Mechanical', '5432109876', 'rohan@college.edu');

-- 2. Insert Books (Math is pre-calculated based on the issued books below)
INSERT INTO books (book_id, book_name, author_name, category, total_copies, available_copies) VALUES
('CS-206', 'Theory of Computation', 'Michael Sipser', 'CSE', 10, 9),
('CS-208', 'Database Management Systems', 'Silberschatz', 'CSE', 8, 6),
('EC-204', 'Circuits and Systems', 'A.K. Chakrabarti', 'ECE', 5, 5),
('MA-202', 'Probability and Statistics', 'S.C. Gupta', 'Mathematics', 7, 7),
('CS-210', 'Core Java Programming', 'Cay S. Horstmann', 'CSE', 12, 11);

-- 3. Insert Issued Books History & Active Issues

-- Active Issue: Overdue by 8 days (Will show in Overdue Report)
-- Aarav (ID:1) borrowed Theory of Computation (ID:1) 15 days ago.
INSERT INTO issued_books (student_id, book_id, issue_date, status) 
VALUES (1, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Issued');

-- Active Issue: Not Overdue
-- Aarav (ID:1) borrowed DBMS (ID:2) 3 days ago.
INSERT INTO issued_books (student_id, book_id, issue_date, status) 
VALUES (1, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Issued');

-- Active Issue: Overdue by 3 days
-- Priya (ID:2) borrowed DBMS (ID:2) 10 days ago.
INSERT INTO issued_books (student_id, book_id, issue_date, status) 
VALUES (2, 2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Issued');

-- Active Issue: Not Overdue
-- Karan (ID:3) borrowed Java (ID:5) 2 days ago.
INSERT INTO issued_books (student_id, book_id, issue_date, status) 
VALUES (3, 5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Issued');

-- Returned Book: Generated an ₹80 Fine
-- Aarav (ID:1) borrowed Probability (ID:4) 20 days ago, returned it 5 days ago (Held for 15 days).
INSERT INTO issued_books (student_id, book_id, issue_date, return_date, fine_amount, status) 
VALUES (1, 4, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 80.00, 'Returned');

-- Returned Book: No Fine
-- Sneha (ID:4) borrowed ToC (ID:1) 10 days ago, returned it 8 days ago (Held for 2 days).
INSERT INTO issued_books (student_id, book_id, issue_date, return_date, fine_amount, status) 
VALUES (4, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 0.00, 'Returned');