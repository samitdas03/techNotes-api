const Note = require("../models/Note");
const User = require("../models/User");
const Counter = require("../models/Counter");
const asyncHandler = require('express-async-handler');


// @desc get all notes
// @route GET /notes
// @access private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({}).lean();
    if(!notes || !notes.length) {
        return res.status(404).json({message: "notes not found"});
    }
    // get username
    const noteWithUsername = await Promise.all(notes.map(async (note) => {
        const userData = await User.findById(note.user).lean().exec();
        return {...note, username: userData.username};
    }));
    res.status(200).json(noteWithUsername);
});


// @desc create new note
// @route POST /notes
// @access private
const createNewNote = asyncHandler(async (req, res) => {
    const {user, title, text} = req.body;
    // confirm data
    if(!user || !title || !text) {
        return res.status(400).json({message: "all fields are required!"});
    }
    // check for duplicate
    const duplicateNote = await Note.findOne({title}).lean().exec();
    if(duplicateNote) {
        return res.status(409).json({message: "title already exists"});
    }
    // check for user
    const userObj = await User.findById(user).lean().exec();
    if(!userObj) {
        return res.status(400).json({message: "user not found"});
    }
    // create and shore new note
    let counter = await Counter.findOne({}).exec();
    if(!counter) {
        const counterObj = new Counter({count: 1});
        counter = await counterObj.save();
    }
    const noteObj = new Note({user, title, text, ticket: counter.count});
    const newNote = await noteObj.save();
    if(newNote) {
        counter.count++;
        await counter.save();
        res.status(200).json({message: `new note ${newNote.title} created by user ${newNote.user}`});
    } else {
        res.status(400).json({message: "invalid note data received"});
    }
});


// @desc update a note
// @route PATCH /notes
// @access private
const updateNote = asyncHandler(async (req, res) => {
    const {id, user, title, text, completed} = req.body;
    // confirm data
    if(!id || !user || !title || !text || typeof completed !== "boolean") {
        return res.status(400).json({message: "all fields are required!"});
    }
    const note = await Note.findById(id).exec();
    if(!note) {
        return res.status(404).json({message: "note not found"});
    }
    // check if user exists
    const userObj = await User.findById(user).lean().exec();
    if(!userObj) {
        return res.status(400).json({message: "user not found"});
    }
    // check for duplicate title
    const duplicateNote = await Note.findOne({title});
    if(duplicateNote && duplicateNote?._id.toString() !== id) {
        return res.status(409).json({message: "title already exists"});
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    // save note in db
    const updatedNote = await note.save();
    if(updatedNote) {
        res.status(200).json({message: `note ${updatedNote.title} updated`});
    } else {
        res.status(400).json({message: "invalid note data received"});
    }
});


// @desc delete a note
// @route DELETE /notes
// @access private
const deleteNote = asyncHandler(async (req, res) => {
    const {id} = req.body;
    if(!id) {
        return res.status(400).json({message: "note id required"});
    }
    // check if note exists
    const note = await Note.findById(id).exec();
    if(!note) {
        return res.status(404).json({message: "note not found"});
    }
    // delete note
    const result = await note.deleteOne();
    const reply = `note ${note.title} with id ${result._id} deleted`;
    res.status(200).json(reply);
});


module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote,
};
