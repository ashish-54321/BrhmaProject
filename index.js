const express = require('express');
const multer = require("multer");
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3000;

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// MongoDB connection using environment variable
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// Mongoose schema and model

const FamilyMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    relation: { type: String, required: true },
    gotra: { type: String, required: true },
    qualification: { type: String, required: true },
    age: { type: Number, required: true },
    occupation: { type: String, required: true },
});

const FamilySchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    currentResident: { type: String, required: true },
    nativeResident: { type: String, required: true },
    familyMembers: { type: [FamilyMemberSchema], required: true },
    image: { type: Buffer }, // To store the image in binary format
});

const Family = mongoose.model("Family", FamilySchema);

function delay(minutes) {
    return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}

async function keepAlive() {
    const speek = await axios.get(`https://brhmaproject.onrender.com`)
    console.log(speek.data);
    await delay(14);
    keepAlive();
}

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).send('Ashish Api Live');
});



// API endpoint to handle form submission
app.post("/submit-details", upload.single("image"), async (req, res) => {
    try {
        // Extract data from the request
        const { firstname, lastname, currentResident, nativeResident, familyMembers } = req.body;
        const imageBuffer = req.file ? req.file.buffer : null;

        // Validate required fields
        if (!firstname || !lastname || !currentResident || !nativeResident || !familyMembers || familyMembers.length < 1) {
            return res.status(400).json({ error: "All fields are required, including at least one family member." });
        }

        // Parse family members (they arrive as JSON in req.body)
        const parsedFamilyMembers = JSON.parse(familyMembers);

        // Create a new Family document
        const newFamily = new Family({
            firstname,
            lastname,
            currentResident,
            nativeResident,
            familyMembers: parsedFamilyMembers,
            image: imageBuffer,
        });

        // Save the document to the database
        await newFamily.save();

        res.status(200).json({
            message: "Details submitted successfully and stored in the database!",
        });
    } catch (error) {
        console.error("Error submitting details:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});



// API endpoint to fetch all family details with base64 image
app.get('/get-family-details', async (req, res) => {
    try {
        // Fetch all family details from the database
        const families = await Family.find();

        // Map the families to include the base64-encoded image
        const familyDetailsWithImages = families.map(family => {
            return {
                ...family.toObject(),
                image: family.image ? family.image.toString('base64') : null
            };
        });

        // Respond with the fetched data
        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: familyDetailsWithImages,
        });
    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({ error: "An error occurred while fetching family details." });
    }
});


// API endpoint to fetch family details by _id
app.get('/get-family-details/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the family details by _id from the database
        const family = await Family.findById(id);

        if (!family) {
            return res.status(404).json({ error: "Family not found." });
        }

        // Include base64-encoded image
        const familyDetailsWithImage = {
            ...family.toObject(),
            image: family.image ? family.image.toString('base64') : null
        };

        // Respond with the fetched data
        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: familyDetailsWithImage,
        });
    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({ error: "An error occurred while fetching family details." });
    }
});


app.get('/search-family-details', async (req, res) => {
    try {
        const searchText = req.query.searchText.toLowerCase(); // Get search query from the query params

        // Fetch matching family details from the database using regex for partial matches
        const families = await Family.find({
            $or: [
                { firstname: { $regex: searchText, $options: 'i' } }, // Search in firstname
                { lastname: { $regex: searchText, $options: 'i' } },  // Search in lastname
                { currentResident: { $regex: searchText, $options: 'i' } }, // Search in currentResident
                { nativeResident: { $regex: searchText, $options: 'i' } } // Search in nativeResident
            ]
        });

        // Map the families to include the base64-encoded image
        const familyDetailsWithImages = families.map(family => {
            return {
                ...family.toObject(),
                image: family.image ? family.image.toString('base64') : null
            };
        });

        // Respond with the fetched data
        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: familyDetailsWithImages,
        });
    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({ error: "An error occurred while fetching family details." });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


keepAlive()
