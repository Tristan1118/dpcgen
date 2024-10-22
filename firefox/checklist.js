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

function modifyProgramData(keysArray, value) {
    readAllProgramData().then((allProgramData) => {
        let current = allProgramData;

        // Traverse through the keys except the last one
        for (let i = 0; i < keysArray.length - 1; i++) {
            current = current[keysArray[i]];
        }

        // Update the last key with the new value
        current[keysArray[keysArray.length - 1]] = value;

        writeAllProgramData(allProgramData);

    })
}

function debounceNotes(func) {
    // currently not in use. Could be added for performance
    return func;
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), 10);
    };
}

// Function to escape < and > characters
function escapeHtml(code) {
    return code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function copyToClipboard(text) {
    // unescape html
    code = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    navigator.clipboard.writeText(code)
        .then(() => {
            console.log('Text copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}


// populate program dropdown menu
function populatePrograms() {
    const programDropdown = document.getElementById('programSelect');
    readAllProgramData().then((allProgramData) => {
        for (const program in allProgramData) {
            const option = document.createElement('option');
            option.value = program;
            option.text = program;
            programDropdown.appendChild(option);
        };
    });
    
}

// runs on program selection to update checklist
function selectProgram() {
    const programName = document.getElementById('programSelect').value;
    console.log("Selected Program: " + programName);
    populateTestCases(programName)
    populateProgramNotes(programName)
    clearTestCaseChecklist();
}


function populateProgramNotes(programName) {
    readAllProgramData().then((allProgramData) => {
        const noteSection = document.getElementById('notes-programNotes');
        const newNoteSection = noteSection.cloneNode(true);
        newNoteSection.value = allProgramData[programName]["notes"];;
        newNoteSection.addEventListener('input', debounceNotes(function() {
            modifyProgramData([programName, "notes"], this.value);
        }));
        document.getElementById('notes-programNotes').parentNode.replaceChild(newNoteSection, noteSection);
        document.getElementById('program-tablink').innerHTML = programName;
    });
}


function populateDomainNotes(programName, domain) {
    console.log("populating notes for " + domain);
    readAllProgramData().then((allProgramData) => {
        const noteSection = document.getElementById('notes-domainNotes');
        const newNoteSection = noteSection.cloneNode(true);
        newNoteSection.value = allProgramData[programName]["domains"][domain]["notes"];;
        newNoteSection.addEventListener('input', debounceNotes(function() {
            console.log("Updating notes for " + domain);
            modifyProgramData([programName, "domains", domain, "notes"], this.value);
        }));
        document.getElementById('notes-domainNotes').parentNode.replaceChild(newNoteSection, noteSection);
        document.getElementById('domain-tablink').innerHTML = domain;
    });
}

// returns a unique identifier for a domain that can be used as HTML class
function getDomainDivId(domain) {
    const hash = CryptoJS.MD5(domain).toString();
    const domainDivId = `test-domain-${hash}`;
    return domainDivId;
}

// populates test case checklist for a program
function populateTestCases(programName) { readAllProgramData().then((allProgramData) => {
    const allSubDomainData = allProgramData[programName]["domains"]
    const testCaseSection = document.getElementById('testCases');

    var testCaseDivs = [];
    for (const domain in allSubDomainData) {
        const domainDivId = getDomainDivId(domain);
        testCaseDivs.push(`<div class="test-domain" id="${domainDivId}">${domain}</div>`);
        for (const testCaseId in allSubDomainData[domain]["testcases"]) {
            const testCaseTitle = allSubDomainData[domain]["testcases"][testCaseId]["title"];
            const testCaseUrl = allSubDomainData[domain]["testcases"][testCaseId]["url"];
            testCaseDivs.push(`<div class="test-case" id="test-case-${testCaseId}"><input type="checkbox" id="checkbox-${testCaseId}">${testCaseTitle}</div>`);
        }
    }

    // add divs to document
    const testCaseDivsJoined = testCaseDivs.join(' ');
    testCaseSection.innerHTML = `<h3>Test Cases</h3>` + testCaseDivsJoined;
    console.log(testCaseDivsJoined);


    // add actions
    for (const domain in allSubDomainData) {
        // notes event handler for each domain
        const domainDivId = getDomainDivId(domain);
        document.getElementById(domainDivId).addEventListener('click', function () {populateDomainNotes(programName, domain)});
        for (const testCaseId in allSubDomainData[domain]["testcases"]) {
            // "done" button
            const testCaseDone = allSubDomainData[domain]["testcases"][testCaseId]["done"];
            document.getElementById(`checkbox-${testCaseId}`).checked = testCaseDone;
            document.getElementById(`checkbox-${testCaseId}`).addEventListener('change', closureUpdateTestCaseDoneHandler(programName, domain, testCaseId));
            // select test case
            document.getElementById(`test-case-${testCaseId}`).addEventListener('click', closureSelectTestCaseHandler(programName, domain, testCaseId));
        }
    }
});}



function clearTestCaseChecklist() {
    document.querySelector('#checklistSection h3').innerHTML = `Select test case`;
    const checklistItemsSection = document.getElementById('checklistItems');
    checklistItemsSection.innerHTML = '';
}


function selectTestCase(programName, domain, testCaseId) { readAllProgramData().then((allProgramData) => {
    // insert title
    const testCaseData = allProgramData[programName]["domains"][domain]["testcases"][testCaseId];
    document.querySelector('#checklistSection h3').innerHTML = `Checklist for ${testCaseData["title"]} on <a href=${testCaseData["url"]} target="_blank">${testCaseData["url"]}</a>`;

    // Clear the checklistItems
    const checklistItemsSection = document.getElementById('checklistItems');
    checklistItemsSection.innerHTML = '';

    // Add general notes on testcase
    checklistItemsSection.innerHTML += `
    <div class="checklist-textarea">
        <textarea id="notes-${testCaseId}" style="resize: none;">${testCaseData["notes"]}</textarea>
    </div>`;

    document.getElementById(`notes-${testCaseId}`).addEventListener('input', debounceNotes(function() {
        modifyProgramData([programName, "domains", domain, "testcases", testCaseId, "notes"], this.value);
    }));

    // Add the individual tasks
    for (taskId in testCaseData["tasks"]) {
        task = testCaseData["tasks"][taskId];
        taskTitle = task["title"];
        taskInstructions = task["instructions"];
        taskDone = task["done"];
        taskNotes = task["notes"];
        taskDiv = document.createElement('div');
        taskDiv.className = 'checklist-item';

        instructionHTML = '';
        taskInstructions.forEach((instruction, i) => {
            instructionHTML += `
            <div class="instruction">
            <pre id="pre-${taskId}-${i}">${escapeHtml(instruction)}
            <button class="copy-button" id="button-${taskId}-${i}">📋</button>
            </pre>
            </div>
            `
        });

        taskDiv.innerHTML = `
            <details><summary><label>
                <input type="checkbox" id="checkbox-${taskId}}">
            </label>${taskTitle}</summary>
            ${instructionHTML}
            <textarea class="checklist-textarea" id="notes-${taskId}" placeholder="Notes..." style="resize: vertical;">${taskNotes}</textarea>
            </details>
        `;
        checklistItemsSection.appendChild(taskDiv);

        // add event handler
        taskInstructions.forEach((instruction, i) => {
            document.getElementById(`button-${taskId}-${i}`).addEventListener('click', function() {copyToClipboard(instruction)});
        });



        // check checkbox if task is done
        document.getElementById(`checkbox-${taskId}}`).checked = taskDone;
        document.getElementById(`checkbox-${taskId}}`).addEventListener('change', closureUpdateStatusHandler(programName, domain, testCaseId, taskId));
        document.getElementById(`notes-${taskId}`).addEventListener('input', debounceNotes(closureUpdateNotesHandler(programName, domain, testCaseId, taskId)));

        // update notes
        populateDomainNotes(programName, domain);
    }
});}

// closure pattern https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
function closureUpdateStatusHandler(programName, domain, testCaseId, taskId) { 
    return function() {
        readAllProgramData().then((allProgramData) => {
            modifyProgramData([programName, "domains", domain, "testcases", testCaseId, "tasks", taskId, "done"], this.checked);
        });
    }
}

// closure pattern https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
function closureUpdateNotesHandler(programName, domain, testCaseId, taskId) {
    return function() {
        readAllProgramData().then((allProgramData) => {
            modifyProgramData([programName, "domains", domain, "testcases", testCaseId, "tasks", taskId, "notes"], this.value);
        });
    }
}

// closure pattern https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
function closureSelectTestCaseHandler(programName, domain, testCaseId) {
    return function() {
        selectTestCase(programName, domain, testCaseId);
    }
}

// closure pattern https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
function closureUpdateTestCaseDoneHandler(programName, domain, testCaseId) {
    return function() {
        readAllProgramData().then((allProgramData) => {
            modifyProgramData([programName, "domains", domain, "testcases", testCaseId, "done"], this.checked);
        });
    }
}

function importProject(jsonData) {
    // assume that the json is well formatted
    const programName = Object.keys(jsonData)[0];
    readAllProgramData().then((allProgramData) => {
        if (programName in allProgramData) {
            alert("Program already exists, aborting import");
        }
        else {
            allProgramData[programName] = jsonData[programName];
            writeAllProgramData(allProgramData);
            location.reload();
        }
    })
}

function exportProject(programName) {
    readAllProgramData().then((allProgramData) => {
        console.log(programName);
        if (!(programName in allProgramData)) {
            alert("Program doesn't exist, aborting export");
            return {};
        }
        else {
            console.log(JSON.stringify(allProgramData[programName], null, 2))
            return allProgramData[programName];
        }
    });
}



function confirmAndDeleteProject() {
    // Show a confirmation dialog
    const confirmed = confirm("Are you sure you want to delete this? This action cannot be undone.");
    
    // If the user confirms, proceed with the delete action
    if (confirmed) {
        const programName = document.getElementById('programSelect').value;
        readAllProgramData().then((allProgramData) => {
            if (programName in allProgramData) {
                delete allProgramData[programName];
                writeAllProgramData(allProgramData);
            }
        });
        location.reload();
    }
}

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

document.addEventListener("DOMContentLoaded", function() {
    populatePrograms();
    document.getElementById('programSelect').addEventListener('change', selectProgram);
    
    const tabLinks = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');

    tabLinks.forEach(button => {
        button.addEventListener('click', function () {
            const tabId = this.dataset.tab;

            // Hide all tab contents and remove 'active' class from all buttons
            tabContents.forEach(content => content.style.display = 'none');
            tabLinks.forEach(btn => btn.classList.remove('active'));

            // Show the current tab content and mark the clicked button as active
            document.getElementById(tabId).style.display = 'block';
            this.classList.add('active');
        });
    });

    // Set default tab
    document.querySelector('[data-tab="tab1"]').click();

    // by default, set the current program to the most recent one
  getLastSelectedProgram().then((lastSelectedProgram) => {
    console.log("Last selected program was: " + lastSelectedProgram);
    const programDropdown = document.getElementById('programSelect');
    const options = Array.from(programDropdown.options);
    if (options.some(option => option.value === lastSelectedProgram)) {
      programDropdown.value = lastSelectedProgram;
    }
    selectProgram();
  });
  

  document.getElementById('programSelect').addEventListener('change', function() {
    browser.storage.local.set({"lastSelectedProgram": this.value});
    console.log("Changing the last selected program to " + this.value);
  });


  // delete button
  document.getElementById('deleteproject').addEventListener('click', function () {
    confirmAndDeleteProject();
  });

  // import button
  document.getElementById('import').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (!file) {
      alert("No file selected.");
      return;
    }
    
    const reader = new FileReader();
    
    // When the file is loaded
    reader.onload = function(e) {
      try {
        const jsonData = JSON.parse(e.target.result);
        console.log("Imported JSON data:", jsonData);
        importProject(jsonData);
      } catch (error) {
        alert("Invalid JSON format.");
      }
    };
    
    // Read the file as text
    reader.readAsText(file);
  });

  // export button
  document.getElementById('export').addEventListener('click', function() {
    const programName = document.getElementById('programSelect').value;
    console.log("Exporting " + programName);
    readAllProgramData().then((allProgramData) => {
        console.log(programName);
        if (!(programName in allProgramData)) {
            alert("Program doesn't exist, aborting export");
        }
        else {
            const jsonData = JSON.stringify({[programName]: allProgramData[programName]}, null, 2);
            // Create a Blob from the JSON string
            const blob = new Blob([jsonData], { type: "application/json" });

            // Create a download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${programName}.json`; // The file name for the download

            // Append the link to the body (necessary for Firefox)
            document.body.appendChild(link);

            // Programmatically click the link to trigger the download
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);
        }
    });
  });
});


