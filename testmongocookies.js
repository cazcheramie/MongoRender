const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require("mongodb");
const uuid = require('uuid');

const app = express();
const port = 3000;

// The uri string must be the connection string for the database (obtained on Atlas).
const uri = "mongodb+srv://cazcheramie:t2Slzc7vTtndYCeO@cluster0.hsyzyes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

app.use(express.urlencoded({ extended: true })); // Add this line to parse incoming request bodies
app.use(cookieParser()); //needed for cookies

// --- This is the standard stuff to get it to work on the browser

app.listen(port);
console.log('Server started at http://localhost:' + port);

app.get('/', function(req, res) {
    res.send(`
    <html>
    <body>
        <center><h1>Login or Register</h1></center>
        <form action="/login" method="post">
            <h2>Login</h2>
            <label for="username">Username</label>
            <input id="username" type="text" placeholder="Username" name="username" required>
            <br>
            <label for="password">Password</label>
            <input id="password" type="password" placeholder="Password" name="password" required>
            <br>
            <button type="submit">Login</button>
        </form>
        <br>
        <form action="/register" method="post">
            <h2>Register</h2>
            <label>Username</label>
            <input type="text" placeholder="Username" name="newUsername" required>
            <br>
            <label>Password</label>
            <input type="password" placeholder="Password" name="newPassword" required>
            <br>
            <button type="submit">Register</button>
        </form>
    </body>
    </html>
    `);
});

//login 
app.post('/login', async (req, res) => {
    const { username, password } = req.body; // Retrieve username and password from req.body

    // Connect to MongoDB
    const usersCollection = client.db("MyDBexample").collection("Users");
    const user = await usersCollection.findOne({ username, password });

    if (user) {
        // Generate authentication cookie
        const authCookie = uuid.v4();
        
        // Set expiration time for the cookie (1 minute)
        const maxAge = 60000;
        
        // Set cookie
        res.cookie('authCookie', authCookie, { httpOnly: true, maxAge: maxAge });

        res.send(`
            <html>
            <body>
                <h1>Login Successful</h1>
                <p>Authentication cookie has been set: ${authCookie}.</p>
                <p>View all active cookies <a href="/active-cookies">here</a>.</p>
            </body>
            </html>
        `);
    } else {
        // User not found or invalid credentials
        res.send(`
        <html>
        <body>
            <p>Invalid username or password. <a href="/">Try again</a>.</p>
        </body>
        </html>
        `);
    }
});

app.post('/register', async(req, res) => {
    const{newUsername, newPassword} = req.body;

    const usersCollection = client.db("MyDBexample").collection("Users");

    const existingUser = await usersCollection.findOne({username: newUsername});

    if (existingUser){

        res.send(`
        <html>
            <body>
                <p>Username already exists. <a href="/">Try again</a>.</p>
            </body>
            </html>
        `);
    } else {

        await usersCollection.insertOne({username: newUsername, password: newPassword});
        res.send(`
            <html>
            <body>
                <h1>Registration Successful</h1>
                <p>You can now <a href="/">login</a>.</p>
            </body>
            </html>
        `);
    }
});

app.get('/active-cookies', (req, res) => {
    const cookies = req.cookies;

    const cookieList = Object.entries(cookies).map(([name, value]) =>`${name}: ${value}`)
    .join('<br>');

    res.send(`
    <html>
        <body>
            <h1>Active Cookies</h1>
            ${cookieList ? cookieList : '<p>No active cookies found.</p>'}
            <br>
            <a href="/return-to-login">Back to Login Page</a>
            <br>
            <a href="/clear-cookies">Clear Active Cookies</a>
        </body>
    </html>
    `);
});

app.get('/clear-cookies', (req, res) => {
    res.clearCookie('authCookie');
    res.send(`
    <html>
        <body>
            <h1>Cookies Cleared</h1>
            <p>All active cookies have been cleared.</p>
            <p>Returning to <a href="/">login page</a>.</p>
        </body>
    </html>
    `);
});

app.get('/return-to-login', (req, res) => {
    res.redirect('/');
});