import { Session, SessionData } from "express-session";
declare global {
  namespace Express {
    interface Request {
      id?: number;
      isadmin?: boolean;
      session: Session & Partial<SessionData>;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userid?: number;
    isadmin?: boolean;
  }
}
