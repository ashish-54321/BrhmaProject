const express = require('express');
const multer = require("multer");
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT;

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Admin Log In Only
const setEmail = process.env.ADMIN_EMAIL;
const setPassword = process.env.ADMIN_PASSWORD;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME, // Replace with your Cloudinary cloud name
    api_key: process.env.API_KEY,       // Replace with your Cloudinary API key
    api_secret: process.env.API_SECRET, // Replace with your Cloudinary API secret
});


// Middleware to parse JSON bodies
app.use(express.json());


const allowedOrigin = 'https://jangrasabha.com';
// const allowedOrigin = 'http://localhost:5173';


// CORS Configuration
app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: {
        status: 429,
        error: 'Too many requests. Please try again later.'
    }
});
app.use(limiter);



// Block Direct Browser Access & Non-Browser Requests
app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const userAgent = req.get('User-Agent') || '';

    // 1. Block direct browser access
    if (!origin) {
        return res.status(403).json({ message: 'Direct access is not allowed Access Denied Fuck You create your Own u Looser' });
    }

    // 2. Only allow requests from the specific frontend
    if (origin !== allowedOrigin) {
        return res.status(403).json({ message: 'Access Denied Fuck You create your Own u Looser' });
    }

    // 3. Block requests from backend servers
    const blockedAgents = ['Postman', 'node-fetch', 'axios', 'cURL', 'http'];
    if (blockedAgents.some((agent) => userAgent.includes(agent))) {
        return res.status(403).json({ message: 'Access Denied Fuck You create your Own u Looser' });
    }

    next();
});



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
    fullname: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String },
    phone: { type: String, required: true },
    currentResident: { type: String, required: true },
    nativeResident: { type: String, required: true },
    familyMembers: { type: [FamilyMemberSchema], required: true },
    image: { type: String },
});

const Family = mongoose.model("Family", FamilySchema);

const NewsSchema = new mongoose.Schema({
    title: String,
    description: String,
    datetime: String,
    imageUrls: [String]
});

const News = mongoose.model("News", NewsSchema);


// Root endpoint
// Root endpoint – total Family documents kitne hain
app.get('/', async (req, res) => {
    try {
        // ❱❱ Total documents count
        const totalFamilies = await Family.countDocuments({});    // exact count
        //  ▸ Agar approximate count chale to: await Family.estimatedDocumentCount();

        res.status(200).json({ totalFamilies });  // { totalFamilies: 42 } jaisi response
    } catch (err) {
        console.error('Error counting Family docs:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});





// News/Blog Post
// 👇 Multer: images + videos alag‑alag fields accept karo
// 10 images tak + 3 videos tak (numbers ko apni requirement ke hisaab se change kar sakte ho)
app.post(
    "/api/news",
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "videos", maxCount: 3 },
    ]),
    async (req, res) => {
        try {
            const { title, description, datetime, email, password } = req.body;

            // --- Auth check (same as before)
            if (!email || !password)
                return res.status(404).json({ message: "Please Provide username and Password" });
            if (setEmail !== email || setPassword !== password)
                return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });

            // --- Mandatory fields
            if (!title || !description || !datetime)
                return res.status(400).json({ error: "All fields are required. Not Posted" });

            // 1️⃣ Save news first
            const news = new News({ title, description, datetime });
            const savedNews = await news.save();

            // 2️⃣ Handle images
            if (req.files?.images?.length) {
                const allowedImg = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
                const maxImgSize = 500 * 1024; // 500 KB

                for (const file of req.files.images) {
                    const { mimetype, size, originalname } = file;
                    if (allowedImg.includes(mimetype) && size <= maxImgSize) {
                        await uploadImage(savedNews._id, file, "jangra-blog"); // ⭐️ your existing helper
                        console.log("Image uploaded:", originalname);
                    } else {
                        console.warn("⛔ Image skipped:", originalname);
                    }
                }
            }

            // 3️⃣ Handle videos
            if (req.files?.videos?.length) {
                const allowedVid = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
                const maxVidSize = 20 * 1024 * 1024; // 20 MB

                for (const file of req.files.videos) {
                    const { mimetype, size, originalname } = file;
                    if (allowedVid.includes(mimetype) && size <= maxVidSize) {
                        // 👇 Example Cloudinary helper (resource_type:"video")
                        await uploadVideo(savedNews._id, file, "jangra-blog");
                        console.log("Video uploaded:", originalname);
                    } else {
                        console.warn("⛔ Video skipped:", originalname);
                    }
                }
            }

            res.status(200).json({ message: "News, images & videos saved successfully." });
        } catch (err) {
            console.error("❌ Error saving news:", err);
            res.status(500).json({ error: err.message });
        }
    }
);




