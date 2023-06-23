const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require('bcrypt');


// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}, {password: 0}).lean();
    if(!users?.length) {
        return res.status(400).json({message: "No users found"});
    }
    res.status(200).json(users);
});


// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;
    // confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: "All fields are required!"})
    }
    // check for duplicate username
    const duplicateUser = await User.findOne({username: username}).lean().exec();
    if(duplicateUser) {
        return res.status(409).json({message: "Username already exists"});
    }
    // hash password
    const hashPassword = await bcrypt.hash(password, 10); // salt rounds = 10
    // create user mongoose object
    const userObj = new User({username, password: hashPassword, roles});
    // save user in db
    const newUser = await userObj.save();
    if(newUser) {
        res.status(201).json({message: `New user ${username} created`});
    } else {
        res.status(400).json({message: `invalid user data`});
    }
});


// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const {id, username, password, roles, active} = req.body;
    console.log(username, roles, active);
    // confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== "boolean") {
        return res.status(400).json({message: "All fields are required"});
    }
    // fetch the user from db
    const user = await User.findById(id).exec();
    if(!user) {
        return res.status(400).json({message: "User does not exist"});
    }
    // check if username already being used
    const duplicate = await User.findOne({username}).lean().exec();
    if(duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: "username already exists"});
    }
    // update user
    user.username = username;
    user.roles = roles;
    user.active = active;
    if(password) {
        user.password = await bcrypt.hash(password, 10);
    }
    // send updated user to db
    const updatedUser = await user.save();
    res.status(200).json({message: `user ${updatedUser.username} updated`});
});


// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.body;
    // confirm data
    if(!id) {
        res.status(400).json({message: "User ID required"});
    }
    // check assigned notes
    const note = await Note.findOne({user: id}).lean().exec();
    if(note) {
        return res.status(400).json({message: "User has assigned notes"});
    }

    const user = await User.findById(id).exec();
    if(!user) {
        return res.status(404).json({message: "User not found"});
    }
    const result = await user.deleteOne();
    const reply = `Username ${result.username} with ID ${result._id} deleted`;
    res.status(200).json({reply});
});


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
};