<?php
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_DEFAULT_1"] = "Test author";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_DEFAULT_2"] = "Test bot";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_DESCRIPTION_1"] = "This agent will help you test your team's knowledge and save time on reviewing results. All you have to do is tell the agent what kind of test you require. The agent will come up with questions for the test and send the test to the employees. The employee will take the test by communicating with the agent in the chat. The agent will ask questions, check the answers, and send a report to the employee's superior.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_MESSAGE_1"] = "Hello! I am ready to help you assess employee knowledge. Please tell me the topic or area of expertise that needs to be evaluated. I'll create questions for the test.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_MESSAGE_2"] = "You have a new test to take from {=A4769_8071_8996_8194:SenderId > bbcode} on {=A9692_4897_2126_2020:topic}. Please let me know when you are ready to begin the test.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_MESSAGE_3"] = "The employee has completed the test. {=A9654_3504_4807_2932:SenderId > friendly}
Result:
{=A1535_5119_7045_4611:results_of_test}";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_MESSAGE_4"] = "Error processing request. Please try again later.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_MESSAGE_5"] = "There are currently no active tests available.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_1"] = "Employee knowledge assessment agent";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_2"] = "The name of the chat bot that will create tests:";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_3"] = "Show this agent to users:";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_4"] = "The name of the chat bot that will test the employees:";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_5"] = "Record symbolic code";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_6"] = "Field code:Test name";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_7"] = "Field code:Test questions";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_8"] = "Field code:Test author";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_9"] = "Test name";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_10"] = "Test questions";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_NAME_11"] = "Test author";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_STORAGETITLE_1"] = "Test storage";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_SYSTEMPROMPT_1"] = "You are a data collection and test authoring assistant. Your task is to collect the source data, create and confirm the required number of test questions.

**STEP 1: DATA COLLECTION**

Analyze `chatHistory` and {user's response}. Make sure the data below is available:
1. **Topic** (the test topic)
2. **Quantity** (total number of questions in the test)
3. **Employees** (mentions of the employees to be tested, [USER=ID])

**Rules for responding at this step:**
- **If any of the 3 items is missing**, ask ONLY for the missing data. Do not mention things you already have. Do not proceed to STEP 2.
- **If all 3 items are collected**:
-- questions_is_approved = false
-- Generate a list of {Quantity} questions in the format: {question number}. Question:{question} Answer:{answer}\\n
-- In the next message, provide the list of questions
-- In the next message, ask if all the questions are satisfactory (Yes/No/Specify the numbers of questions to be created again, or all)

-- GO TO STEP 2

**STEP 2: CONFIRMING QUESTIONS**
1. If you have a positive confirmation:
- questions_is_approved = true
- Proceed to **STEP 3**
2. If you don't have a positive confirmation, or the user replied with the numbers of questions to be created again:
- questions_is_approved = false
- Replace the specified questions by crating new ones
- In the next message, provide the updated list of questions
- In the next message, put an emphasis on the fact that the questions have been updated
-- In the next message, ask if all the questions are satisfactory (Yes/No/Specify the numbers of questions to be created again, or all)

**STEP 3: END**
- Post the final message: \"Test sent to {**Employees**}\".";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_SYSTEMPROMPT_2"] = "STEP 1: TAKING THE TEST
- If there are questions from {test contents} that are not in the chatHistory (ignore all entries in chatHistory followed by the assistant's reply saying the test was completed):
  * is_test_complete = false
  * In the next message, ask the next question, indicate its number, do not respond to the user's answers, do not provide answer options
- If all questions from {test contents} are in the chatHistory (ignore all entries in chatHistory followed by the assistant's reply saying the test was completed):
  * PROCEED TO STEP 2

STEP 2: TEST RESULTS
- Find in chatHistory the assistant's questions from {test content} not followed by the assistant's reply saying the test was completed
- For all questions except the last one, use the user's reply that follows the assistant's question as the answer
- For the last question, use {user's answer} as the answer
- Create test result
  -- For each question
    * Compare the answer with the correct answer from {test content}; if you don't understand the answer or the answer is \"I don't know,\" consider the answer incorrect
    * Add the line: \"[b]{Question number}.[/b][br]Question:{Question}[br]Answer:{Answer}[br]Correct:[b]{Yes/No}[/b][br]Correct answer:{Correct answer}\"
    * Adjust the correct answer counter if needed
    * Adjust the total question counter
  -- Add the line: \"Correct answers: {correct answer counter} out of {total question counter}\"
- Post the final message (format the message in BBCode, use [br] for line breaks):
  * Test completion notification
  * Add the line: \"Correct answers: {correct answer count} out of {total question count}\"
  * Add the line: \"Incorrect answers\"
  * For each question with incorrect answer, show the wrong answer (do not show the correct answers)
- is_test_complete = true

Test contents:
{=A4120_8802_2523_2854:questions}";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TEXT_1"] = "There will be two chat bots. The first one will act as a test author; you will discuss and prepare tests with it. Give it a meaningful name for it (example: \"Sales Department Test Author\").";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TEXT_2"] = "Testing chat bot";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TEXT_3"] = "This chat bot will conduct the employee testing.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_1"] = "Node workflow";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_2"] = "Chat bot received a message";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_3"] = "Send message as chat-bot";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_4"] = "Start AI agent";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_5"] = "Save bot maker";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_6"] = "Save chat bot settings";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_7"] = "Save interviewer bot";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_8"] = "Background";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_9"] = "Write data";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_10"] = "Read data. Actual test.";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_11"] = "Read data";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_12"] = "Delete data";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_13"] = "Edit workflow template parameters";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_14"] = "Condition";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_15"] = "AI agent";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_16"] = "Iterator";
$MESS["BIZPROC_NODES_BITRIX_AI_COACH_TITLE_17"] = "Create storage";
