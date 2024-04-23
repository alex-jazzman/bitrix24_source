<?
$MESS["SECURITY_SITE_CHECKER_EnvironmentTest_NAME"] = "Перевірка налаштувань оточення";
$MESS["SECURITY_SITE_CHECKER_COLLECTIVE_SESSION"] = "Імовірно в директорії зберігання сесій знаходяться сесії різних проєктів";
$MESS["SECURITY_SITE_CHECKER_COLLECTIVE_SESSION_DETAIL"] = "Залежно від ситуації це може призвести до повної компрометації ресурсу";
$MESS["SECURITY_SITE_CHECKER_COLLECTIVE_SESSION_RECOMMENDATION"] = "Використовувати окреме сховище для кожного проєкту";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP"] = "PHP скрипти виконуються в директорії зберігання завантажуваних файлів";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP_DETAIL"] = "Розробники іноді забувають про правильну фільтрацію імен файлів, якщо це трапиться зловмисник зможе повністю скомпрометувати ресурс";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP_RECOMMENDATION"] = "Коректно налаштувати веб-сервер";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP_DOUBLE"] = "PHP скрипти з подвійним розширенням (eg php.lala) виконуються на директорії зберігання завантажуваних файлів";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP_DOUBLE_DETAIL"] = "Розробники іноді забувають про правильну фільтрацію імен файлів, якщо це трапиться зловмисник зможе повністю скомпрометувати ресурс";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PHP_DOUBLE_RECOMMENDATION"] = "Коректно налаштувати веб-сервер";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PY"] = "Py скрипти виконуються в директорії зберігання завантажуваних файлів";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PY_DETAIL"] = "Розробники іноді забувають про правильну фільтрацію імен файлів, якщо це трапиться зловмисник зможе повністю скомпрометувати ресурс";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_EXECUTABLE_PY_RECOMMENDATION"] = "Коректно налаштувати веб-сервер";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_HTACCESS"] = ". htaccess файли не повинні оброблятися Apache в директорії зберігання завантажуваних файлів";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_HTACCESS_DETAIL"] = "Розробники іноді забувають про правильну фільтрацію імен файлів, якщо це трапиться зловмисник зможе повністю скомпрометувати ресурс";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_HTACCESS_RECOMMENDATION"] = "Коректно налаштувати веб-сервер";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_NEGOTIATION"] = "Apache Content Negotiation дозволений в директорії зберігання завантажуваних файлів";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_NEGOTIATION_DETAIL"] = "Apache Content Negotiation не рекомендований для використання, тому що може служити джерелом XSS нападу";
$MESS["SECURITY_SITE_CHECKER_UPLOAD_NEGOTIATION_RECOMMENDATION"] = "Коректно налаштувати веб-сервер";
$MESS["SECURITY_SITE_CHECKER_SESSION_DIR"] = "Директорія зберігання файлів сесій доступна для всіх системних користувачів";
$MESS["SECURITY_SITE_CHECKER_SESSION_DIR_DETAIL"] = "Це може дозволити читати / змінювати сесійні дані, через скрипти інших віртуальних серверів";
$MESS["SECURITY_SITE_CHECKER_SESSION_DIR_RECOMMENDATION"] = "Коректно налаштувати файлові права або змінити директорію зберігання або включити зберігання сесій в БД: <a href=\"/bitrix/admin/security_session.php\">Захист сесій</a>";
$MESS["SECURITY_SITE_CHECKER_SESSION_DIR_ADDITIONAL"] = "Директорія зберігання сесій: #DIR#<br>
Права: #PERMS#
";
$MESS["SECURITY_SITE_CHECKER_COLLECTIVE_SESSION_ADDITIONAL_OWNER"] = "Причина: власник файлу відрізняється від поточного користувача <br>
Файл: #FILE# <br>
UID власника файлу: #FILE_ONWER# <br>
UID поточного користувача: #CURRENT_OWNER# <br>
";
$MESS["SECURITY_SITE_CHECKER_COLLECTIVE_SESSION_ADDITIONAL_SIGN"] = "Причина: файл сесії не містить підпису поточного сайту <br>
Файл: #FILE#<br>
Підпис поточного сайту: #SIGN#<br>
Вміст файлу: <pre> #FILE_CONTENT# </pre>
";
$MESS["SECURITY_SITE_CHECKER_PHP_PRIVILEGED_USER"] = "PHP працює від імені привілейованого користувача";
$MESS["SECURITY_SITE_CHECKER_PHP_PRIVILEGED_USER_DETAIL"] = "Робота PHP від імені привілейованого користувача (наприклад, root) може позначитися на безпеці вашого проєкту";
$MESS["SECURITY_SITE_CHECKER_PHP_PRIVILEGED_USER_RECOMMENDATION"] = "Налаштувати сервер таким чином, щоб PHP працював від імені непривілейованого користувача";
$MESS["SECURITY_SITE_CHECKER_PHP_PRIVILEGED_USER_ADDITIONAL"] = "#UID#/#GID#";
$MESS["SECURITY_SITE_CHECKER_BITRIX_TMP_DIR"] = "Тимчасові файли зберігаються в межах кореневої директорії проєкту";
$MESS["SECURITY_SITE_CHECKER_BITRIX_TMP_DIR_DETAIL"] = "Зберігання тимчасових файлів, створюваних при використанні CTempFile, в межах кореневої директорії проєкту не рекомендовано і несе з собою низку ризиків.";
$MESS["SECURITY_SITE_CHECKER_BITRIX_TMP_DIR_RECOMMENDATION"] = "Необхідно визначити константу \"BX_TEMPORARY_FILES_DIRECTORY\" в \"bitrix/php_interface/dbconn.php\" із зазначенням необхідного шляху.<br>
Виконайте наступні кроки:<br>
1. Виберіть директорію поза кореня проєкту. Наприклад, це може бути \"/home/bitrix/tmp/www\"<br>
2. Створіть її. Для цього виконайте наступну комманду:
<pre>
mkdir -p -m 700 /повний/шлях/до/директорії
</pre>
3. У файлі \"bitrix/php_interface/dbconn.php\" визначте відповідну константу, що б система почала використовувати цю директорію:
<pre>
define(\"BX_TEMPORARY_FILES_DIRECTORY\", \"/повний/шлях/до/директорії\");
</pre>";
$MESS["SECURITY_SITE_CHECKER_BITRIX_TMP_DIR_ADDITIONAL"] = "Поточна директорія: #DIR#";
?>