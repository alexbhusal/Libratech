const express =require('express');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const session= require('express-session');
const mysql = require('mysql');
const app = express();
app.use(morgan('dev'));

const nodemailer= require('nodemailer');
const router = express.Router();
const connection = mysql.createConnection({
  // host: 'localhost',
  // user: 'root',  
  // password: '',  
  // database: 'LMS'
  host: 'b6bvos2hghgvsnlrqmer-mysql.services.clever-cloud.com',
  user: 'use3disj1hdqiecj',  
  password: 'tpnX5TaRsZAaO8INtlgg',  
  database: 'b6bvos2hghgvsnlrqmer'
});
connection.connect((error) => {
  if (!error) {
    console.log('Connected to database');
    return;
  }else{
    console.error('Error connecting to database: ', error);
  }  
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nepathyalibrary@gmail.com',
    pass: 'gsnrtveeyhioeaep'
  }
});


                    // Middleware For isAdmin & isUser
const isUser = (req, res, next) => {
  if (req.session.username) {
      next();
  } else {
      res.redirect('/login');
  }
};
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
      next();
  } else {
      res.redirect('/admin');
  }
};

//admin Username & Password
// const username= 'alex';
// const simplepassword = 'bhusal';
// bcrypt.hash(simplepassword, 10, (error, hashedPassword) => {
//   const insertUserQuery = 'INSERT INTO admin (username, password) VALUES (?, ?)';
//   const values = [username, hashedPassword];

//   connection.query(insertUserQuery, values, (error, results, fields) => {
//     if (!error) {
//     console.log('Admin registered successfully');
//       return;
//     }else{
//       console.error('Error inserting admin into the database: ', error);
//     }
//   });
// });
                    



                    //******** routes ********//
router.get('/',(req,res,next)=>{
  res.render('homepage/home',{class:'home'});
});
router.get('/admin',(req,res,next)=>{
  const errorMessage = req.query.error;
  res.render('admin/admin',{ errorMessage,class:'admin'});
});
router.get('/register',(req,res,next)=>{
  const errorMessage = req.query.error;
  res.render('users/user_create',{class:'register',errorMessage});
});
router.get('/login', (req, res) => {
  const errorMessage = req.query.error;
  res.render('users/user_login', { class:'login',errorMessage });
});
router.get('/addbook',isAdmin,(req,res,next)=>{
  const errorMessage = req.query.error;
  res.render('books/addbook',{class:'addbook',errorMessage});
});
router.get('/userlogout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/login');
    });
});
router.get('/deleteuser/:user_id',isAdmin, (req, res) => {
  const user_id = req.params.user_id;
  connection.query('DELETE FROM users WHERE user_id = ?', [user_id], (err) => {
    if (err) throw err;
    res.redirect('/manageuser');
    });
});
router.get('/deletebook/:book_id',isAdmin, (req, res) => {
  const book_id = req.params.book_id;
  connection.query('DELETE FROM books WHERE book_id = ?', [book_id], (err) => {
    if (err) throw err;
    res.redirect('/managebook');
  });
});
router.get('/updateuser/:user_id', isAdmin, (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT * FROM users WHERE user_id = ?';
  connection.query(query, [userId], (err, result) => {
    if (err) throw err;
    const user = result[0];
    res.render('users/updateuser', { user ,class:'update-user'});
  });
});
router.get('/updatebook/:book_id', isAdmin, (req, res) => {
  const book_id = req.params.book_id;
  const query = 'SELECT * FROM books WHERE book_id = ?';
  connection.query(query, [book_id], (err, result) => {
    if (err) throw err;
    const books = result[0];
    res.render('books/updatebook', { books,class:'updatebook' });
  });
});
router.get('/confirm/:book_id', isUser, (req, res, next) => {
  const username = req.session.username;
  const book_id = req.params.book_id;
  const bookQuery = 'SELECT * FROM books WHERE book_id = ?';
  const userQuery = 'SELECT * FROM users WHERE username = ?';
  const borrowedBooksQuery = 'SELECT * FROM record WHERE username = ? AND book_id = ?';

  connection.query(borrowedBooksQuery, [username, book_id], (err, borrowedBooksResult) => {
    if (err) throw err;
    if (borrowedBooksResult.length > 0) {
     res.render('books/alreadyborrowed');
    } else {
      connection.query(bookQuery, [book_id], (err, bookResult) => {
        if (err) throw err;
        const books = bookResult[0];

        connection.query(userQuery, [username], (err, userResult) => {
          if (err) throw err;
          const users = userResult[0];
          
          res.render('books/confirm', { books, users, class:'confirm'});
        });
      });
    }
  });
});
router.get('/user-dashboard', isUser, (req, res) => {
  const username = req.session.username;
  const sql = 'SELECT * FROM users WHERE username = ?';
  const sql1 = 'SELECT COUNT(*) AS totalbooks FROM books';
  const sql2 = 'SELECT COUNT(*) AS records FROM record WHERE username = ?';

  connection.query(sql, [username], (err, results) => {
    if (err) throw err;

    connection.query(sql1, (err, countTotalBooks) => {
      if (err) throw err;

      connection.query(sql2, [username], (err, countRecords) => {
        if (err) throw err;
        
        const totalBooks = countTotalBooks[0].totalbooks;
        const records = countRecords[0].records;

        res.render('users/user-dashboard', { totalBooks, records, user: results, class: 'user-dashboard' });
      });
    });
  });
});

