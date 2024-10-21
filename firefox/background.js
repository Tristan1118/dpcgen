// background.js
// Function to parse and handle the JSON data from files
function loadTestCaseData(fileDataArray) {
  const testCaseData = {};
  fileDataArray.forEach(file => {
      try {
          const jsonData = JSON.parse(file.content);
          console.log(`Loaded data from ${file.name}:`, jsonData);
          // Add further processing of the JSON data here
          Object.assign(testCaseData, jsonData); // Merge the parsed data into testCaseData
          console.log("Updated testCaseData: " + JSON.stringify(testCaseData));
      } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
      }
  });
  browser.storage.local.set({ testCaseData }, () => {
    console.log("Test cases loaded and saved to browser.storage.local:", testCaseData);
  });
}

// Listen for messages from options.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'loadTestCaseData') {
      loadTestCaseData(message.files);
  }
});

