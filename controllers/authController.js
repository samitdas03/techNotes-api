const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');


// @desc login
// @route POST /auth
// @access public
const login = asyncHandler(async (req, res) => {
    const {username, password} = req.body;
    if(!username || !password) {
        return res.status(400).json({message: "all fields are required!"});
    }
    const foundUser = await User.findOne({username}).exec();
    if(!foundUser) {
        return res.status(401).json({message: "user does not exist"});
    }
    if(!foundUser.active) {
        return res.status(401).json({message: "user is not active"});
    }
    const match = await bcrypt.compare(password, foundUser.password);
    if(!match) {
        return res.status(401).json({message: "incorrect password"});
    }

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "roles": foundUser.roles,
            },
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "1h"},
    );
    const refreshToken = jwt.sign(
        {
            "username": foundUser.username,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"},
    );

    // creating secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
        httpOnly: true,                    // accessible only by web server
        secure: true,                      // https
        sameSite: "None",                  // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000,   // cookie-expiry
    });

    res.json({accessToken});
});


// @desc refresh
// @route GET /auth/refresh
// @access public - because access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) {
        return res.status(401).json({message: "unauthorized"});
    }
    const refreshToken = cookies.jwt;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, asyncHandler(async (err, decoded) => {
        if(err) {
            return res.status(403).json({message: "forbidden"});
        }
        const foundUser = await User.findOne({username: decoded.username}).exec();
        if(!foundUser) {
            return res.status(401).json({message: "unauthorized"});
        }

        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    username: foundUser.username,
                    roles: foundUser.roles,
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "1h"},
        );
        res.json({accessToken});
    }));
};

// @desc logout
// @route POST /auth/logout
// @access public - just to clear cookie if exists
const logout = asyncHandler(async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) {
        return res.sendStatus(204);  // no content
    }
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    });
    res.json({message: "cookie cleared"});
});


module.exports = {
    login,
    refresh,
    logout,
};

