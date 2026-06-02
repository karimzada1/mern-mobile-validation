require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const { parsePhoneNumber, getNumberType } = require('libphonenumber-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const VERIPHONE_API_KEY = process.env.VERIPHONE_API_KEY;

function getCountryName(isoCode) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(isoCode) || isoCode;
  } catch {
    return isoCode;
  }
}

const LINE_TYPE_LABELS = {
  MOBILE: 'Mobile',
  FIXED_LINE: 'Fixed Line',
  FIXED_LINE_OR_MOBILE: 'Fixed Line / Mobile',
  TOLL_FREE: 'Toll Free',
  PREMIUM_RATE: 'Premium Rate',
  SHARED_COST: 'Shared Cost',
  VOIP: 'VoIP',
  PERSONAL_NUMBER: 'Personal Number',
  PAGER: 'Pager',
  UAN: 'Universal Access Number',
  VOICEMAIL: 'Voicemail',
  UNKNOWN: 'Unknown',
};

// Call Veriphone API — returns parsed JSON or throws
function callVeriphoneAPI(phoneNumber) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(phoneNumber);
    const url = `https://api.veriphone.io/v2/verify?phone=${encoded}`;
    const options = {
      headers: { Authorization: `Bearer ${VERIPHONE_API_KEY}` },
    };
    https.get(url, options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Invalid JSON from Veriphone')); }
      });
    }).on('error', reject);
  });
}

// POST /validate  { mobile: "+14155552671" }
app.post('/validate', async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  // Step 1 — local pre-validation (fast, uses no API quota)
  let parsed;
  try {
    parsed = parsePhoneNumber(String(mobile));
  } catch {
    return res.status(200).json({ valid: false, error: 'Invalid number' });
  }

  if (!parsed || !parsed.isValid()) {
    return res.status(200).json({ valid: false, error: 'Invalid number' });
  }

  // Step 2 — enrich with Veriphone (real carrier name)
  if (VERIPHONE_API_KEY) {
    try {
      const data = await callVeriphoneAPI(parsed.number);

      if (!data.phone_valid) {
        return res.status(200).json({ valid: false, error: 'Invalid number' });
      }

      return res.json({
        valid: true,
        countryCode: `+${data.country_prefix || parsed.countryCallingCode}`,
        countryName: data.country || getCountryName(parsed.country),
        operatorName: data.carrier || LINE_TYPE_LABELS[getNumberType(parsed.number)] || 'Unknown',
      });
    } catch (err) {
      console.error('Veriphone API error:', err.message);
      // fall through to local fallback below
    }
  }

  // Fallback — fully local, no external call
  const numberType = getNumberType(parsed.number) || 'UNKNOWN';
  return res.json({
    valid: true,
    countryCode: `+${parsed.countryCallingCode}`,
    countryName: getCountryName(parsed.country),
    operatorName: LINE_TYPE_LABELS[numberType] || 'Unknown',
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'mobile-validation' }));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`Mobile validation service running on port ${PORT}`)
  );
}
