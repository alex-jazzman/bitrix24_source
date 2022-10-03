<?
$MESS["BP_DBLA_APPROVE_TEXT"] = "Вам необхідно проголосувати за документ \"{=Document:NAME}\".

Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BP_DBLA_APPROVE2_TEXT"] = "Вам необхідно проголосувати за документ \"{=Document:NAME}\".

Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BP_DBLA_TASK_DESC"] = "Ви повинні затвердити або відхилити документ \"{=Document:NAME}\".
 
Для затвердження документа перейдіть за посиланням #BASE_HREF##TASK_URL#
 
Зміст документа:
{=Document:DETAIL_TEXT}
 
Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BP_DBLA_MAIL2_TEXT"] = "Ви повинні затвердити або відхилити документ \"{=Document:NAME}\".
 
Для затвердження документа перейдіть за посиланням #BASE_HREF##TASK_URL#
 
Зміст документа:
{=Document:DETAIL_TEXT}
 
Автор: {=Document:CREATED_BY_PRINTABLE}";
$MESS["BP_DBLA_NAPP"] = "Голосування за \"{=Document:NAME}: Документ відхилено";
$MESS["BP_DBLA_MAIL3_SUBJ"] = "Голосування за \"{=Document:NAME}: Документ прийнятий";
$MESS["BP_DBLA_NAPP_TEXT"] = "Голосування за документом \"{=Document:NAME}\" завершено.

Документ відхилений.

Затвердили документ: {=ApproveActivity2:ApprovedCount}
Відхилили документ: {=ApproveActivity2:NotApprovedCount}

{=ApproveActivity2:Comments}";
$MESS["BP_DBLA_MAIL3_TEXT"] = "Голосування за документом \"{=Document:NAME}\" завершено.

Документ прийнятий {=ApproveActivity2:ApprovedPercent}% голосів.

Затвердили документ: {=ApproveActivity2:ApprovedCount}
Відхилили документ: {=ApproveActivity2:NotApprovedCount}

{=ApproveActivity2:Comments}";
$MESS["BP_DBLA_NAME"] = "Двохетапне затвердження";
$MESS["BP_DBLA_MAIL_SUBJ"] = "Документ прийнятий на 1-му етапі";
$MESS["BP_DBLA_MAIL2_SUBJ"] = "Необхідно проголосувати за \"{=Document:NAME}\"";
$MESS["BP_DBLA_TASK"] = "Необхідно затвердити документ \"{=Document:NAME}\"";
$MESS["BP_DBLA_NAPP_DRAFT"] = "Відправлений на доопрацювання";
$MESS["BP_DBLA_MAIL4_TEXT"] = "Перший етап затвердження документа \"{=Document:NAME}\" завершено.

Документ відхилено.

{=ApproveActivity1:Comments}";
$MESS["BP_DBLA_MAIL_TEXT"] = "Перший етап затвердження документа \"{=Document:NAME}\" завершено.

Документ прийнято

{=ApproveActivity1:Comments}";
$MESS["BP_DBLA_S_1"] = "Послідовність дій";
$MESS["BP_DBLA_T"] = "Послідовний бізнес-процес";
$MESS["BP_DBLA_M"] = "Поштове повідомлення";
$MESS["BP_DBLA_APPROVE"] = "Проголосуйте, будь ласка, за документ.";
$MESS["BP_DBLA_APPROVE2"] = "Проголосуйте, будь ласка, за документ.";
$MESS["BP_DBLA_PUB_TITLE"] = "Публікація документа";
$MESS["BP_DBLA_DESC"] = "Рекомендується для ситуацій затвердження документа з попередньою експертною оцінкою. У рамках процесу на першому етапі документ затверджується експертом. Якщо ним документ не затверджений, то він повертається на доопрацювання. Якщо затверджений, то документ передається для прийняття рішення групою співробітників простою більшістю голосів. Якщо документ не прийнятий на другому етапі голосування, то він повертається автору на доопрацювання і повторюється процес затвердження.";
$MESS["BP_DBLA_NAPP_DRAFT_S"] = "Статус: Відправлений на доопрацювання";
$MESS["BP_DBLA_APP_S"] = "Статус: Затверджений";
$MESS["BP_DBLA_MAIL4_SUBJ"] = "Затвердження {=Document:NAME}: Документ відхилений";
$MESS["BP_DBLA_PARAM1"] = "Ті, які затверджують на 1-му етапі";
$MESS["BP_DBLA_PARAM2"] = "Ті, які затверджують на 2-му етапі";
$MESS["BP_DBLA_APP"] = "Затверджений";
$MESS["BP_DBLA_APPROVE_TITLR"] = "Затвердження документа 1 етап";
$MESS["BP_DBLA_APPROVE2_TITLE"] = "Затвердження документа 2 етап";
?>