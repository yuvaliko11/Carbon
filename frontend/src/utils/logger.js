// Logger utility - only logs in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Recursion guard to prevent infinite loops if console is patched
let isLogging = false;

export const logger = {
  log: (...args) => {
    if (isLogging) return;
    isLogging = true;
    try {
      if (isDevelopment) {
        console.log(...args);
      }
    } finally {
      isLogging = false;
    }
  },
  warn: (...args) => {
    if (isLogging) return;
    isLogging = true;
    try {
      if (isDevelopment) {
        console.warn(...args);
      }
    } finally {
      isLogging = false;
    }
  },
  error: (...args) => {
    if (isLogging) return;
    isLogging = true;
    try {
      // Always log errors, even in production
      console.error(...args);
    } finally {
      isLogging = false;
    }
  },
  debug: (...args) => {
    if (isLogging) return;
    isLogging = true;
    try {
      if (isDevelopment) {
        console.debug(...args);
      }
    } finally {
      isLogging = false;
    }
  },
};

export default logger;





