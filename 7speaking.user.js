// ==UserScript==
// @name         7Speaking Bot Legacy - BETA
// @namespace    https://github.com/Dixel1
// @version      8.8
// @description  Automatize 7speaking
// @author       quantumsheep & Dixel1
// @match        https://user.7speaking.com/*
// @grant        none
// @help         Juliendnte
// @tuners       Astronas
// ==/UserScript==

// This script is designed to automate the process of completing quizzes and exams on the 7speaking platform.
// It uses a combination of React component traversal and DOM manipulation to find the correct answers and submit them.
// The script is structured to handle different routes on the 7speaking platform, including home, workshop, document, and quiz pages.

// Tuned by Astronas

// [GLOBAL VARIABLES]
// errorProbability: The probability of introducing an error in the answer (0.2 = 20% chance of error)
// useRealTime: Determines whether to use between 60-80% of the recommended real activity time or a fixed time (10s)

const errorProbability = 0.2; // Probability of introducing an error in the answer (put a value between 0 and 1)
let useRealTime = 1; // Variable to determine whether to use between 60-80% of the recommended real activity time or a fixed time (10s) (1 = use real time, 0 = use fixed time)

// Dont change these variables unless you know what you're doing
let realTime = 10; // The fixed time in seconds to wait before clicking the test tab (if useRealTime is set to 0)
let actualTime = 0; // Variable to store the actual time for the quiz or exam, calculated based on the recommended time