router.get('/admin-dashboard', isAdmin, (req, res) => {
  const sql = 'SELECT COUNT(*) AS totalbooks FROM books';
  const sql1 = 'SELECT COUNT(*) AS totalusers FROM users';
  const sql2 = 'SELECT COUNT(*) AS records FROM record';
  const sql3 = `SELECT COUNT(*) AS rb FROM books WHERE category='reference_book'`;
  const sql4 = `SELECT COUNT(*) AS tb FROM books WHERE category='textbook'`;
  const sql5 = `SELECT COUNT(*) AS fc FROM books WHERE category='fiction'`;
  const sql6 = `SELECT COUNT(*) AS nf FROM books WHERE category='non_fiction'`;
  const sql7 = `SELECT COUNT(*) AS st FROM books WHERE category='science_and_technology'`;
  const sql8 = `SELECT COUNT(*) AS pj FROM books WHERE category='periosicals_and_journals'`;

  connection.query(sql, (err, countTotalBooks) => {
    if (err) throw err;

    connection.query(sql1, (err, countTotalUsers) => {
      if (err) throw err;

      connection.query(sql2, (err, countRecords) => {
        if (err) throw err;
        
        connection.query(sql3, (err, countRB) => {
          if (err) throw err;
          connection.query(sql4, (err, countTB) => {
            if (err) throw err;
            connection.query(sql5, (err, countFC) => {
              if (err) throw err;
              connection.query(sql6, (err, countNF) => {
                if (err) throw err;
                connection.query(sql7, (err, countST) => {
                  if (err) throw err;
                  connection.query(sql8, (err, countPJ) => {
                    if (err) throw err;
          
        
          const totalBooks = countTotalBooks[0].totalbooks;
          const totalUsers = countTotalUsers[0].totalusers;
          const records = countRecords[0].records;
          const rb = countRB[0].rb;
          const tb = countTB[0].tb;
          const fc = countFC[0].fc;
          const nf = countNF[0].nf;
          const st = countST[0].st;
          const pj = countPJ[0].pj;
          
          res.render('admin/admin-dashboard', { totalBooks, totalUsers, records,rb,tb,fc,nf,st,pj, class: 'admin-dashboard' });
        });
      });
    });
  });
});
});
});
});
});
});

