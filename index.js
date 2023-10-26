const express = require('express');
const session = require('express-session');
// const   {Configuration}=require('openai');
const OpenAI = require('openai');
const axios = require('axios');
const bcrypt=require("bcrypt")
const cors = require('cors');
const { connection } = require('./connection');
const { chatmodel } = require('./model/chatmodel');
const {userdata}=require("./model/user.model")
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
app.use(express.json());
app.use(cors());
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const jwt = require("jsonwebtoken");
const { Auth } = require("./middleware/Auth")
  const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });
  app.use(
    session({
        secret: 'masaischool', // Replace with a strong, random secret
        resave: false,
        saveUninitialized: true,
    })
);

//   const openai = new OpenAI({ apiKey: OPENAI_API_KEY });



app.post('/ask',Auth ,async (req, res) => {
    try {
        const { user_input } = req.body;
        const user = req.userId;

        const chatHistory = req.session.chatHistory || [];
        chatHistory.push({ role: 'user', content: user_input });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: chatHistory,
    }),
});

const responseJson = await response.json();

        if (responseJson.choices && responseJson.choices.length > 0) {
            const completionText = responseJson.choices[0].message.content;
            chatHistory.push({ role: 'assistant', content: completionText });
            req.session.chatHistory = chatHistory;
    
            const chatData = {
                conversationId: responseJson.id,
                user: user, // Associate the chat message with the currently logged-in user
                message: [
                    {
                        user_input: user_input,
                        role: responseJson.choices[0].message.role,
                        content: responseJson.choices[0].message.content,
                        timestamp: new Date()
                    }
                ]
            };

            // Save the chat data
            const chat = new chatmodel(chatData);
            await chat.save();
    res.status(200).json({ code: completionText });
    // console.log(chatHistory)
} else {
    // Handle API errors
    console.error('API response:', responseJson);
    res.status(500).json({ msg: 'API response is not valid' });
}
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
});


app.get('/getChat/:id', Auth, async (req, res) => {
    const chatId = req.params.id;
    try {
        const data = await chatmodel.findOne({ _id: chatId }); // Use _id
        if (data) {
            res.status(200).send(data);
        } else {
            res.status(404).send({ msg: 'Chat not found' });
        }
    } catch (error) {
        res.status(500).send({ msg: 'Error retrieving chat data' });
    }
});
app.get("/getchat", Auth, async (req, res) => {
    try {
        const user = await userdata.findOne({ _id: req.userId }); // Use req.userId to find the user

        if (!user) {
            return res.status(404).send({ msg: 'User not found' });
        }

        const data = await chatmodel.find({ user: user._id });
        res.status(200).send(data);
    } catch (error) {
        res.status(500).send({ msg: 'Server error' });
    }
});



app.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;

        // Hash the user's password before saving it to the database
        const hashpass = await bcrypt.hash(password, 10);

        const user = new userdata({
            firstname,
            lastname,
            email,
            password: hashpass, // Store the hashed password in the database
        });

        await user.save();
        res.status(200).send("Register successful");
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});


//login user
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userdata.findOne({ email });
        if (!user) {
            res.status(401).send("Invaild credentails");
            return;
        }
        const passvaild = await bcrypt.compare(password, user.password);
        if (!passvaild) {
            res.status(401).send("Invaild credentails");
            return;
        }
        const token = jwt.sign({ userId: user._id }, "masai");
        res.json({ token })
    } catch (error) {
        res.status(500).send("error login");
    }
})



let port = 3000
app.listen(3000, async () => {
    try {
        await connection;
        console.log("connected to database")
    } catch (error) {
        console.log("something wrong in database")
    }
    console.log(`Server is running on port ${port}`);
});
