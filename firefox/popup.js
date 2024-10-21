
// Define a global variable to store the current URL
let currentTabUrl = '';
let currentDomain = '';

// On page load, get and store the current url/domain
document.addEventListener('DOMContentLoaded', () => {
  // Get the current tab's URL and domain
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTabUrl = tabs[0].url; // Store the current URL in the global variable
    const domain = new URL(currentTabUrl).hostname;
    currentDomain = domain;
  });
});

// used for caching the selected program
const getLastSelectedProgram = () => {
  return new Promise((resolve, reject) => {
    browser.storage.local.get('lastSelectedProgram', (result) => {
      if (browser.runtime.lastError) {
        return reject(new Error(browser.runtime.lastError));
      }
      const lastSelectedProgram = result.lastSelectedProgram || ""; // Default to an empty object if not found
      resolve(lastSelectedProgram);
    });
  });
};

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
  console.log("Calling populateTestCaseDropdown");
  console.log("Received test cases: " + JSON.stringify(testCases));
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

// Function to populate the dropdown with test case titles
const populateProgramDropdown = (allProgramData) => {
  const dropdown = document.getElementById('programDropdown');
  for (const programName in allProgramData) {
    const option = document.createElement('option');
    option.value = programName;
    option.textContent = programName;
    dropdown.appendChild(option);
  }
};

// On page load, populate the dropdown and add event listener
document.addEventListener('DOMContentLoaded', async () => {
  readAllTestCaseData().then((testCaseData) => {
    populateTestCaseDropdown(testCaseData);
  });

  readAllProgramData().then((allProgramData) => {
    populateProgramDropdown(allProgramData);
  });

  // by default, set the current program to the most recent one
  getLastSelectedProgram().then((lastSelectedProgram) => {
    const programDropdown = document.getElementById('programDropdown');
    const options = Array.from(programDropdown.options);
    if (options.some(option => option.value === lastSelectedProgram)) {
      programDropdown.value = lastSelectedProgram;
    }
  });

  // when the program is changed we want to update the last selected program
  document.getElementById('programDropdown').addEventListener('change', function() {
    browser.storage.local.set({"lastSelectedProgram": this.value});
    console.log("Changing the last selected program to " + this.value);
  });
  
  // add functionality to the test case button
  const addTestCaseButton = document.getElementById('addTestCaseButton');
  const addProgramButton = document.getElementById('addProgramButton');

    // Event listener for the button click
    addTestCaseButton.addEventListener('click', function() {
        addTestCaseForProgram();
        window.close();
    });

    addProgramButton.addEventListener('click', function() {
      addProgram();
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

const writeAllProgramData = (allProgramData) => {
  browser.storage.local.set({allProgramData});
}

function addProgram() {
  const programName = prompt("Enter program name: ");
  readAllProgramData().then((allProgramData) => {
    console.log(allProgramData);
    if (!(programName in allProgramData)) {
      console.log("Adding " + programName);
      allProgramData[programName] = {
        "notes": "",
        "domains": {}
      };
      console.log(allProgramData);
      writeAllProgramData(allProgramData);
      populateProgramDropdown(allProgramData);
    }
  });
}





// Function to handle selection of a test case
function addTestCaseForProgram() {
  const selectedTestCase = document.getElementById("testCaseDropdown").value;
  const programName = document.getElementById("programDropdown").value
  if (selectedTestCase && programName) {
    readAllTestCaseData().then((allTestCaseData) => {
      const testCaseData = allTestCaseData[selectedTestCase];
      url = currentTabUrl;

      console.log("Adding test case for " + url);
      const domain = currentDomain;
      console.log("Domain is " + domain);
      readAllProgramData().then((allProgramData) => {
        if(!(domain in allProgramData[programName]["domains"])) {
          // todo: maybe add a warning, might be out of scope
          allProgramData[programName]["domains"][domain] = {
            "notes": "",
            "is_explored": false,
            "is_tested": false,
            "is_authenticated": true,
            "testcases": {}
          };
        }
        const testCaseId = generateId();
        allProgramData[programName]["domains"][domain]["testcases"][testCaseId] = {
          "id": testCaseId,
          "title": testCaseData["title"],
          "url": url,
          "notes": "",
          "done": false,
          "tasks": {}
        };
        for (task of testCaseData["tasks"]) {
          const taskId = generateId();
          allProgramData[programName]["domains"][domain]["testcases"][testCaseId]["tasks"][taskId] = {
            "id": taskId,
            "title": task["title"],
            "done": false,
            "notes": "",
            "instructions": task["instructions"] || [],
            "findingTemplate": task["findingTemplate"] || "",
            "isFinding": false
          };
        }
        writeAllProgramData(allProgramData);
      });
    });
  }
};

function generateId() {
  return crypto.randomUUID();
}



