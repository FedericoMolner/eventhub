/**
 * Funzioni di validazione comuni
 */

// Regex comuni
const REGEX = {
  // Email con supporto per sottodominii e caratteri speciali
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Password: minimo 8 caratteri, almeno una lettera maiuscola, una minuscola e un numero
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  
  // URL valido
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  
  // Solo lettere e spazi
  NAME: /^[a-zA-Z\s]{2,30}$/,
  
  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

/**
 * Validazione email
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return typeof email === 'string' && REGEX.EMAIL.test(email);
};

/**
 * Validazione password
 * @param {string} password 
 * @returns {object} { isValid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Password deve essere una stringa'] };
  }

  if (password.length < 8) {
    errors.push('Password deve essere di almeno 8 caratteri');
  }
  if (!password.match(/[A-Z]/)) {
    errors.push('Password deve contenere almeno una lettera maiuscola');
  }
  if (!password.match(/[a-z]/)) {
    errors.push('Password deve contenere almeno una lettera minuscola');
  }
  if (!password.match(/\d/)) {
    errors.push('Password deve contenere almeno un numero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validazione UUID
 * @param {string} uuid 
 * @returns {boolean}
 */
const isValidUUID = (uuid) => {
  return typeof uuid === 'string' && REGEX.UUID.test(uuid);
};

/**
 * Validazione nome (solo lettere e spazi, 2-30 caratteri)
 * @param {string} name 
 * @returns {boolean}
 */
const isValidName = (name) => {
  return typeof name === 'string' && REGEX.NAME.test(name);
};

/**
 * Validazione URL
 * @param {string} url 
 * @returns {boolean}
 */
const isValidURL = (url) => {
  return typeof url === 'string' && REGEX.URL.test(url);
};

/**
 * Validazione data
 * @param {string|Date} date 
 * @returns {boolean}
 */
const isValidDate = (date) => {
  if (date instanceof Date) {
    return !isNaN(date);
  }
  const d = new Date(date);
  return !isNaN(d);
};

/**
 * Verifica se una data è nel futuro
 * @param {string|Date} date 
 * @returns {boolean}
 */
const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  const d = new Date(date);
  return d > new Date();
};

/**
 * Verifica se una data è nel passato
 * @param {string|Date} date 
 * @returns {boolean}
 */
const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  const d = new Date(date);
  return d < new Date();
};

/**
 * Sanitizzazione input (rimuove caratteri speciali)
 * @param {string} input 
 * @returns {string}
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '');
};

/**
 * Validazione capacità evento
 * @param {number} capacity 
 * @returns {boolean}
 */
const isValidCapacity = (capacity) => {
  return Number.isInteger(capacity) && capacity > 0 && capacity <= 10000;
};

/**
 * Validazione prezzo
 * @param {number} price 
 * @returns {boolean}
 */
const isValidPrice = (price) => {
  return typeof price === 'number' && price >= 0 && price <= 1000000;
};

module.exports = {
  REGEX,
  isValidEmail,
  validatePassword,
  isValidUUID,
  isValidName,
  isValidURL,
  isValidDate,
  isFutureDate,
  isPastDate,
  sanitizeInput,
  isValidCapacity,
  isValidPrice
};