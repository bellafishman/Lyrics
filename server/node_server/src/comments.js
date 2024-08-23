const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const LyricCommentsModel = require('../models/LyricComments');


// add comment for specific user on a songid on a lyricid
const addComment = async (trackId, lyricId, userId, commentText) => {
    try {
        const newComment = new LyricCommentsModel({
            comments: commentText,
            userId,
            trackId,
            lyricId
        });

        await newComment.save();
        console.log('Comment saved successfully');
    } catch (error) {
        console.error('Error saving comment:', error);
    }
};


// Get Comments for a specific trackid and lyricid
const getComments = async (trackId, lyricId) => {
    try {
        const comments = await LyricCommentsModel.find({ trackId, lyricId });
        return comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
};

// Update a Comment
// AUTHENTICATE USERS FIRST
const updateComment = async (commentId, updatedFields) => {
    try {
        const result = await LyricCommentsModel.findByIdAndUpdate(commentId, updatedFields, { new: true });
        return result;
    } catch (error) {
        console.error('Error updating comment:', error);
        return null;
    }
};