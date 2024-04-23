<?php
$MESS["SUP_SE_TICKET_CHANGE_BY_AUTHOR_FOR_AUTHOR_TEXT"] = "#ID# — ID звернення
#LANGUAGE_ID# — ідентифікатор мови сайту, до якого прив'язано звернення
#WHAT_CHANGE# - список того, що у зверненні змінилось
#DATE_CREATE# — дата створення 
#TIMESTAMP# — дата зміни
#DATE_CLOSE# — дата закриття
#TITLE# — заголовок звернення
#CATEGORY# — категорія звернення
#STATUS# — статус звернення
#CRITICALITY# — критичність звернення
#RATE# - оцінка відповідей
#SLA# — рівень техпідтримки
#SOURCE# — початковеджерело звернення (web, email, телефон тощо)
#SPAM_MARK# — позначка про спам
#MESSAGE_BODY# — текст повідомлення
#FILES_LINKS# — посилання на прикріплені файли
#ADMIN_EDIT_URL# — посилання для зміни звернення (до адміністративної частини)
#PUBLIC_EDIT_URL# — посилання для зміни звернення (до публічної частини)

#OWNER_EMAIL# — #OWNER_USER_EMAIL# та/або #OWNER_SID#
#OWNER_USER_ID# — ID автора звернення
#OWNER_USER_NAME# — ім’я автора звернення
#OWNER_USER_LOGIN# — логін автора звернення
#OWNER_USER_EMAIL# — e-mail автора звернення
#OWNER_TEXT# — [#OWNER_USER_ID#] (#OWNER_USER_LOGIN#) #OWNER_USER_NAME#
#OWNER_SID# — довільний ідентифікатор автора звернення (email, телефон тощо)

#SUPPORT_EMAIL# — #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# — ID відповідального за звернення
#RESPONSIBLE_USER_NAME# — ім’я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# — логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# — email відповідального за звернення
#RESPONSIBLE_TEXT# — [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#) #RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# — email адміністраторів техпідтримки

#CREATED_USER_ID# — ID того, хто створив звернення
#CREATED_USER_LOGIN# — логін того, хто створив звернення
#CREATED_USER_EMAIL# — e-mail того, хто створив звернення
#CREATED_USER_NAME# — ім’я того, хто створив звернення
#CREATED_MODULE_NAME# — ідентифікатор модуля, засобами якого було створено звернення
#CREATED_TEXT# — [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#

#SUPPORT_COMMENTS# — адміністративний коментар
";
$MESS["SUP_SE_TICKET_CHANGE_BY_AUTHOR_FOR_AUTHOR_TITLE"] = "Звернення змінено автором (для автора)";
$MESS["SUP_SE_TICKET_CHANGE_BY_SUPPORT_FOR_AUTHOR_MESSAGE"] = "Зміни у вашому зверненні # #ID# на сайті #SERVER_NAME#.

#WHAT_CHANGE#
Тема: #TITLE# 

Від кого: #MESSAGE_SOURCE##MESSAGE_AUTHOR_SID##MESSAGE_AUTHOR_TEXT#

>======================= ПОВІДОМЛЕННЯ ===================================#FILES_LINKS##MESSAGE_BODY#
>=====================================================================

Автор — #SOURCE##OWNER_SID##OWNER_TEXT#
Створено — #CREATED_TEXT##CREATED_MODULE_NAME# [#DATE_CREATE#]
Змінено — #MODIFIED_TEXT##MODIFIED_MODULE_NAME# [#TIMESTAMP#]

Відповідальний — #RESPONSIBLE_TEXT#
Категорія — #CATEGORY#
Критичність — #CRITICALITY#
Статус — #STATUS#
Оцінка відповідей — #RATE#
Рівень підтримки — #SLA#

Для перегляду та редагування звернення скористайтеся посиланням:
http://#SERVER_NAME##PUBLIC_EDIT_URL#?ID=#ID#

Ми просимо вас не забути оцінити відповіді служби техпідтримки після закриття звернення:
http://#SERVER_NAME##PUBLIC_EDIT_URL#?ID=#ID#