app.get('/api/news', async (req, res) => {
    const allNews = await News.find({});
    res.status(200).json(allNews);
});

app.get('/api/news/:id', async (req, res) => {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send({ error: "Not found" });
    res.send(news);
});

// Custom Hindi detector
function isHindiText(text) {
    if (!text || typeof text !== "string") return false;
    return /[\u0900-\u097F]/.test(text);
}

// Translate if needed
async function translateIfNeeded(text) {
    if (!text || typeof text !== "string") return text;

    if (isHindiText(text)) return text;  // skip if hindi

    const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) {
        console.error(`Translation failed for "${text}"`);
        return text;
    }
    const data = await res.json();
    return data[0][0][0]; // translated
}



app.post("/submit-details", upload.single("image"), async (req, res) => {
    try {
        const { firstname, lastname, phone, currentResident, nativeResident, familyMembers, email, password } = req.body;

        if (!email || !password) {
            return res.status(404).json({ message: "Please Provide username and Password" });
        }

        if (setEmail !== email || setPassword !== password) {
            return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });
        }

        if (!firstname || !phone || !currentResident || !nativeResident || !familyMembers || familyMembers.length < 1) {
            return res.status(400).json({ error: "All fields are required, including at least one family member." });
        }

        const parsedFamilyMembers = JSON.parse(familyMembers);

        // Translate personal info
        const translatedFirstname = await translateIfNeeded(firstname);
        const translatedLastname = await translateIfNeeded(lastname);
        const translatedCurrentResident = await translateIfNeeded(currentResident);
        const translatedNativeResident = await translateIfNeeded(nativeResident);

        // Translate family members
        const translatedFamilyMembers = await Promise.all(
            parsedFamilyMembers.map(async (member) => ({
                name: await translateIfNeeded(member.name),
                relation: await translateIfNeeded(member.relation),
                gotra: await translateIfNeeded(member.gotra),
                qualification: await translateIfNeeded(member.qualification),
                occupation: await translateIfNeeded(member.occupation),
                age: member.age,
            }))
        );

        // Check if a similar record already exists
        const existingFamily = await Family.findOne({
            firstname,
            lastname,
            phone,
            currentResident,
            nativeResident,
            familyMembers: {
                $all: parsedFamilyMembers.map(member => ({
                    $elemMatch: member
                }))
            }
        });

        if (existingFamily) {
            return res.status(409).json({ message: "This family record already exists." });
        }


        // Save to DB
        const newFamily = new Family({
            fullname: `${firstname} ${lastname}`,
            firstname: translatedFirstname,
            lastname: translatedLastname,
            phone,
            currentResident: translatedCurrentResident,
            nativeResident: translatedNativeResident,
            familyMembers: translatedFamilyMembers,
        });

        const savedFamily = await newFamily.save();

        if (req.file) {
            const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
            const maxFileSize = 500 * 1024; // 500KB in bytes
            const mimeType = req.file.mimetype;
            const fileSize = req.file.size;

            if (allowedMimeTypes.includes(mimeType) && fileSize <= maxFileSize) {
                // Valid image and size within limit
                uploadImage(savedFamily._id, req.file, "optimized-images");
            } else {
                console.warn("Skipped upload due to invalid type or size:", {
                    type: mimeType,
                    size: `${(fileSize / 1024).toFixed(2)} KB`
                });
            }
        }



        res.status(200).json({
            message: "Details submitted successfully and stored in the database!",
        });

    } catch (error) {
        console.error("Error submitting details:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

app.post("/update-img", upload.single("image"), async (req, res) => {
    try {
        const { email, password, id } = req.body;

        if (!email || !password || !id) {
            return res.status(404).json({ message: "Please Provide username and Password" });
        }

        if (setEmail !== email || setPassword !== password) {
            return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });
        }


        if (req.file) {
            const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
            const maxFileSize = 500 * 1024; // 500KB in bytes
            const mimeType = req.file.mimetype;
            const fileSize = req.file.size;

            if (allowedMimeTypes.includes(mimeType) && fileSize <= maxFileSize) {
                // Valid image and size within limit
                uploadImage(id, req.file, "optimized-images");
            } else {
                console.warn("Skipped upload due to invalid type or size:", {
                    type: mimeType,
                    size: `${(fileSize / 1024).toFixed(2)} KB`
                });
            }
        }
        res.status(200).json({
            message: "Image Updated successfully and stored in the database!",
        });

    } catch (error) {
        console.error("Error Updating Img details:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }

});

async function uploadVideo(id, file, path) {
    try {
        let videoUrl = null;

        if (file) {
            // ⇢ Upload the video to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",    // ⭐️ important for videos
                        folder: path,              // Cloudinary folder
                        transformation: [
                            { quality: "auto" }    // auto‑optimize bitrate & codec
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                // Pipe the in‑memory buffer straight into Cloudinary
                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });

            videoUrl = result.secure_url;
        }
        // Temp hai ye optimized-images
        if (path === "optimized-images") {
            // unlikely case for videos, but kept for parity
            await Family.findByIdAndUpdate(
                id,
                { image: videoUrl },
                { new: true }
            );
        } else {
            await News.findByIdAndUpdate(
                id,
                { $push: { imageUrls: videoUrl } }, // ✅ append to array
                { new: true }
            );
        }
    } catch (error) {
        console.error("Error while uploading and saving video:", error.message);
    }
}



// Upload Image in Cloudnary and after That Save Imge Url in DataBase Image

async function uploadImage(id, file, path) {
    try {
        let imageUrl = null;

        if (file) {
            // Upload the image to Cloudinary with automatic format and quality optimization
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: path, // Optional folder in Cloudinary
                        transformation: [
                            { format: "auto", quality: "auto" }, // Apply auto format and quality optimization
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });

            imageUrl = result.secure_url; // Extract the image URL from Cloudinary response
        }

        if (path === 'optimized-images') {

            // Save this imageUrl in MongoDB on the specific object ID
            await Family.findByIdAndUpdate(
                id, // The ID of the document to update
                { image: imageUrl }, // The field to update
                { new: true } // Return the updated document
            );

        } else {

            // Save this imageUrl in MongoDB on the specific object ID
            await News.findByIdAndUpdate(
                id,
                { $push: { imageUrls: imageUrl } }, // ✅ Push new URL to the array
                { new: true }
            );


        }




    } catch (error) {
        console.error("Error while uploading and saving image:", error.message);
    }
}



