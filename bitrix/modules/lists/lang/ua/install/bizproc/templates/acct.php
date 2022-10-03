<?
$MESS["LIBTA_NAME"] = "Назва";
$MESS["LIBTA_TYPE"] = "Тип";
$MESS["LIBTA_TYPE_ADV"] = "Реклама";
$MESS["LIBTA_TYPE_EX"] = "Представницькі";
$MESS["LIBTA_TYPE_C"] = "Компенсовані";
$MESS["LIBTA_TYPE_D"] = "Інше";
$MESS["LIBTA_CREATED_BY"] = "Ким створено";
$MESS["LIBTA_DATE_CREATE"] = "Дата створення";
$MESS["LIBTA_FILE"] = "Файл (копія рахунку)";
$MESS["LIBTA_NUM_DATE"] = "Номер рахунку та дата";
$MESS["LIBTA_SUM"] = "Сума";
$MESS["LIBTA_PAID"] = "Оплачено";
$MESS["LIBTA_PAID_NO"] = "Ні";
$MESS["LIBTA_PAID_YES"] = "Так";
$MESS["LIBTA_BDT"] = "Стаття бюджету";
$MESS["LIBTA_DATE_PAY"] = "Дата оплати (заповнює бухгалтер)";
$MESS["LIBTA_NUM_PP"] = "Номер п/д (заповнює бухгалтер)";
$MESS["LIBTA_DOCS"] = "Копії документів";
$MESS["LIBTA_DOCS_YES"] = "Є";
$MESS["LIBTA_DOCS_NO"] = "Немає";
$MESS["LIBTA_APPROVED"] = "Затверджено";
$MESS["LIBTA_APPROVED_R"] = "Відмовлено";
$MESS["LIBTA_APPROVED_N"] = "Не погоджено";
$MESS["LIBTA_APPROVED_Y"] = "Погоджено";
$MESS["LIBTA_T_PBP"] = "Послідовний бізнес-процес";
$MESS["LIBTA_T_SPA1"] = "Установка прав: автору";
$MESS["LIBTA_T_PDA1"] = "Публікація документа";
$MESS["LIBTA_STATE1"] = "На затвердженні";
$MESS["LIBTA_T_SSTA1"] = "Статус: на затвердження";
$MESS["LIBTA_T_ASFA1"] = "Встановлення поля \"Затверджено\" документа";
$MESS["LIBTA_T_SVWA1"] = "Встановлення затверджуючого";
$MESS["LIBTA_T_WHILEA1"] = "Цикл узгодження";
$MESS["LIBTA_T_SA0"] = "Послідовність дій";
$MESS["LIBTA_T_IFELSEA1"] = "Дійшли до керівництва";
$MESS["LIBTA_T_IFELSEBA1"] = "Так";
$MESS["LIBTA_T_ASFA2"] = "Встановлення поля \"Затверджено\" документа";
$MESS["LIBTA_T_IFELSEBA2"] = "Ні";
$MESS["LIBTA_T_GUAX1"] = "Вибір начальника";
$MESS["LIBTA_T_SVWA2"] = "Встановлення затверджуючого";
$MESS["LIBTA_T_SPAX1"] = "Установка прав: стверджує читання";
$MESS["LIBTA_SMA_MESSAGE_1"] = "Прошу затвердити рахунок
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Сума: {=Document:PROPERTY_SUM}

{=Variable: Link}{=Document: ID}/
";
$MESS["LIBTA_T_SMA_MESSAGE_1"] = "Повідомлення: запит затвердження рахунки";
$MESS["LIBTA_XMA_MESSAGES_1"] = "КП: Рахунок на затвердження";
$MESS["LIBTA_XMA_MESSAGET_1"] = "Прошу затвердити рахунок

Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}

{=Variable: Link} {=Document:ID}/


Список завдань по бізнес-процесам:
{=Variable:TasksLink}";
$MESS["LIBTA_T_XMA_MESSAGES_1"] = "Повідомлення: затвердження рахунку";
$MESS["LIBTA_AAQN1"] = "Затвердження рахунку \"{= Document: NAME}\"";
$MESS["LIBTA_AAQD1"] = "Вам необхідно затвердити або відхилити рахунок

Назва: {=Document:NAME}
Дата створення: {=Document:DATE_CREATE}
Автор: {=Document:CREATED_BY_PRINTABLE}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}
Файл: {=Variable: Domain}{=Document:PROPERTY_FILE}

{=Variable: Link}{=Document:ID}/";
$MESS["LIBTA_T_AAQN1"] = "затвердження";
$MESS["LIBTA_STATE2"] = "Затверджено ({=Variable:Approver_printable})";
$MESS["LIBTA_T_SSTA2"] = "Статус: затверджено";
$MESS["LIBTA_STATE3"] = "Не затверджено ({=Variable:Approver_printable})";
$MESS["LIBTA_T_SSTA3"] = "Статус: не затверджено";
$MESS["LIBTA_T_ASFA3"] = "Установка поля \"Затверджено\" документа";
$MESS["LIBTA_T_IFELSEA2"] = "Рахунок затверджено";
$MESS["LIBTA_T_IFELSEBA3"] = "Так";
$MESS["LIBTA_SMA_MESSAGE_2"] = "Затверджую рахунок

Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