Лист згенеровано автоматично.
";
$MESS["SUP_SE_TICKET_CHANGE_BY_SUPPORT_FOR_AUTHOR_SUBJECT"] = "[TID##ID#] #SERVER_NAME#: Зміни у вашому зверненні";
$MESS["SUP_SE_TICKET_CHANGE_BY_SUPPORT_FOR_AUTHOR_TEXT"] = "#ID# — ID звернення
#LANGUAGE_ID# — ідентифікатор мови сайту, до якого прив'язано звернення
#DATE_CREATE# — дата створення 
#TIMESTAMP# — дата зміни
#DATE_CLOSE# — дата закриття
#TITLE# — заголовок звернення
#CATEGORY# — категорія звернення
#STATUS# — статус звернення
#CRITICALITY# — критичність звернення
#RATE# - оцінка відповідей
#SLA# — рівень техпідтримки
#SOURCE# — початкове джерело звернення (web, e-mail, телефон тощо)
#SPAM_MARK# — позначка про спам
#MESSAGES_AMOUNT# - кількість повідомлень у зверненні
#ADMIN_EDIT_URL# — посилання для зміни звернення (до адміністративної частини)
#PUBLIC_EDIT_URL# — посилання для зміни звернення (до публічної частини)

#OWNER_EMAIL# — #OWNER_USER_EMAIL# та/або #OWNER_SID#
#OWNER_USER_ID# — ID автора звернення
#OWNER_USER_NAME# — ім’я автора звернення
#OWNER_USER_LOGIN# — логін автора звернення
#OWNER_USER_EMAIL# — email автора звернення
#OWNER_TEXT# — [#OWNER_USER_ID#] (#OWNER_USER_LOGIN#) #OWNER_USER_NAME#
#OWNER_SID# — довільний ідентифікатор автора звернення (e-mail, телефон тощо)

#SUPPORT_EMAIL# — #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# — ID відповідального за звернення
#RESPONSIBLE_USER_NAME# — ім’я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# — логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# — email відповідального за звернення
#RESPONSIBLE_TEXT# — [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#) #RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# — email адміністраторів техпідтримки

#CREATED_USER_ID# — ID того, хто створив звернення
#CREATED_USER_LOGIN# — логін того, хто створив звернення
#CREATED_USER_EMAIL# — email того, хто створив звернення
#CREATED_USER_NAME# — ім’я того, хто створив звернення
#CREATED_MODULE_NAME# — ідентифікатор модуля, засобами якого було створено звернення
#CREATED_TEXT# — [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#

#MODIFIED_USER_ID# - ID того, хто змінив звернення
#MODIFIED_USER_LOGIN# - логин того, хто змінив звернення
#MODIFIED_USER_EMAIL# - email того, хто змінив звернення
#MODIFIED_USER_NAME# - ім’я того, хто змінив звернення
#MODIFIED_MODULE_NAME# - ідентифікатор модуля, засобами якого було створено звернення
#MODIFIED_TEXT# - [#MODIFIED_USER_ID#] (#MODIFIED_USER_LOGIN#) #MODIFIED_USER_NAME#

#MESSAGE_AUTHOR_USER_ID# - ID автора повідомлення
#MESSAGE_AUTHOR_USER_NAME# - ім’я автора повідомлення
#MESSAGE_AUTHOR_USER_LOGIN# - логін автора повідомлення
#MESSAGE_AUTHOR_USER_EMAIL# - email автора повідомлення
#MESSAGE_AUTHOR_TEXT# - [#MESSAGE_AUTHOR_USER_ID#] (#MESSAGE_AUTHOR_USER_LOGIN#) #MESSAGE_AUTHOR_USER_NAME#
#MESSAGE_AUTHOR_SID# - довільний ідентифікатор автора повідомлення (email, телефон тощо)
#MESSAGE_SOURCE# - джерело повідомлення
#MESSAGE_BODY# - текст повідомлення 
#FILES_LINKS# - посилання на прикріплені файли

#SUPPORT_COMMENTS# — адміністративний коментар

