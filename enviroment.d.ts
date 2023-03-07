declare global {
  export namespace NodeJS {
    export interface ProcessEnv {
      SECRER_JWT: string;
      BASE_URL: string;
      BASE_WEB_URL: string;
      DB_URI: string;
      DB_NAME: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
