import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "../config.js";

export const verifyPaswordToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { token } = req.body;
  if (!token) {
    res.end("You are not authenticated");
  } else {
    jwt.verify(
      token,
      config.security.secretKey,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          console.log(err);
          res.status(401).end("Tokens do not match");
        } else {
          next();
        }
      }
    );
  }
};

export const verifyUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(req.session.userid);
  if (!req.session.userid) {
    res.status(401).end("You are not authenticated");
  } else {
    req.id = req.session.userid;
    next();
  }
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.isadmin) {
    res.status(401).end("You are not authenticated");
  } else {
    req.isadmin = req.session.isadmin;
    next();
  }
};
