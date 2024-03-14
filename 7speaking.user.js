// ==UserScript==
// @name         7Speaking Bot Legacy - BETA
// @namespace    https://github.com/Dixel1
// @version      8.7b1
// @description  Automatize 7speaking
// @author       quantumsheep & Dixel1
// @match        https://user.7speaking.com/*
// @grant        none
// ==/UserScript==

(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    function isPath(regex) {
        return regex.test(location.pathname);
    }

    function error(message) {
        alert(message);
        throw new Error(message);
    }

    async function waitForQuerySelector(selector, interval = 1000) {
        console.log(`Waiting for querySelector('${selector}')`)

        while (true) {
            const e = document.querySelector(selector);

            if (e) {
                return e;
            }

            await wait(interval);
        }
    }

    function getReactElement(e) {
        return Object.values(e).find(key => key.startsWith('__reactInternalInstance$'));
    }

    async function completeQuiz() {
        async function findAnswer() {
            const e = await waitForQuerySelector('.question-container');
            let container = getReactElement(e);

            while (container) {
                if (container.memoizedProps) {
                    return String(container.memoizedProps.children[5].props.children[0].props.children.props.answerOptions.answer[0].value);
                }

                container = container.return;
            }

            return null;
        }

        function getInputElement(answer) {
            const e = document.querySelector('.question__form input') || document.querySelector('.question__form textarea');

            if (e) {
                return {
                    element: e,
                    type: 'input'
                };
            }

            const buttons = Array.from(document.querySelectorAll('.answer-container button'));
            const button = buttons.find(button => button.querySelector('.question__customLabel').innerText.trim() === answer.trim());

            if (button) {
                return {
                    element: button,
                    type: 'button'
                };
            }

            return null;
        }

        function getSubmitButton() {
            return document.querySelector('.question__form button[type=submit]');
        }

        console.log('Searching for the answer...');

        const answer = await findAnswer();

        if (answer === null || answer === undefined) {
            return error("Can't find answer");
        }

        console.log(`Answer is "${answer}"`);

        const input = getInputElement(answer);

        if (!input) {
            return error("Can't find input");
        }

        console.log(`Question type is "${input.type}"`);

        if (input.type === 'input') {
            await wait(2000); // Add delay before filling the input
            for (let i = 0; i < answer.length; i++) {
                input.element.focus();
                document.execCommand('insertText', false, answer[i]);
                await wait(100); // Add a small delay between each character
            }
            input.element.blur(); // Simulate loss of focus
            await wait(Math.random() * (8000 - 3000) + 3000); // Random delay between 3 and 8 seconds
        } else if (input.type === 'button') {
            input.element.click();
        }

        await wait(200);

        const button = getSubmitButton();

        if (!button) {
            return error("Can't find submit button");
        }

        console.log(`Clicking "Validate" button`);

        button.click();

        await wait(1000); // Add delay after clicking "Validate"

        console.log(`Clicking "Next" button`);

        button.click();

        await wait(500);
    }

    async function completeExam() {
        async function findAnswer() {
            const e = await waitForQuerySelector('.question_content');
            let container = getReactElement(e);

            while (container) {
                if (container.memoizedProps && container.memoizedProps.questions) {
                    const [question] = container.memoizedProps.questions;

                    if (question.needorder) {
                        const options = {};

                        for (const k in question.answer) {
                            options[k] = question.answer[k].sort((a, b) => a - b);
                        }

                        return options;
                    }

                    return question.answer;
                }

                container = container.return;
            }

            return null;
        }

        const answer = await findAnswer();

        if (answer === null || answer === undefined) {
            const submitButton = document.querySelector('.buttons_container button:last-child');

            if (!submitButton) {
                return error("Can't find answer");
            } else {
                submitButton.click();
                await wait(1000);
            }
        } else {
            if (typeof answer === 'object') {
                const optionsAreTypeof = (type) => Object.values(answer).every(options => options.every(option => typeof option === type))

                if (optionsAreTypeof('boolean')) {
                    console.log(`Options are booleans`);

                    const lines = Array.from(document.querySelectorAll('.question_variant tbody tr'));

                    lines.forEach((line, i) => {
                        const inputs = line.querySelectorAll('td input');

                        Object.entries(answer).forEach(([j, value]) => {
                            const input = inputs[+j - 1];

                            if (value[i]) {
                                input.click();
                            }
                        });
                    });
                } else if (optionsAreTypeof('string') || optionsAreTypeof('number')) {
                    console.log(`Options are strings/numbers`);

                    const columns = Array.from(document.querySelectorAll('.question_variant tbody tr td'));

                    columns.forEach((column, i) => {
                        const inputs = column.querySelectorAll('input');

                        Object.entries(answer[i]).forEach(([j, value]) => {
                            const input = getReactElement(inputs[j]);

                            input.memoizedProps.onChange({
                                target: {
                                    value: value.toString(),
                                },
                            });
                        });
                    });
                } else {
                    return error(`Can't understand this type of options`);
                }

                await wait(1000);
            } else {
                const inputs = document.querySelectorAll('.question_variant label');

                if (isNaN(answer)) {
                    const options = answer.split(',');

                    options.forEach(option => {
                        inputs[option.charCodeAt(0) - 'A'.charCodeAt(0)].click();
                    });
                } else {
                    inputs[+answer - 1].click();
                }
            }

            const submitButton = await waitForQuerySelector('.buttons_container button:last-child');

            submitButton.click();
            await wait(1000);

            submitButton.click();
            await wait(1000);
        }
    }

    async function routes() {
        console.log(`Analysing current route`);

        if (isPath(/^\/home/)) {
            console.log(`Current route is /home`);

            console.log(`Selecting the first content...`);

            const e = await waitForQuerySelector('.scrollableList .scrollableList__content .MuiButtonBase-root');
            e.click();

            await routes();
        } else if (isPath(/^\/workshop\/exams-tests/)) {
            const search = new URLSearchParams(location.search);

            if (search.has('id')) {
                await completeExam();
                await routes();
            } else {
                const nextExam = await waitForQuerySelector('.lists .list__items.active');
                nextExam.click();

                await wait(300);

                const modalConfirmButton = document.querySelector('.confirmCloseDialog__buttons button:last-child');

                if (modalConfirmButton) {
                    modalConfirmButton.click();
                }

                await wait(1000);

                await routes();
            }
        } else if (isPath(/^\/workshop/)) {
            console.log(`Current route is /workshop`);

            await waitForQuerySelector('.banner');

            const buttons = document.querySelectorAll('.bottom-pagination .pagination button');

            if (buttons.length > 0) {
                buttons[buttons.length - 1].click();
            }

            let quizButton = document.querySelector('.category-action-bottom button');

            if (!quizButton) {
                quizButton = document.querySelector('button.cardMode__goToQuiz:not(.finalCard__btns button)');
            }

            if (!quizButton) {
                console.log("Can't find quiz button, returning to /home");
                location.href = '/home';
                throw new Error();
            }

            quizButton.click();

            await routes();
        } else if (isPath(/^\/document\/\d+/)) {
            console.log(`Current route is /document`);

            const e = await waitForQuerySelector('.appBarTabs__testTab');
            e.click();

            await routes();
        } else if (isPath(/^\/quiz/)) {
            console.log(`Current route is /quiz`);

            await waitForQuerySelector('.quiz__container');

            if (document.querySelector('.result-container')) {
                location.href = '/home';
            } else {
                await completeQuiz();
                await routes();
            }
        }
    }

    if (document.readyState === 'complete') {
        await routes();
    } else {
        window.addEventListener('load', async () => {
            await routes();
        });
    }
})();
