import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyPaswordToken = (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    res.end("You are not authenticated");
  } else {
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log(err);
        res.status(401).end("Tokens do not match");
      } else {
        next();
      }
    });
  }
};

export const verifyUser = (req, res, next) => {
  console.log(req.session.userid);
  if (!req.session.userid) {
    res.status(401).end("You are not authenticated");
  } else {
    req.id = req.session.userid;
    next();
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.session.isadmin) {
    res.status(401).end("You are not authenticated");
  } else {
    req.isadmin = req.session.isadmin;
    next();
  }
};
