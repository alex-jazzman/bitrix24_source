<?
$MESS ['VIRUS_DETECTED_NAME'] = "Обнаружен вирус";
$MESS ['VIRUS_DETECTED_DESC'] = "#EMAIL# - E-Mail администратора сайта (из настроек главного модуля)";
$MESS ['VIRUS_DETECTED_SUBJECT'] = "#SITE_NAME#: Обнаружен вирус";
$MESS ['VIRUS_DETECTED_MESSAGE'] = "Информационное сообщение сайта #SITE_NAME#
------------------------------------------

Здравствуйте!

Вы получили это сообщение, так как модуль проактивной защиты сервера #SERVER_NAME# обнаружил код, похожий на вирус.

1. Подозрительный код был вырезан из html.
2. Проверьте журнал вторжений и убедитесь, что код действительно вредоносный, а не является кодом какого-либо счетчика или фреймворка.
 (ссылка: http://#SERVER_NAME#/bitrix/admin/event_log.php?lang=ru&set_filter=Y&find_type=audit_type_id&find_audit_type[]=SECURITY_VIRUS )
3. В случае, если код не является опасным, добавьте его в исключения на странице настройки антивируса.
 (ссылка: http://#SERVER_NAME#/bitrix/admin/security_antivirus.php?lang=ru&tabControl_active_tab=exceptions )
4. Если код является вирусным, то необходимо выполнить следующие действия:

 а) Смените пароли доступа к сайту у администраторов и ответственных сотрудников.
 б) Смените пароли доступа по ssh и ftp.
 в) Проверьте и вылечите компьютеры администраторов, имевших доступ к сайту по ssh или ftp.
 г) В программах доступа к сайту по ssh и ftp отключите сохранение паролей.
 д) Удалите вредоносный код из зараженных файлов. Например, восстановите поврежденные файлы из самой свежей резервной копии.

---------------------------------------------------------------------
Сообщение сгенерировано автоматически.
";
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_NAME"] = "Подтверждение входа по СМС";
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_DESC"] = "#USER_PHONE# - номер телефона
#CODE# - код подтверждения
";
$MESS["SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS"] = "#CODE# — код подтверждения для входа в Битрикс24";
$MESS['SEC_EVENT_USER_OTP_NAME'] = 'Одноразовый пароль';
$MESS['SEC_EVENT_USER_OTP_DESC'] = '#USER_ID# - ID пользователя
#EMAIL# - Резервный email для одноразового пароля
#LOGIN# - Логин
#CODE# - Одноразовый пароль
#DATE# - Дата и время
#DEVICE# - Тип устройства
#BROWSER# - Название браузера
#PLATFORM# - Платформа
#DEVICE_INFO# - Комбинированная информация об устройстве
#USER_AGENT# - User Agent браузера
#IP# - IP-адрес
#COUNTRY# - Страна
#REGION# - Регион
#CITY# - Город
#LOCATION# - Комбинированное местоположение
#HELP_URL# - Ссылка на документацию
';
$MESS['SEC_TEMPLATE_USER_OTP_SUBJECT'] = '#SITE_NAME#: Одноразовый пароль';
$MESS['SEC_TEMPLATE_USER_OTP_MESSAGE'] = 'В ваш аккаунт на #SERVER_NAME# выполнен вход и запрошен одноразовый пароль:
				
#CODE#
				
Проверьте данные и убедитесь, что это были вы.

Дата: #DATE#
Логин: #LOGIN#
Устройство: #DEVICE_INFO#
Браузер: #USER_AGENT#
IP-адрес: #IP#
Местоположение: #LOCATION#

Если это не вы, рекомендуем как можно скорее сменить пароль. 

Подробнее о защите аккаунта: #HELP_URL#
';
$MESS['SEC_EVENT_USER_OTP_CONFIRM_NAME'] = 'Подтверждение резервного email';
$MESS['SEC_EVENT_USER_OTP_CONFIRM_DESC'] = '#USER_ID# - ID пользователя
#EMAIL# - Резервный email для одноразового пароля
#LOGIN# - Логин
#CODE# - Код подтверждения
#DATE# - Дата и время
';
$MESS['SEC_TEMPLATE_USER_OTP_CONFIRM_SUBJECT'] = '#SITE_NAME#: Код для подтверждения почты';
$MESS['SEC_TEMPLATE_USER_OTP_CONFIRM_MESSAGE'] = 'Скопируйте код для подтверждения почты и вставьте его в Битрикс24:
				
#CODE#
				
Если вы получили это письмо по ошибке, проигнорируйте его.

Ваш Битрикс24: #SERVER_NAME#
Логин для входа: #LOGIN#
Дата: #DATE#
';
?>