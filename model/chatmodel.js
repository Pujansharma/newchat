const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    conversationId: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userdata',
        required: true
    },
    message: [
        {
            user_input: { type: String, required: true },
            role: { type: String, required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

const chatmodel = mongoose.model('Chat', chatSchema);

module.exports = {chatmodel};
