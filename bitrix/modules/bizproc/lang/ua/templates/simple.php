<?
$MESS["BPT_SM_APPROVE_DESC"] = "Вам необхідно проголосувати за документ \"{=Document:NAME}\".

Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BPT_SM_TASK1_TEXT"] = "Ви повинні затвердити або відхилити документ \"{=Document:NAME}\".
 
Для затвердження документа перейдіть за посиланням #BASE_HREF##TASK_URL#
 
Зміст документа:
{=Document:DETAIL_TEXT}
 
Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BPT_SM_APPROVE_TITLE"] = "Голосування за документ";
$MESS["BPT_SM_MAIL2_SUBJ"] = "Голосування за \"{=Document:NAME}: Документ відхилено";
$MESS["BPT_SM_MAIL1_SUBJ"] = "Голосування за \"{=Document:NAME}: Документ прийнятий";
$MESS["BPT_SM_MAIL2_TEXT"] = "Голосування за документом \"{=Document:NAME}\" завершено. 

Документ відхилений.

Затвердили документ: {=ApproveActivity1:ApprovedCount}
Відхилили документ: {=ApproveActivity1:NotApprovedCount}";
$MESS["BPT_SM_MAIL1_TEXT"] = "Голосування за документом \"{=Document:NAME}\" завершено. 

Документ прийнятий {=ApproveActivity1:ApprovedPercent}% голосів.


Затвердили документ: {=ApproveActivity1:ApprovedCount}
Відхилили документ: {=ApproveActivity1:NotApprovedCount}";
$MESS["BPT_SM_PARAM_NAME"] = "Голосуючі";
$MESS["BPT_SM_MAIL2_TITLE"] = "Документ відхилений";
$MESS["BPT_SM_MAIL1_TITLE"] = "Документ прийнятий";
$MESS["BPT_SM_TASK1_TITLE"] = "Необхідно затвердити документ \"{=Document:NAME}\"";
$MESS["BPT_SM_MAIL2_STATUS"] = "Відхилений";
$MESS["BPT_SM_ACT_NAME_1"] = "Послідовність дій";
$MESS["BPT_SM_TITLE1"] = "Послідовний бізнес-процес";
$MESS["BPT_SM_ACT_TITLE"] = "Поштове повідомлення";
$MESS["BPT_SM_APPROVE_NAME"] = "Проголосуйте, будь ласка, за документ.";
$MESS["BPT_SM_NAME"] = "Просте затвердження/голосування";
$MESS["BPT_SM_PUB"] = "Публікація документа";
$MESS["BPT_SM_DESC"] = "Рекомендується для ситуацій, коли вимагається прийняття рішення простою більшістю голосів. У його рамках можна включити до списку голосуючих потрібних співробітників, дати можливість коментувати своє рішення тим, які голосували. Після закінчення голосування всім учасникам повідомляється прийняте рішення.";
$MESS["BPT_SM_PARAM_DESC"] = "Список користувачів, які беруть участь у голосуванні.";
$MESS["BPT_SM_MAIL2_STATUS2"] = "Статус: Відхилений";
$MESS["BPT_SM_STATUS2"] = "Статус: Затверджений";
$MESS["BPT_SM_STATUS"] = "Затверджений";
?>