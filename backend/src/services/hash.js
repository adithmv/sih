const crypto = require('crypto');

function hashAadhaar(aadhaarNumber) {
  return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
}

module.exports = { hashAadhaar };