";
$MESS["SUP_SE_TICKET_CHANGE_BY_SUPPORT_FOR_AUTHOR_TITLE"] = "Звернення змінено співробітником техпідтримки (для автора)";
$MESS["SUP_SE_TICKET_CHANGE_FOR_TECHSUPPORT_MESSAGE"] = "Зміни у зверненні # #ID# до служби техпідтримки сайту #SERVER_NAME#.
#SPAM_MARK#
#WHAT_CHANGE#
Тема: #TITLE# 

Від кого: #MESSAGE_SOURCE##MESSAGE_AUTHOR_SID##MESSAGE_AUTHOR_TEXT#

>#MESSAGE_HEADER##FILES_LINKS##MESSAGE_BODY#
>#MESSAGE_FOOTER#

Автор — #SOURCE##OWNER_SID##OWNER_TEXT#
Створено — #CREATED_TEXT##CREATED_MODULE_NAME# [#DATE_CREATE#]
Змінено — #MODIFIED_TEXT##MODIFIED_MODULE_NAME# [#TIMESTAMP#]

Відповідальний — #RESPONSIBLE_TEXT#
Категорія — #CATEGORY#
Критичність — #CRITICALITY#
Статус — #STATUS#
Оцінка відповідей — #RATE#
Рівень підтримки — #SLA#

>====================== КОМЕНТАР ==================================#SUPPORT_COMMENTS#
>=====================================================================

Для перегляду та редагування звернення скористайтеся посиланням:
http://#SERVER_NAME##ADMIN_EDIT_URL#?ID=#ID#&lang=#LANGUAGE_ID#

Лист сгенеровано автоматично.
";
$MESS["SUP_SE_TICKET_CHANGE_FOR_TECHSUPPORT_SUBJECT"] = "[TID##ID#] #SERVER_NAME#: Зміни у зверненні";
$MESS["SUP_SE_TICKET_CHANGE_FOR_TECHSUPPORT_TEXT"] = "#SUPPORT_EMAIL# - #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# - ID відповідального за звернення
#RESPONSIBLE_USER_NAME# - ім'я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# - логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# - email відповідального за звернення
#RESPONSIBLE_TEXT# - [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#)#RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# - email адміністраторів техпідтримки

#CREATED_USER_ID# - ID того, хто створив звернення
#CREATED_USER_LOGIN# - логін того, хто створив звернення
#CREATED_USER_EMAIL# - email того, хто створив звернення
#CREATED_USER_NAME# - ім'я того, хто створив звернення
#CREATED_MODULE_NAME# - ідентифікатор модуля засобами якого було створено звернення
#CREATED_TEXT# - [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#

#MODIFIED_USER_ID# - ID того, хто змінив звернення
#MODIFIED_USER_LOGIN# - логін того, хто змінив звернення
#MODIFIED_USER_EMAIL# - email того, хто змінив звернення
#MODIFIED_USER_NAME# - ім'я того, хто змінив звернення
#MODIFIED_MODULE_NAME# - ідентифікатор модуля засобами якого було змінено звернення
#MODIFIED_TEXT# - [#MODIFIED_USER_ID#] (#MODIFIED_USER_LOGIN#) #MODIFIED_USER_NAME#

#MESSAGE_AUTHOR_USER_ID# - ID автора повідомлення
#MESSAGE_AUTHOR_USER_NAME# - ім'я автора повідомлення
#MESSAGE_AUTHOR_USER_LOGIN# - логін автора повідомлення
#MESSAGE_AUTHOR_USER_EMAIL# - email автора повідомлення
#MESSAGE_AUTHOR_TEXT# - [#MESSAGE_AUTHOR_USER_ID#] (#MESSAGE_AUTHOR_USER_LOGIN #) #MESSAGE_AUTHOR_USER_NAME#
#MESSAGE_AUTHOR_SID# - довільний ідентифікатор автора повідомлення (email, телефон і т.д.)
#MESSAGE_SOURCE# - джерело повідомлення
#MESSAGE_HEADER# - \"*******Повідомлення*******\", або \"******* Приховане повідомлення *******\"
#MESSAGE_BODY# - текст повідомлення
#MESSAGE_FOOTER# - \"***********************\"
#FILES_LINKS# - посилання на прикріплені файли

