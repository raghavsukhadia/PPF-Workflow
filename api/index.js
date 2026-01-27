export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        source: 'api/index.js (minimal)',
        time: new Date().toISOString(),
        url: req.url
    });
}