(async () => { // Main function to run the script
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); // Function to wait for a specified number of milliseconds

    function isPath(regex) { // Function to check if the current path matches a given regular expression
        return regex.test(location.pathname); // Check if the current pathname matches the regex
    }

    function error(message) { // Function to handle errors
        alert(message); // Display an alert with the error message
        throw new Error(message); // Throw an error with the message
    }

    async function waitForQuerySelector(selector) { // Function to wait for a specific element to be available in the DOM
        console.log(`Waiting for querySelector('${selector}')`) // Log the selector being waited for

        return new Promise(resolve => { // Return a promise that resolves when the element is found
            const interval = setInterval(() => { // Set an interval to check for the element every second
                const e = document.querySelector(selector); // Query the DOM for the element

                if (e) { // If the element is found
                    clearInterval(interval); // Clear the interval to stop checking
                    resolve(e); // Resolve the promise with the found element
                }
            }, 1000); // Check every second for the element
        }); // End of waitForQuerySelector function
    }

    async function handlePopup() { // Function to handle popups that may appear during the quiz or exam
        const popup = await waitForQuerySelector('.MuiDialog-container').catch(() => null); // Wait for the popup element to be available, or return null if not found
        if (popup) { // If a popup is detected
            console.log('Popup détectée'); // Log that a popup is detected

            const continueButton = popup.querySelector('.MuiDialogActions-root button'); // Try to find the "Continue" button in the popup
            if (continueButton) { // If the "Continue" button is found
                console.log('"Continue" button found'); // Log that the "Continue" button is found
                continueButton.click(); // Click the "Continue" button to proceed
                console.log('"Continue" button clicked'); // Log that the "Continue" button is clicked
            } else { // If the "Continue" button is not found
                console.error('"Continue" button not found'); // Log an error that the "Continue" button is not found
            }
        } else { // If no popup is detected
            console.log('No popup found'); // Log that no popup is detected
        } // End of handlePopup function
    }

    function parseTime(text) { // Function to parse the recommended activity time from a string
        const regex = /(\d+)(min|h)/; // Regular expression to match the time format (e.g., "30min" or "1h")
        const match = text.match(regex); // Match the text against the regular expression
        if (match) { // If a match is found
            const value = parseInt(match[1]); // Extract the numeric value from the match
            const unit = match[2]; // Extract the unit (either "min" or "h") from the match
            switch (unit) { // Switch case to handle different time units
                case 'min': // If the unit is "min"
                    return value * 60; // Convert minutes to seconds
                case 'h': // If the unit is "h"
                    return value * 3600; // Convert hours to seconds
                default: // If the unit is not recognized
                    throw new Error(`Non-supported time format : ${unit}`); // Throw an error for unsupported time units
            }
        } else { // If no match is found
            throw new Error(`Format de temps non reconnu : ${text}`); // Throw an error for unrecognized time format
        } // End of parseTime function
    }

    function handleTime() {
        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                const durationCounter = document.querySelector('.durationCounter p.MuiTypography-body1');
                if (durationCounter) {
                    clearInterval(intervalId);
                    const recommendedTimeText = durationCounter.textContent;
                    const recommendedTime = parseTime(recommendedTimeText);

                    const minTime = recommendedTime * 0.6;
                    const maxTime = recommendedTime * 0.8;
                    const actualTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

                    console.log(`Temps recommandé : ${recommendedTime} secondes`);
                    console.log(`Temps réel : ${actualTime} secondes`);

                    resolve(actualTime);
                }
            }, 100); // Vérifie toutes les 100ms
        });
    }

    function getReactElement(e) { // Function to get the React element from a DOM element
        for (const key in e) { // Iterate over the properties of the DOM element
            if (key.startsWith('__reactFiber$')) { // Check for the React internal instance property
                return e[key]; // Return the React element if found
            }
        }

        return null; // Return null if no React element is found
    }

    async function completeQuiz() { // Function to complete the quiz
        console.log(`Starting quiz completion...`); // Log the start of the quiz completion process

        async function findAnswer() { // Function to find the answer in the React component tree
            const e = await waitForQuerySelector('.question-container'); // Wait for the question container to be available
            let container = getReactElement(e); // Get the React element from the question container

            while (container) { // Traverse the React component tree
                if (container.pendingProps.children[5].props.children[0].props.children.props.answer) { // Check if the component has an answer
                    return String(container.pendingProps.children[5].props.children[0].props.children.props.answer); // Return the answer as a string
                } 
                if (container.memoizedProps.children[5].props.children[0].props.children.props.answerOptions.answer[0].value) { // Check if the component has answer options
                    return String(container.memoizedProps.children[5].props.children[0].props.children.props.answerOptions.answer[0].value); // Return the first answer option value as a string
                } 

                container = container.return; // Move up the React component tree
            }

            return null; // Return null if no answer is found
        }

        function getInputElement(answer) { // Function to get the input element based on the answer
            let e = document.querySelector('.question__form input'); // Try to find an input element in the question form

            if (!e) { // If no input element is found, try to find a textarea element
                e = document.querySelector('.question__form textarea'); // Try to find a textarea element in the question form
            }

            if (e) { // If an input or textarea element is found
                return { // Return an object with the element and its type
                    element: e, // The input or textarea element
                    type: 'input' // The type of the element is 'input'
                }; // End of input element found
            }

            const buttons = document.querySelectorAll('.answer-container button'); // Get all button elements in the answer container

            for (const button of buttons) { // Iterate over each button
                if (button.querySelector('.question__customLabel').innerText.trim() === answer.trim()) { // Check if the button's label matches the answer
                    return { // Return an object with the button element and its type
                        element: button, // The button element
                        type: 'button' // The type of the element is 'button'
                    }; // End of button element found
                }
            }

            return null; // Return null if no input or button element is found
        }

        function getSubmitButton() { // Function to get the submit button element
            return document.querySelector('.question__form button[type=submit]'); // Try to find a submit button in the question form
        }

        console.log('Searching for the answer...'); // Log the start of the answer search
        // Find the answer in the React component tree

        const answer = await findAnswer(); // Call the findAnswer function to get the answer

        if (answer === null || answer === undefined) { // Check if the answer is null or undefined
            return error("Can't find answer"); // If no answer is found, throw an error
        }

        console.log(`Answer is "${answer}"`); // Log the answer

        const input = getInputElement(answer); // Get the input element based on the answer

        if (!input) { // Check if the input element was found
            return error("Can't find input"); // If no input element is found, throw an error
        }

        console.log(`Question type is "${input.type}"`); // Log the type of the input element

        const shouldSimulateError = Math.random() < errorProbability; // Determine if an error should be simulated based on the error probability

        if (input.type === 'input') { // If the input element is an input or textarea
            await wait(2000); // Add a delay before filling the input
            if (shouldSimulateError) { // If an error should be simulated
                const incorrectAnswer = "random"; // Define an incorrect answer ("random") to simulate an error
                for (let i = 0; i < incorrectAnswer.length; i++) { // Iterate over each character in the incorrect answer
                    input.element.focus(); // Focus on the input element
                    document.execCommand('insertText', false, incorrectAnswer[i]); // Insert the character into the input element
                    await wait(Math.random() * (400 - 100) + 100); // Add a random delay between 100ms and 400ms after each character insertion
                }
                console.log(`Simulated error: entered "${incorrectAnswer}" instead of "${answer}"`); // Log the simulated error with the incorrect answer
            } else { // If no error should be simulated
                for (let i = 0; i < answer.length; i++) { // Iterate over each character in the answer
                    input.element.focus(); // Focus on the input element
                    document.execCommand('insertText', false, answer[i]); // Insert the character into the input element
                    await wait(Math.random() * (400 - 100) + 100); // Add a random delay between 100ms and 400ms after each character insertion
                }
            }
            input.element.blur(); // Blur the input element after filling it
            await wait(Math.random() * (8000 - 3000) + 3000); // Add a delay after filling the input
        } else if (input.type === 'button') { // If the input element is a button
            if (shouldSimulateError) { // If an error should be simulated
                const buttons = document.querySelectorAll('.answer-container button'); // Get all button elements in the answer container
                const incorrectButtonIndex = Math.floor(Math.random() * buttons.length); // Randomly select an index for the incorrect button
                const incorrectButton = buttons[incorrectButtonIndex]; // Get the incorrect button element based on the random index
                if (incorrectButton !== input.element) { // If the incorrect button is not the same as the correct button
                    incorrectButton.click(); // Click the incorrect button to simulate an error
                    console.log(`Simulated error: clicked on incorrect button`); // Log the simulated error with the incorrect button
                } else { // If the incorrect button is the same as the correct button
                    if (buttons.length > 1) { // Check if there are multiple buttons available
                        const anotherButtonIndex = (incorrectButtonIndex + 1) % buttons.length; // Calculate the index of another button to click
                        const anotherButton = buttons[anotherButtonIndex]; // Get the another button element based on the calculated index
                        anotherButton.click(); // Click the another button to simulate an error
                        console.log(`Simulated error: clicked on another button`); // Log the simulated error with the another button
                    }
                }
            } else { // If no error should be simulated
                input.element.click(); // Click the button element to submit the answer
            }
        }

        handlePopup(); // Call the handlePopup function to handle any popups that may appear

        await wait(Math.random() * (300 - 200) + 200); // Add a small delay after filling the input or clicking the button

        const button = getSubmitButton(); // Get the submit button element

        if (!button) { // Check if the submit button was found
            return error("Can't find submit button"); // If no submit button is found, throw an error
        } 

        console.log(`Clicking "Validate" button`); // Log the action of clicking the "Validate" button
        // Uncomment the next line to add a random delay before clicking the "Validate" button

        // await wait(Math.random() * 120000); // Random delay between 0-2 mins before clicking "Validate"

        button.click(); // Click the "Validate" button

        await wait(Math.random() * (1500 - 1000) + 1000); // Add delay after clicking "Validate"

        console.log(`Clicking "Next" button`); // Click the "Next" button

        button.click(); // Click the "Next" button again (this is usually the same button as "Validate")

        await wait(Math.random() * (600 - 400) + 400); // Add a small delay after clicking "Next"
        console.log(`Waiting for the next question...`); // Log the action of waiting for the next question
    }

    async function completeExam() { // Function to complete the exam
        async function findAnswer() { // Function to find the answer in the React component tree
            const e = await waitForQuerySelector('.question_content'); // Wait for the question content to be available
            let container = getReactElement(e); // Get the React element from the question content

            while (container) { // Traverse the React component tree
                if (container.memoizedProps && container.memoizedProps.questions) { // Check if the component has questions
                    const [question] = container.memoizedProps.questions; // Get the first question from the questions array

                    if (question.needorder) { // Check if the question requires ordering of answers
                        console.log(`Question requires ordering of answers`);
                        const options = {}; // Initialize an empty object to store the ordered answers

                        for (const k in question.answer) { // Iterate over the answer keys
                            options[k] = question.answer[k].sort((a, b) => a - b); // Sort the answers in ascending order
                        }

                        return options; // Return the ordered answers
                    }

                    return question.answer; // Return the answer of the question
                }

                container = container.return; // Move up the React component tree
            }

            return null; // Return null if no answer is found
        } // End of findAnswer function

        const answer = await findAnswer(); // Call the findAnswer function to get the answer

        if (answer === null || answer === undefined) { // Check if the answer is null or undefined
            const submitButton = document.querySelector('.buttons_container button:last-child'); // Try to find the submit button in the buttons container

            if (!submitButton) { // Check if the submit button was found
                return error("Can't find answer"); // If no submit button is found, throw an error
            } else { // If the submit button is found
                submitButton.click(); // Click the submit button
                await wait(Math.random() * (2000 - 1000) + 1000); // Add a delay after clicking the submit button
            } 
        } else { // If an answer is found
            if (typeof answer === 'object') { // Check if the answer is an object (indicating multiple answers)
                const optionsAreTypeof = (type) => Object.values(answer).every(options => options.every(option => typeof option === type)) ; // Function to check if all options are of a specific type
                console.log(`Answer is an object with ${Object.keys(answer).length} keys`); // Log the number of keys in the answer object

                if (optionsAreTypeof('boolean')) { // Check if all options are booleans
                    console.log(`Options are booleans`); // Log that the options are booleans

                    const lines = [...document.querySelectorAll('.question_variant tbody tr')]; // Get all table rows in the question variant

                    for (const i in lines) { // Iterate over each line in the question variant
                        const inputs = lines[i].querySelectorAll('td input'); // Get all input elements in the current line

                        for (const j in answer) { // Iterate over each answer key
                            const input = inputs[+j - 1]; // Get the input element for the current answer key

                            if (answer[j][i]) { // Check if the answer for the current key and line is true
                                input.click(); // Click the input element if the answer is true
                            }
                        }
                    }
                } else if (optionsAreTypeof('string') || optionsAreTypeof('number')) { // Check if all options are strings or numbers
                    console.log(`Options are strings/numbers`); // Log that the options are strings or numbers

                    const columns = [...document.querySelectorAll('.question_variant tbody tr td')]; // Get all table cells in the question variant

                    for (const i in answer) { // Iterate over each answer key
                        const inputs = columns[+i - 1].querySelectorAll('input'); // Get all input elements in the current column

                        for (const j in answer[i]) { // Iterate over each answer in the current key
                            const input = getReactElement(inputs[j]); // Get the React element for the current input

                            input.memoizedProps.onChange({ // Trigger the onChange event for the input element
                                target: { // Set the target of the event
                                    value: answer[i][j].toString(), // Set the value of the input to the current answer
                                },
                            });
                        }
                    }
                } else {
                    return error(`Can't understand this type of options`); // If the options are neither booleans, strings, nor numbers, throw an error
                }

                await wait(Math.random() * (2000 - 1000) + 1000); // Add a delay after filling the inputs
            } else {
                const inputs = document.querySelectorAll('.question_variant label'); // Get all label elements in the question variant

                if (isNaN(answer)) { // Check if the answer is not a number (indicating multiple choice options)
                    const options = answer.split(','); // Split the answer string by commas to get the individual options

                    for (const option of options) { // Iterate over each option in the answer
                        inputs[option.charCodeAt(0) - 'A'.charCodeAt(0)].click(); // Click the input element corresponding to the option (A, B, C, etc.)
                    }
                } else { // If the answer is a number (indicating a single choice option)
                    inputs[+answer - 1].click(); // Click the input element corresponding to the answer number
                }
            }

            const submitButton = await waitForQuerySelector('.buttons_container button:last-child'); // Wait for the submit button to be available

            submitButton.click(); // Click the submit button to submit the answers
            await wait(Math.random() * (2000 - 1000) + 1000); // Add a delay after clicking the submit button

            submitButton.click(); // Click the submit button again to confirm the submission
            await wait(Math.random() * (2000 - 1000) + 1000); // Add a delay after clicking the submit button again
        }
    }

    async function routes() { // Function to handle different routes on the 7speaking platform
        console.log(`Analysing current route`); // Log the current route being analyzed

        if (isPath(/^\/home/)) { // Check if the current path is /home
            console.log(`Current route is /home`); // Log that the current route is /home

            console.log(`Selecting the first content...`); // Log the action of selecting the first content

            const e = await waitForQuerySelector('.scrollableList .scrollableList__content .MuiButtonBase-root'); // Wait for the first content button to be available
            e.click(); // Click the first content button

        } else if (isPath(/^\/workshop\/exams-tests/)) { // Check if the current path is /workshop/exams-tests
            const search = new URLSearchParams(location.search); // Get the search parameters from the current URL

            if (search.has('id')) { // Check if the search parameters contain an 'id'
                await completeExam(); // Call the completeExam function to complete the exam
            } else { // If the search parameters do not contain an 'id'
                const nextExam = await waitForQuerySelector('.lists .list__items.active'); // Wait for the next exam button to be available
                nextExam.click(); // Click the next exam button

                await wait(Math.random() * (600 - 300) + 300); // Add a small delay after clicking the next exam button

                const modalConfirmButton = document.querySelector('.confirmCloseDialog__buttons button:last-child'); // Try to find the confirm button in the modal dialog

                if (modalConfirmButton) { // Check if the confirm button was found
                    modalConfirmButton.click(); // Click the confirm button to proceed
                }

                await wait(Math.random() * (3000 - 1000) + 1000); // Add a delay after clicking the confirm button
            }
        } else if (isPath(/^\/workshop/)) { // Check if the current path is /workshop
            console.log(`Current route is /workshop`); // Log that the current route is /workshop

            await waitForQuerySelector('.banner'); // Wait for the banner element to be available

            const buttons = document.querySelectorAll('.bottom-pagination .pagination button'); // Get all button elements in the bottom pagination

            if (buttons.length > 0) { // Check if there are any buttons in the bottom pagination
                buttons[buttons.length - 1].click(); // Click the last button in the bottom pagination
            }

            let quizButton = document.querySelector('.category-action-bottom button'); // Try to find the quiz button in the category action bottom

            if (!quizButton) { // If the quiz button is not found in the category action bottom
                quizButton = document.querySelector('button.cardMode__goToQuiz:not(.finalCard__btns button)'); // Try to find the quiz button in the card mode
            }

            if (!quizButton) { // If the quiz button is still not found
                console.log("Can't find quiz button, returning to /home"); // Log that the quiz button cannot be found and returning to /home
                location.href = '/home'; // Redirect to /home
                throw new Error(); // Throw an error to stop further execution
            }

            quizButton.click(); // Click the quiz button to start the quiz
        } else if (isPath(/^\/document\/\d+/)) { // Check if the current path is /document followed by a number
            console.log(`Current route is /document`); // Log that the current route is /document

            const e = await waitForQuerySelector('.appBarTabs__testTab'); // Wait for the test tab element to be available

            if (useRealTime === 1) { // If useRealTime is set to 1, calculate the actual time for the quiz or exam
                actualTime = await handleTime(); // Call the handleTime function to get the actual time for the quiz or exam
                
                // Simulate clicking the script button to open the script
                const scriptButton = document.querySelector('.videoControls__rightContent .icon__iconButton'); // Try to find the script button in the video controls right content
                if (scriptButton) { // If the script button is found
                    scriptButton.click(); // Click the script button to open the script
                    console.log('Bouton "Script" cliqué'); // Log that the script button is clicked
                } else { // If the script button is not found
                    console.error('Bouton "Script" non trouvé'); // Log an error that the script button is not found
                }

                console.log(`Using 60-80% real time ... waiting for ${actualTime} seconds before clicking the test tab`); // Log the waiting time before clicking the test tab
                await wait(actualTime * 1000); // Wait for the actual time before clicking the test tab
            } else {
                console.log(`Not using real time, waiting for ${realTime} seconds before clicking the test tab`); // Log the waiting time before clicking the test tab
                await wait(realTime * 1000); // Wait for the specified real time before clicking the test tab
            }

            // If useRealTime is set to 1, wait for the actual time before clicking the test tab (60-80% of the recommended time), simulating real user activity :)

            e.click(); // Click the test tab to start the test

        } else if (isPath(/^\/quiz/)) { // Check if the current path is /quiz
            console.log(`Current route is /quiz`); // Log that the current route is /quiz

            await waitForQuerySelector('.quiz__container'); // Wait for the quiz container to be available

            if (document.querySelector('.result-container')) { // Check if the result container is present (indicating the quiz is already completed)
                location.href = '/home'; // Redirect to /home if the quiz is already completed
                return
            } else { // If the result container is not present (indicating the quiz is not completed)
                await completeQuiz(); // Call the completeQuiz function to complete the quiz
            }
        }
        await routes(); // Call the routes function recursively to handle the next route
    }

    if (document.readyState === 'complete') { // Check if the document is already fully loaded
        await routes(); // Call the routes function to start handling the current route
    } else { // If the document is not fully loaded
        window.addEventListener('load', async () => { // Add an event listener for the 'load' event to call the routes function when the document is fully loaded
            await routes(); // Call the routes function to start handling the current route
        });
    }
})();

// End of script