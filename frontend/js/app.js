const API_URL = 'http://localhost:3000/api';

// --- Login & Logout Logic ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a full production app, this would verify the token with the backend.
    // For this UI flow, we will bypass to the dashboard upon clicking login.
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    showModule('dashboard');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
});

// --- Module Navigation & UI Injection ---
function showModule(moduleId) {
    const content = document.getElementById('dynamic-content');
    
    if (moduleId === 'dashboard') {
        content.innerHTML = `
            <div class="card">
                <h3>System Overview</h3>
                <div id="dashboard-stats" style="display: flex; gap: 20px; flex-wrap: wrap;">Loading stats...</div>
            </div>`;
        loadDashboard();
    }
    else if (moduleId === 'books') {
        content.innerHTML = `
            <div class="card">
                <h3>Add New Book</h3>
                <form onsubmit="handleAddBook(event)" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="b_id" placeholder="Book ID (e.g. B002)" required style="width: 150px;">
                    <input type="text" id="b_name" placeholder="Book Name" required>
                    <input type="text" id="b_author" placeholder="Author" required>
                    <input type="text" id="b_cat" placeholder="Category">
                    <input type="number" id="b_copies" placeholder="Total Copies" required style="width: 150px;">
                    <button type="submit" style="width: 150px;">Add Book</button>
                </form>
            </div>
            <div class="card" style="margin-top: 20px;">
                <h3>Book Inventory</h3>
                <div id="books-table-container">Loading books...</div>
            </div>`;
        loadBooks();
    } 
    else if (moduleId === 'students') {
        content.innerHTML = `
            <div class="card">
                <h3>Add New Student</h3>
                <form onsubmit="handleAddStudent(event)" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="s_roll" placeholder="Roll Number" required style="width: 150px;">
                    <input type="text" id="s_name" placeholder="Student Name" required>
                    <input type="text" id="s_dept" placeholder="Department" required>
                    <input type="text" id="s_mob" placeholder="Mobile" required>
                    <input type="email" id="s_email" placeholder="Email" required>
                    <button type="submit" style="width: 150px;">Add Student</button>
                </form>
            </div>
            <div class="card" style="margin-top: 20px;">
                <h3>Registered Students</h3>
                <div id="students-table-container">Loading students...</div>
            </div>`;
        loadStudents();
    }
    else if (moduleId === 'issue') {
        content.innerHTML = `
            <div class="card">
                <h3>Issue Book to Student</h3>
                <form onsubmit="handleIssue(event)">
                    <div class="form-group"><label>Student ID (Database ID)</label><input type="number" id="student_id" required></div>
                    <div class="form-group"><label>Book ID (Database ID)</label><input type="number" id="book_id" required></div>
                    <div class="form-group"><label>Issue Date</label><input type="date" id="issue_date" required></div>
                    <button type="submit">Issue Book</button>
                </form>
                <p id="issue-msg" class="message"></p>
            </div>`;
    } 
    else if (moduleId === 'return') {
        content.innerHTML = `
            <div class="card">
                <h3>Return Book & Calculate Fine</h3>
                <form onsubmit="handleReturn(event)">
                    <div class="form-group"><label>Issue Transaction ID</label><input type="number" id="issue_id" required></div>
                    <div class="form-group"><label>Return Date</label><input type="date" id="return_date" required></div>
                    <button type="submit">Process Return</button>
                </form>
                <p id="return-msg" class="message"></p>
            </div>`;
    } 
    else if (moduleId === 'reports') {
        content.innerHTML = `
            <div class="card">
                <h3>System Reports</h3>
                <button onclick="loadReport('overdue')" style="width:auto; margin-right: 10px;">Overdue Books Report</button>
                <button onclick="loadReport('top-readers')" style="width:auto; background: #27ae60;">Top 5 Readers</button>
                <div id="reports-container" style="margin-top: 20px;">Select a report to view.</div>
            </div>`;
    }
}

// --- API Calls & Data Rendering ---
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        document.getElementById('dashboard-stats').innerHTML = `
            <div style="background: #ecf0f1; padding: 15px; border-radius: 5px;"><strong>Total Books:</strong> <br>${data.total_books}</div>
            <div style="background: #ecf0f1; padding: 15px; border-radius: 5px;"><strong>Total Students:</strong> <br>${data.total_students}</div>
            <div style="background: #ecf0f1; padding: 15px; border-radius: 5px;"><strong>Active Issues:</strong> <br>${data.issued_books}</div>
            <div style="background: #ecf0f1; padding: 15px; border-radius: 5px;"><strong>Fine Collected:</strong> <br>₹${data.collected_fine}</div>
        `;
    } catch (err) { console.error(err); }
}

async function loadBooks() {
    try {
        const res = await fetch(`${API_URL}/books`);
        const books = await res.json();
        let html = '<table border="1" width="100%" style="border-collapse: collapse; text-align: left;"><tr><th>ID</th><th>Book ID</th><th>Name</th><th>Author</th><th>Available / Total</th></tr>';
        books.forEach(b => { html += `<tr><td>${b.id}</td><td>${b.book_id}</td><td>${b.book_name}</td><td>${b.author_name}</td><td>${b.available_copies} / ${b.total_copies}</td></tr>`; });
        html += '</table>';
        document.getElementById('books-table-container').innerHTML = html;
    } catch (err) { console.error(err); }
}

