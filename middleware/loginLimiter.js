const rateLimit = require('express-rate-limit');
const {logEvents} = require("./logger");

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: {message: "Too many login attempts from this IP, please try again after 60 seconds"},
    handler: (req, res, next, options) => {
        logEvents(`Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
        res.status(options.statusCode).json(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;