// API endpoint to fetch all family details with base64 image
app.get('/get-family-details', async (req, res) => {
    try {
        // page aur limit query param le lo
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        // total count nikal lo
        const total = await Family.countDocuments();

        // paginated result
        const families = await Family.find()
            .select("firstname lastname image nativeResident currentResident")
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: families,
            total: total,   // yeh important hai, frontend ko total pages calculate karne ke liye
        });
    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({
            error: "An error occurred while fetching family details.",
        });
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


        // Respond with the fetched data
        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: family,
        });
    } catch (error) {
        console.error("Error fetching family details:", error);
        res.status(500).json({ error: "An error occurred while fetching family details." });
    }
});


app.get('/search-family-details', async (req, res) => {
    try {
        // Get search query from the query params
        const searchText = req.query.searchText.toLowerCase()

        // Fetch matching family details from the database with specific fields
        const families = await Family.find({
            $or: [
                { fullname: { $regex: searchText, $options: "i" } },
                { firstname: { $regex: searchText, $options: "i" } }, // Search in firstname
                { lastname: { $regex: searchText, $options: "i" } }, // Search in lastname
                { phone: { $regex: searchText, $options: "i" } }, // Search in phone
                { currentResident: { $regex: searchText, $options: "i" } }, // Search in currentResident
                { nativeResident: { $regex: searchText, $options: "i" } }, // Search in nativeResident
            ],
        }).select("firstname lastname phone fullname image nativeResident currentResident");


        // Respond with the fetched data
        res.status(200).json({
            message: "Family details retrieved successfully!",
            data: families,
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
    const { firstname, lastname, phone, current, native, member, relation, age, qualification, gotra, occupation, ticket, memberId, familyId, email, password } = req.body;
    if (!email || !password) {
        return res.status(404).json({ message: "Please Provide username and Password" });
    }

    if (setEmail !== email || setPassword !== password) {
        return res.status(400).json({ message: "Invalid credentials. Please contact the admin." });
    }

    if (ticket === "head") {

        if (!firstname || !phone || !current || !native || !familyId) {
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
            name: await translateIfNeeded(data.member),
            relation: await translateIfNeeded(data.relation),
            gotra: await translateIfNeeded(data.gotra),
            qualification: await translateIfNeeded(data.qualification),
            age: await translateIfNeeded(data.age),
            occupation: await translateIfNeeded(data.occupation),
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
                    firstname: await translateIfNeeded(data.firstname),
                    lastname: await translateIfNeeded(data.lastname),
                    phone: data.phone,
                    currentResident: await translateIfNeeded(data.current),
                    nativeResident: await translateIfNeeded(data.native),
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
                    "familyMembers.$.occupation": await translateIfNeeded(data.occupation),
                    "familyMembers.$.name": await translateIfNeeded(data.member),
                    "familyMembers.$.gotra": await translateIfNeeded(data.gotra),
                    "familyMembers.$.relation": await translateIfNeeded(data.relation),
                    "familyMembers.$.qualification": await translateIfNeeded(data.qualification),
                    "familyMembers.$.age": await translateIfNeeded(data.age),
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

        if (
            deletedFamily.image &&
            deletedFamily.image !== 'null' &&
            deletedFamily.image.trim() !== ''
        ) {
            deleteImg(deletedFamily.image);
        }

        res.status(200).json({ message: "Family details deleted successfully" });
    } catch (error) {
        console.error("Error deleting family document:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post("/api/news/delete", async (req, res) => {
    try {
        const { id, email, password, imgUrl } = req.body;

        if (!email || !id || !password) {
            return res.status(400).json({ message: "Bad Request. Check Perameters All Param Required" });
        }

        if (setEmail !== email || setPassword !== password) {
            return res.status(400).json({ message: "Invalid credentials. Please contact to the admin." });
        }

        // Find and delete the family document by _id
        const deletedNews = await News.findByIdAndDelete(id);

        if (!deletedNews) {
            return res.status(404).json({ message: "News document not found" });
        }

        // If there are image URLs, delete each one
        if (Array.isArray(deletedNews.imageUrls) && deletedNews.imageUrls.length > 0) {
            for (const imgUrl of deletedNews.imageUrls) {
                if (imgUrl && imgUrl !== 'null') {
                    deleteImg(imgUrl); // Call your function here for each image
                }
            }
        }

        res.status(200).json({ message: "Family details deleted successfully" });
    } catch (error) {
        console.error("Error deleting family document:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// This function Help to delete Img fron Cloudnary Storage

async function deleteImg(mediaUrl) {
    try {
        console.log("🧹 Deleting media:", mediaUrl);

        const public_id = mediaUrl
            .split('/upload/')[1]
            .split('/').slice(1).join('/')
            .split('.')[0];

        const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(mediaUrl); // detect video by extension

        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: isVideo ? "video" : "image", // ✅ dynamic type
            invalidate: true,
        });

        if (result.result === 'ok') {
            console.log(`✅ ${isVideo ? "Video" : "Image"} deleted successfully.`);
        } else {
            console.log(`❌ Failed to delete. Details: ${JSON.stringify(result)}`);
        }
    } catch (error) {
        console.error(`❗ Error while deleting media: ${error.message}`);
    }
}


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
