export default function handler(req: any, res: any) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        status: 'ok',
        source: 'minimal-handler',
        url: req.url,
        method: req.method,
        time: new Date().toISOString()
    });
}