{=Variable: Link}{=Document: ID}/";
$MESS["LIBTA_T_SMA_MESSAGE_2"] = "Повідомлення: рахунок затверджено";
$MESS["LIBTA_T_SPAX2"] = "Установка прав: підтверджуючому оплату";
$MESS["LIBTA_SMA_MESSAGE_3"] = "
Прошу підтвердити оплату рахунку

Затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}

{=Variable: Link}{=Document:ID}/

Список завдань:
{=Variable:TasksLink} ";
$MESS["LIBTA_T_SMA_MESSAGE_3"] = "Повідомлення: запит підтвердження оплати";
$MESS["LIBTA_XMA_MESSAGES_2"] = "КП: Підтвердження оплати рахунку";
$MESS["LIBTA_XMA_MESSAGET_2"] = "Прошу підтвердити оплату рахунку

Затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}

{=Variable:Link}{=Document:ID}/

Список завдань:
{=Variable:TasksLink}";
$MESS["LIBTA_T_XMA_MESSAGES_2"] = "Повідомлення: підтвердження оплати";
$MESS["LIBTA_STATE4"] = "На підтвердженні оплати";
$MESS["LIBTA_T_SSTA4"] = "Статус: на підтвердженні оплати";
$MESS["LIBTA_AAQN2"] = "Підтвердити оплату рахунку \"{=Document:NAME}\"";
$MESS["LIBTA_AAQD2"] = "Вам необхідно підтвердити або відхилити оплату рахунку

Затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document: PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету:{=Document:PROPERTY_BDT}
Файл: {=Variable:Domain}{=Document:PROPERTY_FILE}

{=Variable:Link}{=Document:ID}/";
$MESS["LIBTA_T_AAQN2"] = "Підтвердження оплати рахунку";
$MESS["LIBTA_T_SVWA3"] = "Зміна змінних";
$MESS["LIBTA_STATE5"] = "Оплата підтверджена";
$MESS["LIBTA_T_SSTA5"] = "Статус: оплата підтверджена";
$MESS["LIBTA_SMA_MESSAGE_4"] = "Оплата рахунку підтверджена

Дата створення: {=Document: DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

{=Variable:Link}{=Document:ID}/";
$MESS["LIBTA_T_SMA_MESSAGE_4"] = "Повідомлення: оплата підтверджена";
$MESS["LIBTA_T_SPAX3"] = "Встановлення прав: платнику";
$MESS["LIBTA_SMA_MESSAGE_5"] = "Прошу сплатити рахунок

Оплата підтверджена: {=Variable:PaymentApprover_printable}
Рахунок затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}

{=Variable: Link} {=Document: ID}/

Список завдань:
{=Variable:TasksLink}
";
$MESS["LIBTA_T_SMA_MESSAGE_5"] = "Повідомлення: рахунок на оплату";
$MESS["LIBTA_XMA_MESSAGES_3"] = "КП: Рахунок на оплату";
$MESS["LIBTA_XMA_MESSAGET_3"] = "Прошу сплатити рахунок

Оплата підтверджена: {=Variable:PaymentApprover_printable}
Рахунок затверджений: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер та дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}

{=Variable:Link}{=Document:ID}/

Список завдань:
{=Variable:TasksLink}";
$MESS["LIBTA_T_XMA_MESSAGES_3"] = "Повідомлення: рахунок на оплату";
$MESS["LIBTA_STATE6"] = "Очікування оплати";
$MESS["LIBTA_T_SSTA6"] = "Статус: очікування оплати";
$MESS["LIBTA_T_ASFA4"] = "Зміна документа";
$MESS["LIBTA_STATE7"] = "Оплачено";
$MESS["LIBTA_T_SSTA7"] = "Статус: рахунок оплачений";
$MESS["LIBTA_SMA_MESSAGE_6"] = "Рахунок оплачено. Необхідні документи по рахунку.

Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

УВАГА! Документи повинні бути здані протягом 5 днів після оплати рахунку!";
$MESS["LIBTA_T_SMA_MESSAGE_6"] = "Повідомлення: рахунок оплачений";
$MESS["LIBTA_T_SPAX4"] = "Установка прав: Документуючому";
$MESS["LIBTA_SMA_MESSAGE_7"] = "Документи по рахунку зібрані

Дата оплати: {=Document:PROPERTY_DATE_PAY}
Номер п / п: {=Document:PROPERTY_NUM_PAY}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document: PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}

{=Variable: Link}{=Document:ID}/

Список завдань:
{=Variable:TasksLink}";
$MESS["LIBTA_T_SMA_MESSAGE_7"] = "Повідомлення: документи зібрані";
$MESS["LIBTA_T_ASFA5"] = "Зміна документа";
$MESS["LIBTA_STATE8"] = "Закрито";
$MESS["LIBTA_T_SSTA8"] = "Статус: рахунок закрито";
$MESS["LIBTA_SMA_MESSAGE_8"] = "Документи отримані. БП по рахунку закритий.

