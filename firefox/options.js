const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

// Event listener for file selection
fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    const fileArray = [];

    fileList.innerHTML = ''; // Clear previous list

    // Display selected files and store them in an array
    for (const file of files) {
        fileArray.push(file.name);

        // Display selected file names
        const listItem = document.createElement('div');
        listItem.textContent = file.name;
        fileList.appendChild(listItem);
    }

    // Send the file names to the background script
    sendFilesToBackground(files);
});

// Function to send file data to the background script
function sendFilesToBackground(files) {
    const fileDataArray = [];

    // Read each file as text and send it to background.js
    for (const file of files) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            fileDataArray.push({ name: file.name, content: fileContent });

            // Once all files are loaded, send them to background.js
            if (fileDataArray.length === files.length) {
                chrome.runtime.sendMessage({ type: 'loadTestCaseData', files: fileDataArray });
            }
        };

        reader.readAsText(file); // Read the file as text
    }
}
