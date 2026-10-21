import express from 'express';

const router = express.Router();

function getPartnerUrl() {
  return process.env.PARTNER_URL?.replace(/\/+$/, '');
}

router.get('/candidates', async (req, res) => {
  const partnerUrl = getPartnerUrl();

  if (!partnerUrl) {
    return res.status(503).json({
      message: 'Voter Edu data is not configured.',
    });
  }

  try {
    const partnerResponse = await fetch(`${partnerUrl}/candidates`);

    if (!partnerResponse.ok) {
      console.error('Voter Edu returned status', partnerResponse.status);
      return res.status(502).json({
        message: 'Voter Edu data is temporarily unavailable.',
      });
    }

    const candidates = await partnerResponse.json();

    if (!Array.isArray(candidates)) {
      console.error('Voter Edu returned an unexpected candidates response');
      return res.status(502).json({
        message: 'Voter Edu data is temporarily unavailable.',
      });
    }

    res.json(
      candidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        party: candidate.party ?? null,
        average_rating: candidate.average_rating ?? null,
        review_count: candidate.review_count ?? 0,
      }))
    );
  } catch (error) {
    console.error(
      'Voter Edu request failed:',
      error.cause?.code || error.message
    );

    res.status(502).json({
      message: 'Voter Edu data is temporarily unavailable.',
    });
  }
});

router.get('/candidates/:candidateId/reviews', async (req, res) => {
  const partnerUrl = getPartnerUrl();

  if (!partnerUrl) {
    return res.status(503).json({
      message: 'Voter Edu data is not configured.',
    });
  }

  try {
    const candidateId = encodeURIComponent(req.params.candidateId);
    const partnerResponse = await fetch(
      `${partnerUrl}/candidates/${candidateId}/reviews`
    );

    if (!partnerResponse.ok) {
      console.error('Voter Edu returned status', partnerResponse.status);
      return res.status(502).json({
        message: 'Voter Edu reviews are temporarily unavailable.',
      });
    }

    const reviews = await partnerResponse.json();

    if (!Array.isArray(reviews)) {
      console.error('Voter Edu returned an unexpected reviews response');
      return res.status(502).json({
        message: 'Voter Edu reviews are temporarily unavailable.',
      });
    }

    res.json(reviews);
  } catch (error) {
    console.error(
      'Voter Edu request failed:',
      error.cause?.code || error.message
    );

    res.status(502).json({
      message: 'Voter Edu reviews are temporarily unavailable.',
    });
  }
});

export default router;