Дата створення :{=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

{=Variable:Link}{=Document:ID}/";
$MESS["LIBTA_T_SMA_MESSAGE_8"] = "Повідомлення: документи отримані";
$MESS["LIBTA_STATE9"] = "Оплата відхилена";
$MESS["LIBTA_T_SSTA9"] = "Статус: оплата відхилена";
$MESS["LIBTA_SMA_MESSAGE_9"] = "Оплата рахунку не підтверджена

Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

{=Variable:Link}{= Document:ID} /";
$MESS["LIBTA_T_SMA_MESSAGE_9"] = "Повідомлення: оплата не підтверджена";
$MESS["LIBTA_T_IFELSEBA4"] = "Ні";
$MESS["LIBTA_SMA_MESSAGE_10"] = "Рахунок не затверджений

Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}

{=Variable:Link}{=Document:ID}/";
$MESS["LIBTA_T_SMA_MESSAGE_10"] = "Повідомлення: рахунок не затверджений";
$MESS["LIBTA_T_SPAX5"] = "Установка прав: фінальна";
$MESS["LIBTA_V_BK"] = "Бухгалтерія (затвердження оплати)";
$MESS["LIBTA_V_MNG"] = "Керівництво";
$MESS["LIBTA_V_APPRU"] = "Підтверджує";
$MESS["LIBTA_V_BKP"] = "Бухгалтерія (оплата рахунку)";
$MESS["LIBTA_V_BKD"] = "Бухгалтерія (збір документи)";
$MESS["LIBTA_V_MAPPR"] = "Керівництво (затвердження рахунку)";
$MESS["LIBTA_V_LINK"] = "Посилання на список рахунків";
$MESS["LIBTA_V_TLINK"] = "Посилання на список завдань";
$MESS["LIBTA_V_PDATE"] = "Дата оплати";
$MESS["LIBTA_V_PNUM"] = "Номер п/д";
$MESS["LIBTA_V_APPR"] = "Підтвердив оплату";
$MESS["LIBTA_BP_TITLE"] = "Рахунки";
$MESS["LIBTA_RIA10_NAME"] = "Сплатити рахунок \"{=Document:NAME}\"";
$MESS["LIBTA_RIA10_DESCR"] = "Оплатити рахунок

Оплата підтверджена: {=Variable:PaymentApprover_printable}
Рахунок затверджено: {=Variable:Approver_printable}
Ким створено: {=Document: CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document: PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}
Файл: {= Variable: Domain}{=Document:PROPERTY_FILE}

{=Variable: Link}{=Document:ID}/";
$MESS["LIBTA_RIA10_R1"] = "Дата оплати";
$MESS["LIBTA_RIA10_R2"] = "Номер п / п";
$MESS["LIBTA_T_RIA10"] = "Оплата рахунку";
$MESS["LIBTA_RRA15_NAME"] = "Зібрати документи за рахунком \"{=Document:NAME}\"";
$MESS["LIBTA_RRA15_DESCR"] = "Зібрати документи за рахунком

Оплата підтверджена: {=Variable:PaymentApprover_printable}
Рахунок затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {=Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {=Document:PROPERTY_BDT}
Файл: {=Variable:Domain} {=Document:PROPERTY_FILE}

{=Variable:Link}{=Document:ID}/

УВАГА! Документи повинні бути здані протягом 5 днів після надання послуг!";
$MESS["LIBTA_RRA15_SM"] = "Збір документів";
$MESS["LIBTA_RRA15_TASKBUTTON"] = "Документи зібрані";
$MESS["LIBTA_T_RRA15"] = "Документи по рахунку";
$MESS["LIBTA_RRA17_NAME"] = "Підтвердити отримання документів по рахунку \"{=Document:NAME}\"";
$MESS["LIBTA_RRA17_DESCR"] = "Отримання документів за рахунком підтверджую.

Дата оплати: {=Document:PROPERTY_DATE_PAY}
Номер п / п: {= Document:PROPERTY_NUM_PAY}
Оплата підтверджена: {=Variable:PaymentApprover_printable}
Рахунок затверджено: {=Variable:Approver_printable}
Ким створено: {=Document:CREATED_BY_PRINTABLE}
Дата створення: {=Document:DATE_CREATE}
Назва: {=Document:NAME}
Тип: {=Document:PROPERTY_TYPE}
Номер і дата рахунку: {= Document:PROPERTY_NUM_DATE}
Сума: {=Document:PROPERTY_SUM}
Стаття бюджету: {= Document:PROPERTY_BDT}
Файл: {=Variable: Domain}{=Document:PROPERTY_FILE}

{=Variable:Link}{=Document:ID}/";
$MESS["LIBTA_RRA17_BUTTON"] = "Документи отримані";
$MESS["LIBTA_T_RRA17_NAME"] = "Документи отримані";
$MESS["LIBTA_V_DOMAIN"] = "Домен";
?>