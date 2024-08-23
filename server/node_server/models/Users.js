const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
    Id: {
        type: String,
        default: () => uuidv4(), // Generate a UUID for each user
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: String,
    spotify: {
        userId: {
            type: String, // Spotify User ID
            unique: true,
        },
        accesstoken: String,
        refreshtoken: String
    }
})

// create users schema with users schema
const UserModel = mongoose.model('users', UserSchema)
module.exports = UserModel