

// Wait for the document to fully load
window.addEventListener('load', () => {
  const image = document.getElementById('image');
  // Add the 'visible' class to trigger the fade-in effect
  image.classList.add('visible');
});



// ************** [ Counting Animation ] *******************

let firstThresholdPassed = false;
let secondThresholdPassed = false;

window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  if (!firstThresholdPassed && scrollPosition >= 900) {
    firstThresholdPassed = true;

    let CounterNum = document.querySelectorAll('.count-number');
    const speed = 200;

    CounterNum.forEach((curElem) => {
      const updateNumber = () => {
        const targetNumber = parseInt(curElem.dataset.number);
        const initialNum = parseInt(curElem.innerText);

        const incrementNumber = Math.trunc(targetNumber / speed);
        if (initialNum < targetNumber) {
          curElem.innerText = initialNum + incrementNumber;
          setTimeout(updateNumber, 10);
        }
      }
      updateNumber();
    });
  }

  if (!secondThresholdPassed && scrollPosition >= 1700) {
    secondThresholdPassed = true;

    let CounterNum = document.querySelectorAll('.count-numbers');
    const speed = 200;

    CounterNum.forEach((curElem) => {
      const updateNumber = () => {
        const targetNumber = parseInt(curElem.dataset.number);
        const initialNum = parseInt(curElem.innerText);

        const incrementNumber = Math.trunc(targetNumber / speed);
        if (initialNum < targetNumber) {
          curElem.innerText = initialNum + incrementNumber;
          setTimeout(updateNumber, 10);
        }
      }
      updateNumber();
    });
  }
});



// ************ [ Current Year for Copyright Automate ]********************

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const paragraph = document.querySelector('.copyright');
paragraph.textContent = `Copyright- © ${currentYear}`;


document.getElementById("addMember").addEventListener("click", addMember);

let memberCount = 0;

function addMember() {
  memberCount++;
  const tableBody = document.querySelector("#memberTable tbody");

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${memberCount}</td>
    <td><input type="text" placeholder="Enter Name" /></td>
    <td><input type="text" placeholder="Enter Relation" /></td>
    <td><input type="text" placeholder="Enter Gotra" /></td>
    <td><input type="text" placeholder="Enter Qualification" /></td>
    <td><input type="number" placeholder="Enter Age" /></td>
    <td><input type="text" placeholder="Enter Occupation" /></td>
  `;

  tableBody.appendChild(newRow);
}

// JavaScript to handle smooth scrolling
document.getElementById("scrollButton").addEventListener("click", function () {
  document.getElementById("familyScroled").scrollIntoView({
    behavior: "smooth"
  });
});


const fileInput = document.getElementById("file");
const previewImage = document.getElementById("preview");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    // Load the file and set the preview
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      document.querySelector(".preview-container").style.display = "block"
      previewImage.style.display = "block"; // Show the image
    };

    reader.readAsDataURL(file);
  } else {
    previewImage.src = "";
    previewImage.style.display = "none"; // Hide the image

  }
});


