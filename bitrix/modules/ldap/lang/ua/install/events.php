<?
$MESS["LDAP_USER_CONFIRM_TYPE_NAME"] = "Підтвердження реєстрації";
$MESS["LDAP_USER_CONFIRM_TYPE_DESC"] = "
#USER_ID# — ID користувача
#EMAIL# — E-mail
#LOGIN# — Логін
#XML_ID# — Зовнішній ідентифікатор
#BACK_URL# — Зворотнє посилання
";
$MESS["LDAP_USER_CONFIRM_EVENT_NAME"] = "#SITE_NAME#: Підтверження реєстрації";
$MESS["LDAP_USER_CONFIRM_EVENT_DESC"] = "Інформаційне повідомлення сайта #SITE_NAME#
------------------------------------------
Здравствуйте,

Ви отримали це повідомлення, так як ваша адреса була використана при реєстрації нового користувача на сервері #SERVER_NAME#.

Для підтвердження реєстрації необхідно авторизуватися (ввести логін і пароль, які використовуються у локальній мережі) на наступній сторінці:
http://#SERVER_NAME#/bitrix/admin/ldap_user_auth.php?ldap_user_id=#XML_ID#&back_url=#BACK_URL#

Повідомлення сгенеровано автоматично.";
?>