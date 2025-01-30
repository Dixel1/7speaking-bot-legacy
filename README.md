# 7speaking-bot-legacy
An attempt to automatize [7Speaking](7speaking.com). Works for "My7Speaking" and TOEIC (Trainings + Exams).

## How to install
- Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
- [Click here](https://github.com/Dixel1/7speaking-bot-legacy/raw/main/7speaking.user.js) to install the script or clic "RAW".
![image](https://github.com/Dixel1/7speaking-bot-legacy/assets/63664894/4d7af9cc-8765-4d2f-b4cc-52db5ff5f256)


- Go to [https://user.7speaking.com/home](https://user.7speaking.com/home) or [https://user.7speaking.com/workshop/exams-tests/toeic](https://user.7speaking.com/workshop/exams-tests/toeic) depending on what you want to complete (may not work properly on toeic mode. Please check https://github.com/Dixel1/7speaking-bot-legacy/issues).
- Let the bot do its work.
- Enjoy!

## Changelogs :

Here’s a summary of the changes made to the code:

1. Metadata Block:
  - Updated the script name to "7Speaking Bot Legacy - BETA" and incremented the version number from 8.5 to 8.7b1. Added a @help field with the value "Juliendnte".
These updates reflect the new **working** beta version thanks to @juliendnte.

2. Function findAnswer in completeQuiz:
- Added a check for container.pendingProps.children[6].props.children[0].props.children.props.answer to retrieve the answer, while retaining the existing check for container.memoizedProps.children[6].props.children[0].props.children.props.answerOptions.answer[0].value.
This makes the script more robust by ensuring it can retrieve the answer from different property paths. Additionally, the response is converted to a string to handle cases where the response is a number.

3. Simulating Keystrokes:
- When the input type is ‘input’, the code was altered to simulate typing each character of the response using document.execCommand('insertText', false, answer[i]); within a loop.
This simulates human typing behavior, making the script's actions appear more natural and reducing the likelihood of detection by automated systems.

4. Random Response Delay:
- Adjusted the response delay after entering the answer to be random, ranging between 3 and 8 seconds. This is accomplished using Math.random() to generate a random number, multiplying it by the difference between the maximum and minimum delay, and then adding the minimum delay.
Adding randomization to delays helps mimic human behavior more closely, making the script's actions less predictable and more natural.

5. Route Handling:
- Moved the recursive call to routes() to the end of the routes function.
This ensures the function is called after all conditions are checked and actions are performed, preventing potential infinite loops or missed route checks.


These modifications were implemented to address issues encountered while using the script on the target website. They aim to enhance the script’s compatibility with the specific logic of the website for input detection in form fields, improve functionality, robustness, and mimic human behavior more effectively.
