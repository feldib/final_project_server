// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  charset: string;
}

export interface ServerConfig {
  port: number;
  clientHost: string;
}

export interface SecurityConfig {
  secretKey: string;
  sessionSecret: string;
  sessionMaxAge: number;
}

export interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

export interface Config {
  server: ServerConfig;
  security: SecurityConfig;
  database: DatabaseConfig;
  email: EmailConfig;
}
