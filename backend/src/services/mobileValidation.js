const axios = require('axios');

const VALIDATION_SERVICE_URL =
  process.env.VALIDATION_SERVICE_URL || 'http://localhost:3001';

async function validateMobile(mobile) {
  const { data } = await axios.post(
    `${VALIDATION_SERVICE_URL}/validate`,
    { mobile },
    { timeout: 8000 }
  );
  return data; // { valid, countryCode, countryName, operatorName } | { valid: false, error }
}

module.exports = { validateMobile };
