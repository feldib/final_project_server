import { NextFunction,Request, Response } from "express";
import jwt from "jsonwebtoken";

import config from "../config.js";
import { HTTP } from "../utils/constants.js";

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
      (err: jwt.VerifyErrors | null, _: unknown) => {
        if (err) {
          console.log(err);
          res.status(HTTP.UNAUTHORIZED).end("Tokens do not match");
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
    res.status(HTTP.UNAUTHORIZED).end("You are not authenticated");
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
    res.status(HTTP.UNAUTHORIZED).end("You are not authenticated");
  } else {
    req.isadmin = req.session.isadmin;
    next();
  }
};
