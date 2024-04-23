<?
$MESS["SECURITY_SITE_CHECKER_SiteConfigurationTest_NAME"] = "Перевірка налаштувань сайту";
$MESS["SECURITY_SITE_CHECKER_WAF_OFF"] = "Проактивний фільтр вимкнений";
$MESS["SECURITY_SITE_CHECKER_WAF_OFF_DETAIL"] = "Вимкнений проактивний фільтр не зможе відбити спроби нападу на ресурс";
$MESS["SECURITY_SITE_CHECKER_WAF_OFF_RECOMMENDATION"] = "Увімкнути проактивний фільтр: <a href=\"/bitrix/admin/security_filter.php\" target=\"_blank\">Проактивний фільтр</a>";
$MESS["SECURITY_SITE_CHECKER_REDIRECT_OFF"] = "Захист редиректів вимкнений";
$MESS["SECURITY_SITE_CHECKER_REDIRECT_OFF_DETAIL"] = "Редирект на довільний сторонній ресурс може служити підмогою для безлічі атак, захист редиректів виключає дану можливість (при використанні стандартного API)";
$MESS["SECURITY_SITE_CHECKER_REDIRECT_OFF_RECOMMENDATION"] = "Увімкнути захист редиректів: <a href=\"/bitrix/admin/security_redirect.php\" target=\"_blank\">Захист редиректів</a>";
$MESS["SECURITY_SITE_CHECKER_ADMIN_SECURITY_LEVEL"] = "Рівень безпеки адміністративної групи не є підвищеним";
$MESS["SECURITY_SITE_CHECKER_ADMIN_SECURITY_LEVEL_DETAIL"] = "Знижений рівень безпеки адміністративної групи може значно допомогти зловмисникові";
$MESS["SECURITY_SITE_CHECKER_ADMIN_SECURITY_LEVEL_RECOMMENDATION"] = "Підвищити рівень безпеки адміністративної групи";
$MESS["SECURITY_SITE_CHECKER_ERROR_REPORTING"] = "Рівень виведення помилок повинен бути \"тільки помилки\" або \"не виводити\"";
$MESS["SECURITY_SITE_CHECKER_ERROR_REPORTING_DETAIL"] = "Відображення попереджень php може дозволити дізнатися повний фізичний шлях до вашого проєкту";
$MESS["SECURITY_SITE_CHECKER_ERROR_REPORTING_RECOMMENDATION"] = "Змінити рівень виведення помилок на \"не виводити\": <a href=\"/bitrix/admin/settings.php?mid=main\" target=\"_blank\">Налаштування головного модуля </a>";
$MESS["SECURITY_SITE_CHECKER_DB_DEBUG"] = "Включено налагодження SQL запитів (\$DBDebug у значенні true)";
$MESS["SECURITY_SITE_CHECKER_DB_DEBUG_DETAIL"] = "Налагодження SQL запитів може розкрити важливу інформацію про ресурс";
$MESS["SECURITY_SITE_CHECKER_DB_DEBUG_RECOMMENDATION"] = "Вимкнути, встановивши значення змінної \$DBDebug в false";
$MESS["SECURITY_SITE_CHECKER_DB_EMPTY_PASS"] = "Пароль до бази даних порожній";
$MESS["SECURITY_SITE_CHECKER_DB_EMPTY_PASS_DETAIL"] = "Порожній пароль до БД підвищує ризик злому облікового запису в базі даних";
$MESS["SECURITY_SITE_CHECKER_DB_EMPTY_PASS_RECOMMENDATION"] = "Встановити пароль";
$MESS["SECURITY_SITE_CHECKER_DB_SAME_REGISTER_PASS"] = "Символи пароля до БД в одному регістрі";
$MESS["SECURITY_SITE_CHECKER_DB_SAME_REGISTER_PASS_DETAIL"] = "Пароль занадто простий, що підвищує ризик злому облікового запису в базі даних";
$MESS["SECURITY_SITE_CHECKER_DB_SAME_REGISTER_PASS_RECOMMENDATION"] = "Використовувати різний регістр символів в паролі";
$MESS["SECURITY_SITE_CHECKER_DB_NO_DIT_PASS"] = "Пароль до БД не містить чисел";
$MESS["SECURITY_SITE_CHECKER_DB_NO_DIT_PASS_DETAIL"] = "Пароль занадто простий, що підвищує ризик злому облікового запису в базі даних";
$MESS["SECURITY_SITE_CHECKER_DB_NO_DIT_PASS_RECOMMENDATION"] = "Додати числа в пароль";
$MESS["SECURITY_SITE_CHECKER_DB_NO_SIGN_PASS"] = "Пароль до БД не містить спецсимволів (розділових знаків)";
$MESS["SECURITY_SITE_CHECKER_DB_NO_SIGN_PASS_DETAIL"] = "Пароль занадто простий, що підвищує ризик злому облікового запису в базі даних";
$MESS["SECURITY_SITE_CHECKER_DB_NO_SIGN_PASS_RECOMMENDATION"] = "Додати спецсимволи в пароль";
$MESS["SECURITY_SITE_CHECKER_DB_MIN_LEN_PASS"] = "Довжина пароля до БД менше 8 символів";
$MESS["SECURITY_SITE_CHECKER_DB_MIN_LEN_PASS_DETAIL"] = "Пароль занадто простий, що підвищує ризик злому облікового запису в базі даних";
$MESS["SECURITY_SITE_CHECKER_DB_MIN_LEN_PASS_RECOMMENDATION"] = "Збільшити довжину пароля";
$MESS["SECURITY_SITE_CHECKER_DANGER_EXTENSIONS"] = "Обмежено список потенційно небезпечних розширень файлів";
$MESS["SECURITY_SITE_CHECKER_DANGER_EXTENSIONS_DETAIL"] = "Список розширень файлів, які вважаються потенційно небезпечними, не містить всіх рекомендованих значень. Список розширень виконуваних файлів завжди повинен знаходитися в актуальному стані";
$MESS["SECURITY_SITE_CHECKER_DANGER_EXTENSIONS_RECOMMENDATION"] = "Ви завжди можете змінити список розширень виконуваних файлів в налаштуваннях сайту: <a href=\"/bitrix/admin/settings.php?mid=fileman\" target=\"_blank\">Управління структурою</a>";
$MESS["SECURITY_SITE_CHECKER_DANGER_EXTENSIONS_ADDITIONAL"] = "Поточні: #ACTUAL#<br>
Рекомендовані (без урахування налаштувань вашого сервера): #EXPECTED#<br>
Відсутні: #MISSING#";
$MESS["SECURITY_SITE_CHECKER_EXCEPTION_DEBUG"] = "Включено розширене виведення помилок";
$MESS["SECURITY_SITE_CHECKER_EXCEPTION_DEBUG_DETAIL"] = "Розширений висновок помилок може розкрити важливу інформацію про ресурс";
$MESS["SECURITY_SITE_CHECKER_EXCEPTION_DEBUG_RECOMMENDATION"] = "Вимкнути у файлі налаштувань .settings.php";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION"] = "Використовуються застарілі модулі платформи";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_DETAIL"] = "Доступні нові версії модулів";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_RECOMMENDATION"] = "Рекомендується своєчасно оновлювати модулі платформи, встановити рекомендовані оновлення: <a href=\"/bitrix/admin/update_system.php\" target=\"_blank\">Оновлення платформи</a>";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_ERROR"] = "Не вдалося перевірити доступність оновлень платформи";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_ERROR_DETAIL"] = "Можливо доступне оновлення системи SiteUpdate або у вашої копії продукту минув період отримання оновлень";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_ERROR_RECOMMENDATION"] = "Детальніше на сторінці: <a href=\"/bitrix/admin/update_system.php\" target=\"_blank\">Оновлення платформи</a>";
$MESS["SECURITY_SITE_CHECKER_MODULES_VERSION_ARRITIONAL"] = "Модулі для яких доступні оновлення: <br>#MODULES#";
?>