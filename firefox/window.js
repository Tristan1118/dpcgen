// Function to read allProgramData from storage
const readAllProgramData = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('allProgramData', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError));
      }
      const allProgramData = result.allProgramData || {}; // Default to an empty object if not found
      resolve(allProgramData);
    });
  });
};

// Function to populate the dropdown with test case titles
const populateDropdown = (testCases) => {
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

// Function to handle selection of a test case
const handleSelection = (event) => {
  const selectedTitle = event.target.value;
  if (selectedTitle) {
    readAllProgramData().then((allProgramData) => {
      const testCaseData = allProgramData[selectedTitle];
      const currentUrl = window.location.href;
      processTestCase(testCaseData, currentUrl);
    });
  }
};

// Function to process the selected test case
const processTestCase = (testCaseData, currentUrl) => {
  console.log('Selected Test Case Data:', testCaseData);
  console.log('Current URL:', currentUrl);
};

// On page load, populate the dropdown and add event listener
document.addEventListener('DOMContentLoaded', async () => {
  const allProgramData = await readAllProgramData();
  populateDropdown(allProgramData);

  // Add change event listener to the dropdown
  const dropdown = document.getElementById('testCaseDropdown');
  dropdown.addEventListener('change', handleSelection);
});
