<?
$MESS["ADV_BANNER_STATUS_CHANGE_NAME"] = "Змінився статус банера";
$MESS["ADV_BANNER_STATUS_CHANGE_DESC"] = "#EMAIL_TO# — e-mail одержувача повідомлення (#OWNER_EMAIL#)
#ADMIN_EMAIL# — e-mail користувачів, що мають роль «менеджер банерів» і «адміністратор»
#ADD_EMAIL# — e-mail користувачів, що мають право керування банерами контракту
#STAT_EMAIL# — e-mail користувачів, що мають право перегляду банерів конракту
#EDIT_EMAIL# — e-mail користувачів, що мають право модифікації деяких полів контракту
#OWNER_EMAIL# — e-mail користувачів, що мають будь яке право на контракт
#BCC# — прихована копія (#ADMIN_EMAIL#)
#ID# — ID банера
#CONTRACT_ID# — ID контракту
#CONTRACT_NAME# — заголовок контракту
#TYPE_SID# — ID типу
#TYPE_NAME# — заголовок типу
#STATUS# — статус
#STATUS_COMMENTS# — коментар до статусу
#NAME# — заголовок банера
#GROUP_SID# — група банера
#INDICATOR# — чи показується банер на сайті?
#ACTIVE# — прапор активності банера [Y | N]
#MAX_SHOW_COUNT# — максимальна кількість показів банера
#SHOW_COUNT# — скільки разів банер був показаний на сайті
#MAX_CLICK_COUNT# — максимальна кількість кліків на банер
#CLICK_COUNT# — скільки разів клікнули на банер
#DATE_LAST_SHOW# — дата останнього показу банера
#DATE_LAST_CLICK# — дата останнього кліка на банер
#DATE_SHOW_FROM# — дата початку показу банера
#DATE_SHOW_TO# — дата закінчення показу банера
#IMAGE_LINK# — посилання на зображення банера
#IMAGE_ALT# — текст підказки на зображенні
#URL# — URL на зображенні
#URL_TARGET# — де розгорнути URL зображення
#CODE# — код банера
#CODE_TYPE# — тип коду банера (text | html)
#COMMENTS# — коментар до банеру
#DATE_CREATE# — дата створення банера
#CREATED_BY# — ким був створений банер
#DATE_MODIFY# — дата зміни банера
#MODIFIED_BY# — ким змінено банер
";
$MESS["ADV_BANNER_STATUS_CHANGE_SUBJECT"] = "[BID##ID#] #SITE_NAME#: Змінився статус банера — [#STATUS#]";
$MESS["ADV_BANNER_STATUS_CHANGE_MESSAGE"] = "Статус банера # #ID# змінився на [#STATUS#].

>=================== Параметри баннера ===============================

Банер   — [#ID#] #NAME#
Контракт — [#CONTRACT_ID#] #CONTRACT_NAME#
Тип — [#TYPE_SID#] #TYPE_NAME#
Група — #GROUP_SID#

----------------------------------------------------------------------

Активність: #INDICATOR#

Період — [#DATE_SHOW_FROM# - #DATE_SHOW_TO#]
Показано — #SHOW_COUNT# / #MAX_SHOW_COUNT# [#DATE_LAST_SHOW#]
Клікнули — #CLICK_COUNT# / #MAX_CLICK_COUNT# [#DATE_LAST_CLICK#]
Прапор акт. — [#ACTIVE#]
Статус — [#STATUS#]
Коментар:
#STATUS_COMMENTS#
----------------------------------------------------------------------

Зображення — [#IMAGE_ALT#] #IMAGE_LINK#
URL  — [#URL_TARGET#] #URL#

Код: [#CODE_TYPE#]
#CODE#

>=====================================================================

Створено — #CREATED_BY# [#DATE_CREATE#]
Змінено — #MODIFIED_BY# [#DATE_MODIFY#]

Для перегляду параметрів банера скористайтеся посиланням:
http://#SERVER_NAME#/bitrix/admin/adv_banner_edit.php?ID=#ID#&CONTRACT_ID=#CONTRACT_ID#&lang=#LANGUAGE_ID#

Личт сгенеровано автоматично.";
$MESS["ADV_CONTRACT_INFO_NAME"] = "Параметри рекламного контракту";
$MESS["ADV_CONTRACT_INFO_DESC"] = "#MESSAGE# — повідомлення
#EMAIL_TO# — e-mail одержувача повідомлення (#OWNER_EMAIL#)
#ADMIN_EMAIL# — e-mail користувачів, що мають роль «менеджер банерів» і «адміністратор»
#ADD_EMAIL# — e-mail користувачів, що мають право керування банерами контракту
#STAT_EMAIL# — e-mail користувачів, що мають право перегляду банерів конракту
#EDIT_EMAIL# — e-mail користувачів, що мають право модифікації деяких полів контракту
#OWNER_EMAIL# — e-mail користувачів, що мають будь яке право на контракт
#BCC# — прихована копія (#ADMIN_EMAIL#)
#ID# — ID банера
#INDICATOR# — чи показується банер на сайті?
#ACTIVE# — прапор активності банера [Y | N]
#NAME# — заголовок банера
#DESCRIPTION# — опис контракту
#MAX_SHOW_COUNT# — максимальна кількість показів банера
#SHOW_COUNT# — скільки разів банер був показаний на сайті
#MAX_CLICK_COUNT# — максимальна кількість кліків на банер
#CLICK_COUNT# — скільки разів клікнули на банер 
#BANNERS# — кількість банерів контракту 
#DATE_SHOW_FROM# — дата початку показу банера
#DATE_SHOW_TO# — дата закінчення показу банера
#DATE_CREATE# — дата створення баннера
#CREATED_BY# — ким був створений банер
#DATE_MODIFY# — дата зміни банера
#MODIFIED_BY# — ким змінено банер";
$MESS["ADV_CONTRACT_INFO_SUBJECT"] = "[CID##ID#] #SITE_NAME#: Параметри рекламного контракту";
$MESS["ADV_CONTRACT_INFO_MESSAGE"] = "#MESSAGE#
Контракт: [#ID#] #NAME#
#DESCRIPTION#
>================== Параметри контракту ==============================

Активність: #INDICATOR#

Період — [#DATE_SHOW_FROM# - #DATE_SHOW_TO#]
Показано — #SHOW_COUNT# / #MAX_SHOW_COUNT#
Клікнули — #CLICK_COUNT# / #MAX_CLICK_COUNT#
Прапор акт. — [#ACTIVE#]

Банерів — #BANNERS#
>=====================================================================

Створено — #CREATED_BY# [#DATE_CREATE#]
Змінено — #MODIFIED_BY# [#DATE_MODIFY#]

Для перегляду параметрів контракту скористайтеся посиланням:
http://#SERVER_NAME#/bitrix/admin/adv_contract_edit.php?ID=#ID#&lang=#LANGUAGE_ID#

Лист сгенеровано автоматично.";
?>