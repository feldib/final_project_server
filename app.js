import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import { join, dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import sessions from 'express-session'

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import apiRouter from './routes/api.js';


var app = express();

app.use(
  sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: parseInt(process.env.SESSION_MAX_AGE) },
    resave: false 
  })
)

app.use(cors({
  origin: ['http://localhost:3001'],
  methods: ["POST", "GET"],
  credentials: true

}))
app.use(cookieParser())
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
