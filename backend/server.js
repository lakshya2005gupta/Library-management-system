const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createPool({
    host: '127.0.0.1',       // Use 127.0.0.1 for Docker localhost mapping
    user: 'root',
    password: 'rootpassword', // Matches MYSQL_ROOT_PASSWORD in docker-compose
    database: 'library_db'    // Matches MYSQL_DATABASE in docker-compose
});

// ==========================================
// MODULE 4: BOOK ISSUE LOGIC
// ==========================================
app.post('/api/issue', async (req, res) => {
    const { student_id, book_id, issue_date } = req.body;

    try {
        // 1. Check if student has borrowed 3 books
        const [activeIssues] = await db.query(
            'SELECT COUNT(*) as count FROM issued_books WHERE student_id = ? AND status = "Issued"', 
            [student_id]
        );
        if (activeIssues[0].count >= 3) {
            return res.status(400).json({ error: 'Student has reached the maximum limit of 3 books.' });
        }

        // 2. Check book availability
        const [book] = await db.query('SELECT available_copies FROM books WHERE id = ?', [book_id]);
        if (book[0].available_copies <= 0) {
            return res.status(400).json({ error: 'Book is currently out of stock.' });
        }

        // 3. Issue Book & Update Copies (Using Transaction)
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.query(
                'INSERT INTO issued_books (student_id, book_id, issue_date, status) VALUES (?, ?, ?, "Issued")',
                [student_id, book_id, issue_date]
            );
            await connection.query(
                'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
                [book_id]
            );
            await connection.commit();
            res.json({ message: 'Book issued successfully!' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// MODULE 5 & 6: RETURN & FINE CALCULATION
// ==========================================
app.post('/api/return', async (req, res) => {
    const { issue_id, return_date } = req.body;

    try {
        const [issueRecord] = await db.query('SELECT issue_date, book_id FROM issued_books WHERE id = ?', [issue_id]);
        if (issueRecord.length === 0) return res.status(404).json({ error: 'Issue record not found' });

        const issueDate = new Date(issueRecord[0].issue_date);
        const returnDate = new Date(return_date);
        
        // Fine Logic Calculation
        const diffTime = Math.abs(returnDate - issueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let fine = 0;
        if (diffDays > 7) {
            fine = (diffDays - 7) * 10; // ₹10 per day after 7 days
        }

        // Update database
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.query(
                'UPDATE issued_books SET return_date = ?, fine_amount = ?, status = "Returned" WHERE id = ?',
                [return_date, fine, issue_id]
            );
            await connection.query(
                'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
                [issueRecord[0].book_id]
            );
            await connection.commit();
            res.json({ message: 'Book returned successfully', days_delayed: diffDays, fine_calculated: fine });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ==========================================
// MODULE 2: BOOK MANAGEMENT (CRUD)
// ==========================================
app.get('/api/books', async (req, res) => {
    try {
        const [books] = await db.query('SELECT * FROM books');
        res.json(books);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/books', async (req, res) => {
    const { book_id, book_name, author_name, category, total_copies } = req.body;
    try {
        await db.query(
            'INSERT INTO books (book_id, book_name, author_name, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)',
            [book_id, book_name, author_name, category, total_copies, total_copies]
        );
        res.json({ message: 'Book added successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// MODULE 3: STUDENT MANAGEMENT (CRUD)
// ==========================================
app.get('/api/students', async (req, res) => {
    try {
        const [students] = await db.query('SELECT * FROM students');
        res.json(students);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students', async (req, res) => {
    const { roll_number, student_name, department, mobile, email } = req.body;
    try {
        await db.query(
            'INSERT INTO students (roll_number, student_name, department, mobile, email) VALUES (?, ?, ?, ?, ?)',
            [roll_number, student_name, department, mobile, email]
        );
        res.json({ message: 'Student added successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('Library API running on port 3000'));
// ==========================================
// MODULE 7: DASHBOARD STATISTICS
// ==========================================
app.get('/api/dashboard', async (req, res) => {
    try {
        const [totalBooks] = await db.query('SELECT SUM(total_copies) as count FROM books');
        const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM students');
        const [issuedBooks] = await db.query('SELECT COUNT(*) as count FROM issued_books WHERE status = "Issued"');
        const [availableBooks] = await db.query('SELECT SUM(available_copies) as count FROM books');
        const [collectedFine] = await db.query('SELECT SUM(fine_amount) as total FROM issued_books WHERE status = "Returned"');

        res.json({
            total_books: totalBooks[0].count || 0,
            total_students: totalStudents[0].count || 0,
            issued_books: issuedBooks[0].count || 0,
            available_books: availableBooks[0].count || 0,
            collected_fine: collectedFine[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// MODULE 8: REPORTS & BONUS FEATURE
// ==========================================
// Overdue Books Report
app.get('/api/reports/overdue', async (req, res) => {
    try {
        const query = `
            SELECT s.student_name, b.book_name, ib.issue_date, DATEDIFF(CURDATE(), ib.issue_date) as days_borrowed
            FROM issued_books ib
            JOIN students s ON ib.student_id = s.id
            JOIN books b ON ib.book_id = b.id
            WHERE ib.status = 'Issued' AND DATEDIFF(CURDATE(), ib.issue_date) > 7
        `;
        const [overdue] = await db.query(query);
        res.json(overdue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Active Issues Report (To find Transaction IDs)
app.get('/api/reports/active', async (req, res) => {
    try {
        const query = `
            SELECT ib.id as transaction_id, s.student_name, b.book_name, ib.issue_date
            FROM issued_books ib
            JOIN students s ON ib.student_id = s.id
            JOIN books b ON ib.book_id = b.id
            WHERE ib.status = 'Issued'
        `;
        const [active] = await db.query(query);
        res.json(active);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bonus: Top 5 Readers List
app.get('/api/reports/top-readers', async (req, res) => {
    try {
        const query = `
            SELECT s.student_name, COUNT(ib.id) as books_borrowed
            FROM issued_books ib
            JOIN students s ON ib.student_id = s.id
            GROUP BY s.id
            ORDER BY books_borrowed DESC
            LIMIT 5
        `;
        const [topReaders] = await db.query(query);
        res.json(topReaders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});