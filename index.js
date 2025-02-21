const express =require('express');
const expressHBS = require('express-handlebars');
const morgan = require('morgan');
const bodyParser= require('body-parser');
const session= require('express-session');
const router = require("./router/index.router");
const app = express();
app.use(morgan('dev'));
const port = 3000;


const hbs = expressHBS.create({
  extname:'hbs',
  defaultLayout:'main.hbs',
  layoutsDir:"views/layouts/",
  partialsDir:"views/partials/"
});
app.engine('hbs',hbs.engine);
app.set('view engine','hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/static",express.static(__dirname+ "/public"));
app.use("/statics",express.static(__dirname+ "/public/image"));

app.use(session({
  secret: 'alexbhusal',
  resave: false,
  saveUninitialized: false,
  // cookie: {
  //   maxAge: 20  * 1000 
  // }
}));

app.use(router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});
app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
});