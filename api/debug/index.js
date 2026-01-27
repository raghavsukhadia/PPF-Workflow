export default function handler(req, res) {
    const fs = require('fs');
    const path = require('path');

    try {
        const cwd = process.cwd();
        const files = fs.readdirSync(cwd);

        // Check for dist/public existence
        let publicFiles = [];
        try {
            const publicPath = path.join(cwd, 'dist', 'public');
            if (fs.existsSync(publicPath)) {
                publicFiles = fs.readdirSync(publicPath);
            } else {
                publicFiles = ["dist/public not found"];
            }
        } catch (e) {
            publicFiles = [e.message];
        }

        res.status(200).json({
            status: 'ok',
            source: 'api/debug-standalone.js',
            env: {
                NODE_ENV: process.env.NODE_ENV,
                VERCEL: process.env.VERCEL,
                VERCEL_ENV: process.env.VERCEL_ENV
            },
            filesystem: {
                cwd: cwd,
                files: files,
                publicFiles: publicFiles
            },
            request: {
                url: req.url,
                headers: req.headers
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
