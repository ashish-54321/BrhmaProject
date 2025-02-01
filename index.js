require('dotenv').config()
const { text } = require('express');
const express = require("express");
const nodemailer = require("nodemailer");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const port = process.env.PORT || 5000;
const user = process.env.USER;
const pass = process.env.PASS;
//  Routing  
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/Index.html")
})

app.get("/contactform.html", (req, res) => {
    res.sendFile(__dirname + "/public/contactform.html")
})

app.get("/about.html", (req, res) => {
    res.sendFile(__dirname + "/public/about.html")
})
app.get("/order.html", (req, res) => {
    res.sendFile(__dirname + "/public/order.html")
})

// *********************************

app.post("/", (req, res) => {
    console.log(req.body);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: 'anamikatiwari318@gmail.com',
            pass: 'xvqhmcovbfqnmlxz'
        },
    });

    const mailOptions = {
        from: req.body.email,
        to: 'anamikatiwari318@gmail.com',
        subject: `Message from ${req.body.email}: ${req.body.subject}`,
        text: req.body.message
    }

    transporter.sendMail(mailOptions, (error, responose) => {
        if (error) {
            console.log(error);
            res.send("error")
        } else {
            console.log("Email Sent");
            res.send("success")
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}...`);
});