async function handleAddBook(e) {
    e.preventDefault();
    const data = {
        book_id: document.getElementById('b_id').value,
        book_name: document.getElementById('b_name').value,
        author_name: document.getElementById('b_author').value,
        category: document.getElementById('b_cat').value,
        total_copies: document.getElementById('b_copies').value
    };
    await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    showModule('books'); // Refresh view
}

async function loadStudents() {
    try {
        const res = await fetch(`${API_URL}/students`);
        const students = await res.json();
        let html = '<table border="1" width="100%" style="border-collapse: collapse; text-align: left;"><tr><th>ID</th><th>Roll No</th><th>Name</th><th>Dept</th><th>Mobile</th></tr>';
        students.forEach(s => { html += `<tr><td>${s.id}</td><td>${s.roll_number}</td><td>${s.student_name}</td><td>${s.department}</td><td>${s.mobile}</td></tr>`; });
        html += '</table>';
        document.getElementById('students-table-container').innerHTML = html;
    } catch (err) { console.error(err); }
}

async function handleAddStudent(e) {
    e.preventDefault();
    const data = {
        roll_number: document.getElementById('s_roll').value,
        student_name: document.getElementById('s_name').value,
        department: document.getElementById('s_dept').value,
        mobile: document.getElementById('s_mob').value,
        email: document.getElementById('s_email').value
    };
    await fetch(`${API_URL}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    showModule('students'); // Refresh view
}

async function handleIssue(e) {
    e.preventDefault();
    const data = {
        student_id: document.getElementById('student_id').value,
        book_id: document.getElementById('book_id').value,
        issue_date: document.getElementById('issue_date').value
    };
    try {
        const res = await fetch(`${API_URL}/issue`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await res.json();
        const msgEl = document.getElementById('issue-msg');
        msgEl.innerText = result.message || result.error;
        msgEl.style.color = result.error ? 'red' : 'green';
    } catch (err) { console.error(err); }
}

async function handleReturn(e) {
    e.preventDefault();
    const data = {
        issue_id: document.getElementById('issue_id').value,
        return_date: document.getElementById('return_date').value
    };
    try {
        const res = await fetch(`${API_URL}/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await res.json();
        const msgEl = document.getElementById('return-msg');
        if (result.error) {
            msgEl.innerText = result.error; msgEl.style.color = 'red';
        } else {
            msgEl.innerText = `${result.message}! Days Delayed: ${result.days_delayed} | Fine: ₹${result.fine_calculated}`;
            msgEl.style.color = 'green';
        }
    } catch (err) { console.error(err); }
}

async function loadReport(type) {
    try {
        const res = await fetch(`${API_URL}/reports/${type}`);
        const data = await res.json();
        let html = '<table border="1" width="100%" style="border-collapse: collapse; text-align: left;">';
        
        if (type === 'overdue') {
            html += '<tr><th>Student Name</th><th>Book Name</th><th>Issue Date</th><th>Days Borrowed</th></tr>';
            data.forEach(row => { html += `<tr><td>${row.student_name}</td><td>${row.book_name}</td><td>${row.issue_date.split('T')[0]}</td><td style="color:red; font-weight:bold;">${row.days_borrowed}</td></tr>`; });
        } else if (type === 'top-readers') {
            html += '<tr><th>Student Name</th><th>Total Books Borrowed</th></tr>';
            data.forEach(row => { html += `<tr><td>${row.student_name}</td><td>${row.books_borrowed}</td></tr>`; });
        }
        html += '</table>';
        document.getElementById('reports-container').innerHTML = html;
    } catch (err) { console.error(err); }
}

// --- API Calls to Backend ---
async function handleIssue(e) {
    e.preventDefault();
    const data = {
        student_id: document.getElementById('student_id').value,
        book_id: document.getElementById('book_id').value,
        issue_date: document.getElementById('issue_date').value
    };
    
    try {
        const res = await fetch(`${API_URL}/issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        const msgEl = document.getElementById('issue-msg');
        msgEl.innerText = result.message || result.error;
        msgEl.style.color = result.error ? 'red' : 'green';
    } catch (err) {
        console.error("API Error:", err);
    }
}

async function handleReturn(e) {
    e.preventDefault();
    const data = {
        issue_id: document.getElementById('issue_id').value,
        return_date: document.getElementById('return_date').value
    };
    
    try {
        const res = await fetch(`${API_URL}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        const msgEl = document.getElementById('return-msg');
        
        if (result.error) {
            msgEl.innerText = result.error;
            msgEl.style.color = 'red';
        } else {
            msgEl.innerText = `${result.message}! Days Delayed: ${result.days_delayed} | Fine: ₹${result.fine_calculated}`;
            msgEl.style.color = 'green';
        }
    } catch (err) {
        console.error("API Error:", err);
    }
}