router.get('/manageuser', isAdmin, (req, res) => {
const sql = 'SELECT * FROM users';
connection.query(sql,(err, results)=>{
  if(err) throw err;
  res.render('users/manageuser', { user: results,class:'manageuser'});
});
});
router.get('/adminlogout', (req, res) => {
req.session.destroy((err) => {
  if (err) throw err;
  res.redirect('/admin');
});
});
router.get('/managebook',isAdmin,(req, res) => {
  const sql = 'SELECT * FROM books';
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/managebook', { book: results, class:'managebook'});

  });
});
router.get('/foruser',isUser,(req, res) => {
  const sql = 'SELECT * FROM books';
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results,class:'foruser' });

  });
});
router.get('/record',isAdmin,(req, res) => {
  const sql = 'SELECT * FROM record';
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('admin/record', { record: results , class:'record' });
  });
});
router.get('/category',isUser,(req,res)=>{
  res.render('books/category',{class:'category'})
});
router.get('/category/reference_book',isUser,(req,res,next)=>{
  const sql = `SELECT * FROM books where category='reference_book' `;
connection.query(sql,(err, results)=>{
  if(err) throw err;
  res.render('books/foruser', { book: results, class:'managebook'});
});
});
router.get('/category/textbook',isUser,(req,res)=>{
  const sql = `SELECT * FROM books where category='textbook' `;
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results, class:'managebook'});
  });
});
router.get('/category/fiction',isUser,(req,res)=>{
  const sql = `SELECT * FROM books where category='fiction' `;
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results, class:'managebook'});
  });
});
router.get('/category/non_fiction',isUser,(req,res)=>{
  const sql = `SELECT * FROM books where category='non_fiction' `;
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results, class:'managebook'});
  });
});
router.get('/category/science_and_technology',isUser,(req,res)=>{
  const sql = `SELECT * FROM books where category='science_and_technology' `;
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results, class:'managebook'});
  });
});
router.get('/category/periosicals_and_journals',isUser,(req,res)=>{
  const sql = `SELECT * FROM books where category='periosicals_and_journals' `;
  connection.query(sql,(err, results)=>{
    if(err) throw err;
    res.render('books/foruser', { book: results, class:'managebook'});
  });
});
router.get('/issued_book',isUser,(req,res)=>{
  const username = req.session.username;
  const issuedBooksQuery = 'SELECT * FROM record WHERE username = ?';
  connection.query(issuedBooksQuery, [username], (err, issuedBooks) => {
    if (err) throw err;
    res.render('users/issued_book', { user: req.session, issuedBooks, class: 'record' });
  });
});

