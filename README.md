# 7speaking-bot-legacy
An attempt to automatize [7Speaking](7speaking.com). Works for "My7Speaking" and TOEIC (Trainings + Exams).

## How to install
- Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
- [Click here](https://github.com/Dixel1/7speaking-bot-legacy/raw/main/7speaking.user.js) to install the script or clic "RAW".
![image](https://github.com/Dixel1/7speaking-bot-legacy/assets/63664894/4d7af9cc-8765-4d2f-b4cc-52db5ff5f256)


- Go to [https://user.7speaking.com/home](https://user.7speaking.com/home) or [https://user.7speaking.com/workshop/exams-tests/toeic](https://user.7speaking.com/workshop/exams-tests/toeic) depending on what you want to complete (may not work properly on toeic mode. Please check https://github.com/Dixel1/7speaking-bot-legacy/issues).
- Let the bot do its work.
- Enjoy!

# Changelogs :

Here’s a summary of the changes made to the code:

- Conversion to String: The findAnswer function was modified to convert the response into a string. This adjustment allows handling cases where the response is a number.
- Simulating Keystrokes: When the input type is ‘input’, the code was altered to simulate typing each character of the response. This is achieved using the document.execCommand('insertText', false, answer[i]); method within a loop.
- Random Response Delay: The response delay after entering the answer was adjusted to be random, ranging between 3 and 8 seconds. This is accomplished by using Math.random() to generate a random number, multiplying it by the difference between the maximum and minimum delay, and then adding the minimum delay.

These modifications were implemented to address issues encountered while using the script on the target website. They aim to enhance the script’s compatibility with the specific logic of the website for input detection in form fields.
