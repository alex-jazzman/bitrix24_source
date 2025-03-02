<?
$MESS["DAV_HELP_NAME"] = "Модуль DAV";
$MESS["DAV_HELP_TEXT"] = "Модуль DAV дозволяє синхронізувати календарі та контакти сайту з будь-якими програмами і пристроями, що
підтримують протоколи CalDAV і CardDAV. Ці протоколи підтримують, наприклад, мобільні пристрої iPhone і iPad.
Також підтримка протоколів присутній в програмах Mozilla Sunbird, eM Client і деяких інших.<br><br>
<ul>
 <li><b><a href=\"#carddav\">Підключення по протоколу CardDAV</a></b></li>
 <li><b><a href=\"#caldav\"> Підключення по протоколу CalDAV</a></b>
 <ul>
  <li><a href=\"#caldavipad\">Підключення iPhone/iPad</a></li>
  <li><a href=\"#carddavsunbird\">Підключення Mozilla Sunbird</a></li>
 </ul>
 </li>
</ul>

<br>

<h3><a name=\"carddav\"></a> Підключення по протоколу CardDAV</h3>

Для того, щоб налаштувати підтримку CardDAV в пристроях Apple, виконайте наступні дії: 
<ol>
<li>На пристрої Apple зайдіть в меню <b>Налаштування</b> &gt; <b>Облікові записи і паролі</b>.</li>
<li>Під списком облікових записів виберіть <b>Додати обліковий запис</b>.</li>
<li>Виберіть тип облікового запису CardDAV (<b>Інше</b> &gt; <b>Обліковий запис CardDAV</b>).</li>
<li>У налаштуваннях параметрів облікового запису задайте адресу цього сайту (#SERVER#) в якості сервера, а також ваші логін та пароль. </li>
<li>Якщо на сайті використовується двоетапна авторизація, то в якості пароля необхідно використовувати пароль з розділу профілю користувача: <b>Паролі застосунків</b> - <b>Список контактів</b>.</li>
<li>При необхідності після збереження запису можна зайти в його редагування і в розділі <b>Додатково</b> задати порт сайту.</li>
</ol>

Ваші контакти автоматично з'являться в застосунку \"Контакти\".<br>
Які контакти порталу синхронізувати можна вибрати в своєму профілі користувача в меню дій <b>Синхронізація</b>.

<br><br>

<h3><a name=\"caldav\"></a>Підключення по протоколу CalDAV</h3>

<h4><a name=\"caldavipad\"></a>Підключення iPhone/iPad</h4>

Для того, чтобы настроить поддержку CalDAV в устройствах Apple, выполните следующие действия:
<ol>
<li>На пристрої Apple зайдіть в меню <b>Налаштування</b> &gt; <b>Облікові записи і паролі</b>.</li>
<li>Під списком облікових записів виберіть <b>Додати обліковий запис</b>.</li>
<li>Виберіть тип облікового запису CalDAV (<b>Інше</b> &gt; <b>Обліковий запис CalDAV</b>).</li>
<li>У налаштуваннях параметрів облікового запису задайте адресу цього сайту (#SERVER#) в якості сервера, а також ваші логін та пароль.</li>
<li>Якщо на сайті використовується двоетапна авторизація, то в якості пароля необхідно використовувати пароль з розділу профілю користувача: <b>Паролі застосунків</b> - <b>Календар</b>.</li>
<li>При необхідності після збереження запису можна зайти в його редагування і в розділі <b>Додатково</b> задати порт сайту.</li>
</ol>

Ваші контакти автоматично з'являться в застосунку \"Календар\".<br>
При необхідності підключення календарів інших користувачів або календарів груп необхідно відповідно задати посилання в розділі <b>Додатково</b> - <b>URL облікового запису</b>:<br>
<i>#SERVER#/bitrix/groupdav.php/код сайту/ім’я користувача/calendar/</i><br>
и<br>
<i>#SERVER#/bitrix/groupdav.php/код сайту/group-код групи/calendar/</i>

<br><br>

<h4><a name=\"carddavsunbird\"></a>Підключення Mozilla Sunbird</h4>

Щоб налаштувати підтримку CalDAV в Mozilla Sunbird, виконайте наступні дії:
<ol>
<li>Відкрийте застосунок Mozilla Sunbird і виберіть <b>Файл</b> &gt; <b>Новий календар</b>.</li>
<li>Виберіть пункт <b>В мережі</b> (<b>On the Network</b>) і натисніть кнопку <b>Далі</b>.</li>
<li>Виберіть формат <b>CalDAV</b>.</li>
<li>В поле <b>Адреса</b> (<b>Location</b>) введіть<br>
<i>#SERVER#/bitrix/groupdav.php/код сайту/ім’я користувача/calendar/код календаря/</i><br>
або<br>
<i>#SERVER#/bitrix/groupdav.php/код сайту/group-код групи/calendar/код календаря/</i><br>
і натисніть кнопку <b>Далі</b>.</li>
<li>Задайте ім'я та виберіть колір для вашого календаря.</li>
<li>У спливаючому вікні введіть ваше ім'я користувача та пароль.</li>
<li>Якщо на сайті використовується двоетапна авторизація, то в якості пароля необхідно використовувати пароль з розділу профілю користувача: <b>Паролі застосунків</b> - <b>Календар</b>.</li>
</ol>

Ваші календарі з'являться в застосунку Mozilla Sunbird.<br>
";
?>