//post routes
router.post("/register", async (req, res, next) => {
  const { username, name, email, phone, faculty, batch, password,confirmpassword } = req.body;
  
    if (!username.match(/^[a-z][a-z0-9._-]{0,}$/)) {
       console.log('Username must be in lowercase');
    }
    else if (!name.match(/^([A-Za-z]{1,20})\s*([A-Za-z]{0,20})\s*([A-Za-z]{1,20})?$/)) {
       console.log('Please provide valid name');
    }
    else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
       console.log('Invalid Email!');
    }
    else if (!phone.match(/^(90|91|97|98)\d{8}$/)) {
       console.log('Phone nubmer must be cointain 10 digit & strat with 90/91/97/98 ');
    }
    else if (!(faculty === 'bca' || faculty === 'bsc. csit')) {
       console.log('Please Choose your faculty!');
    }
    else if (!(batch === '2075' || batch === '2076'||batch === '2077' || batch === '2078'||batch === '2079' || batch === '2080')) {
       console.log('Please Choose your batch!');
    }
    else if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/)) {
       console.log('Password must be contain 1 uppercase,1 special character with atleast 8 digit');
    }
    else if(password!== confirmpassword){
       console.log("password not matched");
    }
  else{
  const hpass = await bcrypt.hash(password, 10);

  const checkUsernameQuery = 'SELECT * FROM `users` WHERE `username` = ?';
  connection.query(checkUsernameQuery, [username], (checkError, checkResults) => {
    if (!checkError) {
      if (checkResults.length > 0) {
        console.error('Username already exists');
        res.redirect('/register?error=Username already taken!!!!')
      } else {
        const insertQuery = 'INSERT INTO `users`(`username`, `name`, `email`, `phone`, `faculty`, `batch`, `password`) VALUES (?,?,?,?,?,?,?)';
        const insertValues = [username, name, email, phone, faculty, batch, hpass];

        connection.query(insertQuery, insertValues, (error, results, fields) => {
          if (!error) {
            console.log("User created");
            // Send welcome email
            const mailOptions = {
              from: "Libratech",
              to: email,
              subject: `${name} Welcome To Libratech`,
              html:
              `<h1>Empowering Access, Inspiring Minds: Seamlessly Connect to Knowledge with Our Digital Library Management System!</h1>`
            };
            transporter.sendMail(mailOptions, (sendMailError, info) => {
              if (sendMailError) {
                console.error('Error sending welcome email: ', sendMailError);
              } else {
                console.log('Welcome email sent: ', info.response);
              }
            });
            // res.redirect('http://libratech.com:3000');
            res.redirect('/login');
          } else {
            console.error('Error inserting user into the database: ', error);
            res.status(500).send('Internal Server Error');
          }
        });
      }
    } else {
      console.error('Error checking username in the database: ', checkError);
      res.status(500).send('Internal Server Error');
    }
  });
}
});
router.post("/addbook", (req, res, next) => {
  const { book_id, title, category, author, publisher, edition, stock } = req.body;
   if (!book_id.match(/^(?:[0-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9])$/)) {
    console.log('Book ID must be a number');
    res.redirect('/addbook?error= book id must be a number!!!');

}
else if(stock<0){
  console.log("stock must be a positive number");
  res.redirect('/addbook?error= stock must be positive !!!');

}
else{
  const checkbook_idQuery = 'SELECT * FROM `books` WHERE `book_id` = ?';
  connection.query(checkbook_idQuery, [book_id], (checkError, checkResults) => {
    if (!checkError) {
      if (checkResults.length > 0) {
        console.error('Book ID already exists');
        res.redirect('/addbook?error= BOOK ID already used !!!');

        
      } else {
        const query = 'INSERT INTO `books`(`book_id`, `title`, `category`, `author`, `publisher`, `edition`, `stock`) VALUES (?,?,?,?,?,?,?)';
        const values = [book_id, title, category, author, publisher, edition, stock];

        connection.query(query, values, (error, results, fields) => {
          if (!error) {
            res.redirect('/managebook');
          } else {
            console.error('Error adding book into the database: ', error);
            res.status(500).send('Internal Server Error');
          }
        });
      }
    } else {
      console.error('Error checking book ID in the database: ', checkError);
      res.status(500).send('book id error');
    }
  });
}
});
router.post('/confirm', (req, res) => {
  const { user_id, name, book_id, title } = req.body;
  const username = req.session.username;
  const emailQuery = 'SELECT email FROM users WHERE username = ?'; // Parameterized query
  const selectStockQuery = 'SELECT `stock` FROM `books` WHERE `book_id` = ?';
  const updateStockQuery = 'UPDATE `books` SET `stock` = `stock` - 1 WHERE `book_id` = ?';
  const insertRecordQuery = 'INSERT INTO `record`(`user_id`, `name`, `username`, `book_id`, `title`, `date`) VALUES (?, ?, ?, ?, ?, NOW())';
  const selectStockValues = [book_id];
  const insertRecordValues = [user_id, name, username, book_id, title];

  connection.query(emailQuery, [username], (emailQueryError, emailResults) => {
    if (emailQueryError) {
      console.error('Error fetching email', emailQueryError);
      res.sendStatus(500);
      return;
    }
    const email = emailResults[0].email; // Assuming username is unique

    connection.query(selectStockQuery, selectStockValues, (stockQueryError, stockResults) => {
      if (stockQueryError) {
        console.error('Error fetching stock', stockQueryError);
        res.sendStatus(500);
        return;
      }
      if (stockResults.length === 0 || stockResults[0].stock === 0) {
        console.error('Book not available');
        res.status(400).send('Book not available');
        return;
      }
      
      connection.query(updateStockQuery, selectStockValues, (updateError) => {
        if (updateError) {
          console.error('Error updating stock', updateError);
          res.sendStatus(500);
          return;
        }
        
        connection.query(insertRecordQuery, insertRecordValues, (insertError) => {
          if (insertError) {
            console.error('Error inserting record', insertError);
            res.sendStatus(500);
            return;
          }
          
          const issueBook = {
            from: 'Libratech',
            to: email,
            subject: 'Book Issued',
            text: `${name} you have issued ${title} with bookID ${book_id} for 7 Days`
          };

          transporter.sendMail(issueBook, (sendMailError, info) => {
            if (sendMailError) {
              console.error('Error sending email: ', sendMailError);
            } else {
              console.log('Book issued Email sent: ', info.response);
            }
          });

          res.redirect('/issued_book');
        });
      });
    });
  });
});
router.post('/updateuser/:user_id', isAdmin, (req, res) => {
  const userId = req.params.user_id;
  const { username, name, email, phone, faculty, batch } = req.body;
  const query = 'UPDATE users SET username = ?, name = ?, email = ?, phone = ?, faculty = ?, batch = ? WHERE user_id = ?';

  connection.query(query, [username, name, email, phone, faculty, batch, userId], (error, result) => {
    if (!error){
      console.log(`User with ID ${userId} updated`);
      res.redirect('/manageuser');
    }
    else{
      console.log("error");
    }
  });
});
router.post('/updatebook/:book_id', isAdmin, (req, res) => {
  const book_id = req.params.book_id;
  const {  title, author, publisher, edition, stock } = req.body;
  const query = 'UPDATE books SET  title = ?, author = ?, publisher = ?, edition = ?, stock = ? WHERE book_id = ?';

  connection.query(query, [ title, author, publisher, edition, stock, book_id], (err, result) => {
    if (!err){
    console.log(`book with book_id ${book_id} updated`);
    res.redirect('/managebook');
    }
    else{
      console.log("error");
    }
  });
});
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  connection.query(sql, [username], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
          bcrypt.compare(password, results[0].password, (err, match) => {
              if (match) {
                const { email,name} = results[0];
                  req.session.username = username;
                  req.session.isAdmin = false;
                  const usermail={
                    from: 'Libratech',
                    to:email,
                    subject: `${name} welcome back `,
                    text:'You have successfully logged in! Welcome back to libratech. Explore our latest features and updates to make the most out of your experience. If you have any questions or need assistance, feel free to contact our support team.  '
                  };
                  transporter.sendMail(usermail, (sendMailError, info) => {
                    if (sendMailError) {
                      console.error('Error sending welcome email: ', sendMailError);
                    } else {
                      console.log('user logged in alert mail: ', info.response);
                    }
                  });
                  res.redirect('/user-dashboard');
              } else {
                  res.redirect('/login?error= invalid username or password!!!');
              }
          });
      } else {
          res.redirect('/login?error=invalid username or password!!!');
      }
  });
});
router.post('/admin', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM admin WHERE username = ?';
    connection.query(sql, [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (err, match) => {
                if (match) {
                    req.session.username = username;
                    req.session.isAdmin = true;
                    const adminlogged = {
                      from: 'Libratech',
                      to:'bhvnbhsl@gmail.com',
                      subject: `Admin login alert`,
                      text:'You have successfully logged in! Welcome back Admin '
                    };
                    transporter.sendMail(adminlogged, (sendMailError, info) => {
                      if (sendMailError) {
                        console.error('Error sending welcome email: ', sendMailError);
                      } else {
                        console.log('Admin logged in alert mail: ', info.response);
                      }
                    });
                    res.redirect('/admin-dashboard');

                } else {
                    res.redirect('/admin?error=invalid username or password!!!');
                }
            });
        } else {
            res.redirect('/admin?error=invalid username or password!!!');
        }
    });
});
router.post('/search_user', (req, res) => {
  const searchUser = req.body.searchUser;
  const sql = "SELECT * FROM users WHERE username LIKE ?";
  const query = connection.query(sql, [`%${searchUser}%`], (err, results) => {
    if (err) throw err;
    res.render('users/manageuser',{ results, searchUser,class:"manageuser" });
  });
});
router.post('/search_book_admin', (req, res) => {
  const searchBook = req.body.searchBook;
  const sql = "SELECT * FROM books WHERE title LIKE ?";
  const query = connection.query(sql, [`%${searchBook}%`], (err, results) => {
    if (err) throw err;
    res.render('books/managebook', {results, searchBook,class:"managebook" });
  });
});
router.post('/search_book_user', (req, res) => {
  const searchBook = req.body.searchBook;
  const sql = "SELECT * FROM books WHERE title LIKE ?";
  const query = connection.query(sql, [`%${searchBook}%`], (err, results) => {
    if (err) throw err;
    res.render('books/foruser', {results, searchBook, class:"manageuser"});
  });
});
router.get('*',(req,res)=>{
  res.render('error/error404',{class:'error'})
});



module.exports = router;