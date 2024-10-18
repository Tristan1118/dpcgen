const readAllTestCaseData = () => {
  return new Promise((resolve, reject) => {
    browser.storage.local.get('testCaseData', (result) => {
      if (browser.runtime.lastError) {
        return reject(new Error(browser.runtime.lastError));
      }
      const testCaseData = result.testCaseData || {}; // Default to an empty object if not found
      resolve(testCaseData);
    });
  });
};

// Function to populate the dropdown with test case titles
const populateTestCaseDropdown = (testCases) => {
  const dropdown = document.getElementById('testCaseDropdown');
  for (const title in testCases) {
    if (testCases.hasOwnProperty(title)) {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      dropdown.appendChild(option);
    }
  }
};

// On page load, populate the dropdown and add event listener
document.addEventListener('DOMContentLoaded', async () => {
  readAllTestCaseData().then((testCaseData) => {
    populateTestCaseDropdown(testCaseData);
  });

  // add functionality to the test case button
  const addButton = document.getElementById('addTestCaseButton');

    // Event listener for the button click
    addButton.addEventListener('click', function() {
        // This is where you call your function to add the test case for the program
        addTestCaseForProgram();
        window.close();
    });
});



// Function to read allProgramData from storage
const readAllProgramData = () => {
  return new Promise((resolve, reject) => {
    browser.storage.local.get('allProgramData', (result) => {
      if (browser.runtime.lastError) {
        return reject(new Error(browser.runtime.lastError));
      }
      const allProgramData = result.allProgramData || {}; // Default to an empty object if not found
      resolve(allProgramData);
    });
  });
};

// Function to handle selection of a test case
const handleSelection = (event) => {
  const selectedTitle = event.target.value;
  if (selectedTitle) {
    readAllTestCaseData().then((allTestCaseData) => {
      const testCaseData = allTestCaseData[selectedTitle];
      const currentUrl = window.location.href;
      processTestCase(testCaseData, currentUrl);
    });
  }
};

// Function to process the selected test case
const processTestCase = (testCaseData, currentUrl) => {
  
};

function addTestCaseForProgram() {
  
}


