const mongoose = require('mongoose');

const LyricCommentsSchema = new mongoose.Schema({
    comments: {
        type: String,
        required: true, // Ensure that comments are not empty
    },
    userId: {
        type: String,
        required: true,
    },
    trackId: {
        type: String,
        required: true,
    },
    lyricId:{
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        default: 0, // Start likes at 0
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});


// create users schema with users schema
const LyricCommentsModel = mongoose.model('lyric-comments', LyricCommentsSchema)
module.exports = LyricCommentsModel