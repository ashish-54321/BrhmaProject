const express = require('express');
const multer = require("multer");
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT;

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Admin Log In Only
const setEmail = process.env.ADMIN_EMAIL;
const setPassword = process.env.ADMIN_PASSWORD;

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


// Root endpoint
app.get('/', (req, res) => {
    res.status(200).send('Ashish Api Live');
});



// API endpoint to handle form submission
app.post("/submit-details", upload.single("image"), async (req, res) => {
    try {
        // Extract data from the request
        const { firstname, lastname, currentResident, nativeResident, familyMembers, email, password } = req.body;
        const imageBuffer = req.file ? req.file.buffer : null;

        if (!email || !password) {
            return res.status(404).json({ message: "Please Provide username and Password" });
        }

        if (setEmail !== email || setPassword !== password) {
            return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });
        }

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

app.post('/login', async (req, res) => {

    try {
        // Extract data from the request
        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(404).json({
                message: "All Fileds Required",
                adminStatus: false
            });
        }



        if (setEmail === email && setPassword === password) {

            // Respond with the fetched data
            res.status(200).json({
                message: "Admin Login Successful",
                adminStatus: true
            });

        } else {
            // Respond with the fetched data
            res.status(200).json({
                message: "Invalid Credentials",
                adminStatus: false
            });

        }

    } catch (error) {
        console.error("Error In Login Api :", error);

        // Respond with the fetched data
        res.status(500).json({
            message: "Internal Server Error",
            adminStatus: false
        });

    }

})


// Update API
app.post("/update-family-member", async (req, res) => {
    const { firstname, lastname, current, native, member, relation, age, qualification, gotra, occupation, ticket, memberId, familyId, email, password } = req.body;
    if (!email || !password) {
        return res.status(404).json({ message: "Please Provide username and Password" });
    }

    if (setEmail !== email || setPassword !== password) {
        return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });
    }

    if (ticket === "head") {

        if (!firstname || !lastname || !current || !native || !familyId) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const message = await updateHead(familyId, req.body);
        return res.status(200).json({ message });

    } else if (ticket === 'member') {

        if (!member || !relation || !age || !qualification || !gotra || !occupation || !memberId || !familyId) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const message = await updateMember(familyId, req.body, memberId)
        return res.status(200).json({ message });
    } else if (ticket === 'new') {

        if (!member || !relation || !age || !qualification || !gotra || !occupation || !familyId) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const message = await updateNewMember(familyId, req.body)
        return res.status(200).json({ message });
    }
    else {
        return res.status(400).json({ message: "Bad Request Ticket Required" });
    }



});


async function updateNewMember(id, data) {

    try {
        // Find the family document by ID
        const family = await Family.findById(id);

        if (!family) {
            return "Family not found"
        }

        // Create the new family member object
        const newFamilyMember = {
            name: data.member,
            relation: data.relation,
            gotra: data.gotra,
            qualification: data.qualification,
            age: data.age,
            occupation: data.occupation,
        };

        // Add the new member to the familyMembers array
        family.familyMembers.push(newFamilyMember);

        // Save the updated document
        await family.save();
        return "Family member added successfully"

    } catch (error) {
        console.error("Error adding family member:", error);
        return "Internal Server Error. Try Again Later";
    }


}




async function updateHead(id, data) {
    try {

        // Update the family record
        const updatedFamily = await Family.findByIdAndUpdate(
            id,
            {
                $set: {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    currentResident: data.current,
                    nativeResident: data.native,
                }
            },
            { new: true } // Return the updated document
        );
        if (updatedFamily) {
            return "Details Updated Successfully";
        }
        return "Details Not Updated User Not Found . Try Again Later";
    } catch (error) {
        console.error("Error updating family details:", error);
        return "Internal Server Error. Try Again Later";
    }

}
async function updateMember(id, data, memberId) {
    try {
        const updatedFamily = await Family.findOneAndUpdate(
            { _id: id, "familyMembers._id": memberId },
            {
                $set: {
                    "familyMembers.$.occupation": data.occupation,
                    "familyMembers.$.name": data.member,
                    "familyMembers.$.gotra": data.gotra,
                    "familyMembers.$.relation": data.relation,
                    "familyMembers.$.qualification": data.qualification,
                    "familyMembers.$.age": data.age,
                },
            },
            { new: true } // Return the updated document
        );

        if (!updatedFamily) {
            return "Family Member Not Found . Try Again later";
        }
        return "Updated Family Member Successfully";
    } catch (error) {
        console.error("Error updating family member details:", error);
        return "Internal Server Error. Try Again Later";
    }

}

// DELETE API to delete a family document by _id
app.post("/api/family/delete", async (req, res) => {
    try {
        const { id, email, password } = req.body;

        if (!email || !id || !password) {
            return res.status(400).json({ message: "Bad Request. Check Perameters All Param Required" });
        }

        if (setEmail !== email || setPassword !== password) {
            return res.status(400).json({ message: "Invalid credentials. Please contact to the admin." });
        }

        // Find and delete the family document by _id
        const deletedFamily = await Family.findByIdAndDelete(id);

        if (!deletedFamily) {
            return res.status(404).json({ message: "Family document not found" });
        }

        res.status(200).json({ message: "Family details deleted successfully" });
    } catch (error) {
        console.error("Error deleting family document:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
