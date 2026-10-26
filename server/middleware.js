import crypto from 'crypto';
import  error from 'console';
export function checkApiKey(req, res, next) {
    
    // api present?
    const key = req.header('am-api-key');
    if (!key) return res.status(401).json({error: 'API Key not found'});

    // api matches?
    const matches = process.env.API_KEY.split(',').some((k) => {
        const a = Buffer.from(k);
        const b = Buffer.from(key);
        return a.length == b.length && crypto.timingSafeEqual(a, b)
    });

    if (!matches) return res.status(401).json({error: 'API Key does not match'});

    req.apiKey = key;
    next();
} 