#SUPPORT_COMMENTS# - адміністративний коментар
";
$MESS["SUP_SE_TICKET_CHANGE_FOR_TECHSUPPORT_TITLE"] = "Зміни у зверненні (для техпідтримки)";
$MESS["SUP_SE_TICKET_GENERATE_SUPERCOUPON_TEXT"] = "#COUPON# — Купон
#COUPON_ID# — ID купона
#DATE# — Дата використання
#USER_ID# — ID користувача, який використав 
#SESSION_ID# — ID сесії
#GUEST_ID# — ID гостя
";
$MESS["SUP_SE_TICKET_GENERATE_SUPERCOUPON_TITLE"] = "Використано купон";
$MESS["SUP_SE_TICKET_NEW_FOR_AUTHOR_MESSAGE"] = "Ваше звернення прийнято, йому привласнено номер #ID#.

Ви не повинні відповідати на цей лист. Це тільки підтвердження, 
що служба техпідтримки отримала ваше звернення і працює з ним.

Інформація про ваше звернення:

Тема — #TITLE# 
Від кого — #SOURCE##OWNER_SID##OWNER_TEXT#
Категорія — #CATEGORY#
Критичність — #CRITICALITY#

Створено — #CREATED_TEXT##CREATED_MODULE_NAME# [#DATE_CREATE#]
Відповідальний — #RESPONSIBLE_TEXT#
Рівень підтримки — #SLA#

>======================= ПОВІДОМЛЕННЯ ===================================

#FILES_LINKS##MESSAGE_BODY#

>=====================================================================

Для перегляду та редагування звернення скористайтеся посиланням:
http://#SERVER_NAME##PUBLIC_EDIT_URL#?ID=#ID#

Лист сгенеровано автоматично.
";
$MESS["SUP_SE_TICKET_NEW_FOR_AUTHOR_SUBJECT"] = "[TID##ID#] #SERVER_NAME#: Ваше звернення прийнято";
$MESS["SUP_SE_TICKET_NEW_FOR_AUTHOR_TEXT"] = "#ID# — ID звернення
#LANGUAGE_ID# — ідентифікатор мови сайту, до якого прив'язано звернення
#DATE_CREATE# — дата створення 
#TIMESTAMP# — дата змінення
#DATE_CLOSE# — дата закриття
#TITLE# — заголовок звернення
#CATEGORY# — категорія звернення
#STATUS# — статус звернення
#CRITICALITY# — критичність звернення
#SLA# — рівень техпідтримки
#SOURCE# — джерело звернення (web, e-mail, телефон тощо)
#SPAM_MARK# — позначка про спам
#MESSAGE_BODY# — текст повідомлення
#FILES_LINKS# — посилання на прикріплені файли
#ADMIN_EDIT_URL# — посилання для змінення звернення (до адміністративної частини)
#PUBLIC_EDIT_URL# — посилання для змінення звернення (до публічної частини)

#OWNER_EMAIL# — #OWNER_USER_EMAIL# та/або #OWNER_SID#
#OWNER_USER_ID# — ID автора звернення
#OWNER_USER_NAME# — ім’я автора звернення
#OWNER_USER_LOGIN# — логін автора звернення
#OWNER_USER_EMAIL# — e-mail автора звернення
#OWNER_TEXT# — [#OWNER_USER_ID#] (#OWNER_USER_LOGIN#) #OWNER_USER_NAME#
#OWNER_SID# — довільний ідентифікатор автора звернення (e-mail, телефон тощо)

#SUPPORT_EMAIL# — #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# — ID відповідального за звернення
#RESPONSIBLE_USER_NAME# — ім’я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# — логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# — e-mail відповідального за звернення
#RESPONSIBLE_TEXT# — [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#) #RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# — e-mail усіх адміністраторів техпідтримки

#CREATED_USER_ID# — ID автора звернення
#CREATED_USER_LOGIN# — логін того, хто створив звернення
#CREATED_USER_EMAIL# — e-mail того, хто створив звернення
#CREATED_USER_NAME# — ім’я того, хто створив звернення
#CREATED_MODULE_NAME# — ідентифікатор модуля, засобами якого було створено звернення
#CREATED_TEXT# — [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#

