const users = [
    {
        name: "Ramesh Sharma",
        image: "../assets/pasport/images (1).jpeg",
        currentAddress: "123 MG Road, Delhi",
        nativeAddress: "456 Brahmapuri, Varanasi",
    },
    {
        name: "Suresh Tripathi",
        image: "../assets/pasport/images (2).jpeg",
        currentAddress: "789 Civil Lines, Lucknow",
        nativeAddress: "101 Kashi Dham, Varanasi",
    },
    {
        name: "Amit Joshi",
        image: "../assets/pasport/images (3).jpeg",
        currentAddress: "555 Baner Road, Pune",
        nativeAddress: "999 Om Nagar, Haridwar",
    },
    {
        name: "Mahesh Pandey",
        image: "../assets/pasport/images (4).jpeg",
        currentAddress: "321 MG Road, Bangalore",
        nativeAddress: "654 Shivaji Marg, Prayagraj",
    },
    {
        name: "Rajesh Mishra",
        image: "../assets/pasport/images (5).jpeg",
        currentAddress: "111 Residency Road, Jaipur",
        nativeAddress: "222 Saraswati Lane, Ayodhya",
    },
    {
        name: "Vikas Chaturvedi",
        image: "../assets/pasport/images (6).jpeg",
        currentAddress: "45 Park Street, Kolkata",
        nativeAddress: "678 Ram Nagar, Kanpur",
    },
    {
        name: "Arvind Upadhyay",
        image: "../assets/pasport/images.jpeg",
        currentAddress: "99 Brigade Road, Bangalore",
        nativeAddress: "34 Hanuman Gali, Mathura",
    },
    {
        name: "Dinesh Dwivedi",
        image: "../assets/pasport/images (1).jpeg",
        currentAddress: "66 MG Road, Mumbai",
        nativeAddress: "890 Vishnu Puram, Gorakhpur",
    },
    {
        name: "Prakash Tiwari",
        image: "../assets/pasport/images (2).jpeg",
        currentAddress: "88 IT Park, Hyderabad",
        nativeAddress: "321 Krishna Nagar, Jabalpur",
    },
    {
        name: "Manoj Shukla",
        image: "../assets/pasport/images (3).jpeg",
        currentAddress: "222 Sarjapur Road, Bangalore",
        nativeAddress: "987 Ganga Nagar, Rewa",
    },
    {
        name: "Ashok Dixit",
        image: "../assets/pasport/images (5).jpeg",
        currentAddress: "19 Banjara Hills, Hyderabad",
        nativeAddress: "123 Tulsi Vihar, Jhansi",
    },
    {
        name: "Sunil Pathak",
        image: "../assets/pasport/images (1).jpeg",
        currentAddress: "56 Salt Lake City, Kolkata",
        nativeAddress: "654 Surya Nagar, Bhopal",
    },
    {
        name: "Kamal Jha",
        image: "../assets/pasport/images (4).jpeg",
        currentAddress: "77 Andheri East, Mumbai",
        nativeAddress: "567 Sita Kunj, Bhagalpur",
    },
    {
        name: "Ravi Vyas",
        image: "../assets/pasport/images.jpeg",
        currentAddress: "90 Connaught Place, Delhi",
        nativeAddress: "999 Yamuna Colony, Meerut",
    },
    {
        name: "Vivek Ojha",
        image: "../assets/pasport/images (3).jpeg",
        currentAddress: "33 Hitech City, Hyderabad",
        nativeAddress: "444 Govindpuri, Varanasi",
    },
    {
        name: "Anil Sanyal",
        image: "../assets/pasport/images (5).jpeg",
        currentAddress: "18 MG Road, Chennai",
        nativeAddress: "555 Durga Marg, Guwahati",
    },
    {
        name: "Sanjay Kulkarni",
        image: "../assets/pasport/images (6).jpeg",
        currentAddress: "72 Koregaon Park, Pune",
        nativeAddress: "321 Shivaji Park, Nagpur",
    },
    {
        name: "Raghav Bhatt",
        image: "../assets/pasport/images (3).jpeg",
        currentAddress: "85 Lalbagh Road, Bangalore",
        nativeAddress: "678 Devpuri, Dehradun",
    },
    {
        name: "Nitin Agnihotri",
        image: "../assets/pasport/images (2).jpeg",
        currentAddress: "25 Civil Lines, Allahabad",
        nativeAddress: "999 Ram Vihar, Lucknow",
    },
    {
        name: "Harish Chaubey",
        image: "../assets/pasport/images (1).jpeg",
        currentAddress: "40 MG Road, Indore",
        nativeAddress: "111 Saraswati Marg, Gwalior",
    },
];


const userCardsContainer = document.getElementById("userCards");
const searchBar = document.getElementById("searchBar");

// Function to render user cards
function renderUserCards(filteredUsers) {
    userCardsContainer.innerHTML = ""; // Clear the container
    filteredUsers.forEach(user => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
      <img src="${user.image}" alt="${user.name}">
      <div class="card-content">
        <h3>${user.name}</h3>
        <p><strong>Current Address:</strong> ${user.currentAddress}</p>
        <p><strong>Native Address:</strong> ${user.nativeAddress}</p>
      </div>
    `;

        userCardsContainer.appendChild(card);
    });
}

// Initial rendering of user cards
renderUserCards(users);

// Search functionality
searchBar.addEventListener("input", (e) => {
    const searchText = e.target.value.toLowerCase();
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchText) ||
        user.currentAddress.toLowerCase().includes(searchText) ||
        user.nativeAddress.toLowerCase().includes(searchText)
    );
    renderUserCards(filteredUsers);
});
