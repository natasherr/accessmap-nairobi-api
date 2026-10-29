import express from 'express';

const router = express.Router();

async function proxyPartnerGet(path, res) {
  const partnerUrl = process.env.PARTNER_URL?.replace(/\/+$/, '');
  const partnerApiKey = process.env.PARTNER_API_KEY;

  if (!partnerUrl || !partnerApiKey) {
    return res.status(503).json({
      message: 'Voter Edu API is not configured.',
    });
  }

  try {
    const partnerResponse = await fetch(`${partnerUrl}${path}`, {
      headers: {
        'X-API-Key': partnerApiKey,
        Accept: 'application/json',
      },
    });

    if (!partnerResponse.ok) {
      console.error('Voter Edu returned status', partnerResponse.status);
      return res.status(502).json({
        message: 'Voter Edu data is temporarily unavailable.',
      });
    }

    const data = await partnerResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(
      'Voter Edu request failed:',
      error.cause?.code || error.message
    );

    return res.status(502).json({
      message: 'Voter Edu data is temporarily unavailable.',
    });
  }
}

router.get('/rallies', (req, res) =>
  proxyPartnerGet('/rallies', res)
);

router.get('/candidates', (req, res) =>
  proxyPartnerGet('/candidates', res)
);

router.get('/transport/landmarks', (req, res) =>
  proxyPartnerGet('/transport/landmarks', res)
);

export default router;