#SUPPORT_COMMENTS# — адміністративний коментар
";
$MESS["SUP_SE_TICKET_NEW_FOR_AUTHOR_TITLE"] = "Нове звернення (для автора)";
$MESS["SUP_SE_TICKET_NEW_FOR_TECHSUPPORT_MESSAGE"] = "Нове звернення # #ID# до служби техпідтримки сайту #SERVER_NAME#.
#SPAM_MARK#
Від кого: #SOURCE##OWNER_SID##OWNER_TEXT#

Тема: #TITLE# 

>======================= ПОВІДОМЛЕННЯ ===================================

#FILES_LINKS##MESSAGE_BODY#

>=====================================================================

Відповідальний — #RESPONSIBLE_TEXT#
Категорія — #CATEGORY#
Критичність — #CRITICALITY#
Рівень підтримки — #SLA#
Створено — #CREATED_TEXT##CREATED_MODULE_NAME# [#DATE_CREATE#]

Для перегляду та редагування звернення скористайтеся посиланням:
http://#SERVER_NAME##ADMIN_EDIT_URL#?ID=#ID#&lang=#LANGUAGE_ID#

Лист сгенеровано автоматично. 
";
$MESS["SUP_SE_TICKET_NEW_FOR_TECHSUPPORT_SUBJECT"] = "[TID##ID#] #SERVER_NAME#: Нове звернення";
$MESS["SUP_SE_TICKET_NEW_FOR_TECHSUPPORT_TEXT"] = "#ID# — ID звернення
#LANGUAGE_ID# — ідентифікатор мови сайту, до якого прив'язано звернення
#DATE_CREATE# — дата створення 
#TIMESTAMP# — дата зміни
#DATE_CLOSE# — дата закриття
#TITLE# — заголовок звернення
#CATEGORY# — категорія звернення
#STATUS# — статус звернення
#CRITICALITY# — критичність звернення
#SLA# — рівень техпідтримки
#SOURCE# — джерело звернення (web, e-mail, телефон тощо)
#SPAM_MARK# — позначка про спам
#MESSAGE_BODY# — текст повідомлення
#FILES_LINKS# — посилання на прикріплені файли
#ADMIN_EDIT_URL# — посилання для змінення звернення (до адміністративної частини)
#PUBLIC_EDIT_URL# — посилання для змінення звернення (до публічної частини)

#OWNER_EMAIL# — #OWNER_USER_EMAIL# та/або #OWNER_SID#
#OWNER_USER_ID# — ID автора звернення
#OWNER_USER_NAME# — ім’я автора звернення
#OWNER_USER_LOGIN# — логін автора звернення
#OWNER_USER_EMAIL# — e-mail автора звернення
#OWNER_TEXT# — [#OWNER_USER_ID#] (#OWNER_USER_LOGIN#) #OWNER_USER_NAME#
#OWNER_SID# — довільний ідентифікатор автора звернення (e-mail, телефон тощо)

#SUPPORT_EMAIL# — #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# — ID відповідального за звернення
#RESPONSIBLE_USER_NAME# — ім’я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# — логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# — e-mail відповідального за звернення
#RESPONSIBLE_TEXT# — [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#) #RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# — e-mail усіх адміністраторів техпідтримки

#CREATED_USER_ID# — ID автора звернення
#CREATED_USER_LOGIN# — логін того, хто створив звернення
#CREATED_USER_EMAIL# — email того, хто створив звернення
#CREATED_USER_NAME# — ім’я того, хто створив звернення
#CREATED_MODULE_NAME# — ідентифікатор модуля, засобами якого було створено звернення
#CREATED_TEXT# — [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#

#SUPPORT_COMMENTS# — адміністративний коментар

#COUPON# — Купон
";
$MESS["SUP_SE_TICKET_NEW_FOR_TECHSUPPORT_TITLE"] = "Нове звернення (для техпідтримки)";
$MESS["SUP_SE_TICKET_OVERDUE_REMINDER_MESSAGE"] = "Нагадування про необхідність відповіді у зверненні # #ID# до служби техпідтримки сайту #SERVER_NAME#.

