// background.js
const loadTestCaseData = async () => {
  const testCaseData = {};

  // List of your JSON file names
  const fileNames = [
    'testcases/fileupload.json'
    // Add more filenames as needed
  ];

  // Fetch and parse each JSON file
  for (const fileName of fileNames) {
    const response = await fetch(browser.runtime.getURL(fileName));
    if (response.ok) {
      const jsonData = await response.json();
      Object.assign(testCaseData, jsonData); // Merge the parsed data into the testCaseData object
    } else {
      console.error(`Failed to load ${fileName}: ${response.statusText}`);
    }
  }

  // Save the combined test cases to browser.storage.local
  browser.storage.local.set({ testCaseData }, () => {
    console.log("Test cases loaded and saved to browser.storage.local:", testCaseData);
  });
};

// Call loadTestCaseData when the background script starts
loadTestCaseData();