Коли буде протерміновано — #EXPIRATION_DATE# (залишилось: #REMAINED_TIME#)

>================= ІНФОРМАЦІЯ ЩОДО ЗВЕРНЕННЯ ===========================

Тема — #TITLE# 

Автор — #SOURCE##OWNER_SID##OWNER_TEXT#
Створено — #CREATED_TEXT##CREATED_MODULE_NAME# [#DATE_CREATE#]

Рівень підтримки — #SLA#

Відповідальний — #RESPONSIBLE_TEXT#
Категорія — #CATEGORY#
Критичність — #CRITICALITY#
Статус — #STATUS#
Оцінка відповідей — #RATE#

>================ ПОВІДОМЛЕННЯ, ЩО ПОТРЕБУЄ ВІДПОВІДІ =========================
#MESSAGE_BODY#
>=====================================================================

Для перегляду та редагування звернення скористайтеся посиланням:
http://#SERVER_NAME##ADMIN_EDIT_URL#?ID=#ID#&lang=#LANGUAGE_ID#

Лист сгенеровано автоматично.
";
$MESS["SUP_SE_TICKET_OVERDUE_REMINDER_SUBJECT"] = "[TID##ID#] #SERVER_NAME#: Нагадування про необхідність відповіді";
$MESS["SUP_SE_TICKET_OVERDUE_REMINDER_TEXT"] = "#ID# - ID звернення
#LANGUAGE_ID# - ідентифікатор мови сайту до якого прив'язано звернення
#DATE_CREATE# - дата створення
#TITLE# - заголовок звернення
#STATUS# - статус звернення
#CATEGORY# - категорія звернення
#CRITICALITY# - критичність звернення
#RATE# - оцінка відповідей
#SLA# - рівень техпідтримки
#SOURCE# - початкове джерело звернення (web, email, телефон і т.д.)
#ADMIN_EDIT_URL# - посилання для зміни звернення (в адміністративну частину)

#EXPIRATION_DATE# - дата закінчення часу реакції
#REMAINED_TIME# - скільки залишилося до дати закінчення часу реакції

#OWNER_EMAIL# - #OWNER_USER_EMAIL# і/або #OWNER_SID#
#OWNER_USER_ID# - ID автора звернення
#OWNER_USER_NAME# - ім'я автора звернення
#OWNER_USER_LOGIN# - логін автора звернення
#OWNER_USER_EMAIL# - email автора звернення
#OWNER_TEXT# - [#OWNER_USER_ID#] (#OWNER_USER_LOGIN#) #OWNER_USER_NAME#
#OWNER_SID# - довільний ідентифікатор автора звернення (email, телефон і т.п.)

#SUPPORT_EMAIL# - #RESPONSIBLE_USER_EMAIL# або #SUPPORT_ADMIN_EMAIL#
#RESPONSIBLE_USER_ID# - ID відповідального за звернення
#RESPONSIBLE_USER_NAME# - ім'я відповідального за звернення
#RESPONSIBLE_USER_LOGIN# - логін відповідального за звернення
#RESPONSIBLE_USER_EMAIL# - email відповідального за звернення
#RESPONSIBLE_TEXT# - [#RESPONSIBLE_USER_ID#] (#RESPONSIBLE_USER_LOGIN#) #RESPONSIBLE_USER_NAME#
#SUPPORT_ADMIN_EMAIL# - email адміністраторів техпідтримки

#CREATED_USER_ID# - ID автора звернення
#CREATED_USER_LOGIN# - логін того, хто створив звернення
#CREATED_USER_EMAIL# - email того, хто створив звернення
#CREATED_USER_NAME# - ім'я того, хто створив звернення
#CREATED_MODULE_NAME# - ідентифікатор модуля, за допомогою якого було створено звернення
#CREATED_TEXT# - [#CREATED_USER_ID#] (#CREATED_USER_LOGIN#) #CREATED_USER_NAME#
#MESSAGE_BODY# - текст повідомлення клієнта, що вимагає відповіді";
$MESS["SUP_SE_TICKET_OVERDUE_REMINDER_TITLE"] = "Нагадування про необхідність відповіді (для техпідтримки)";
