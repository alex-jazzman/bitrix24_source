<?
$MESS["INTR_MAIL_DOMAIN_TITLE"] = "Якщо ваш домен налаштований для роботи в Яндекс.Пошті для домену, просто вкажіть доменне ім'я та токен у формі нижче";
$MESS["INTR_MAIL_DOMAIN_TITLE2"] = "До вашого порталу підключений домен";
$MESS["INTR_MAIL_DOMAIN_TITLE3"] = "Домен для вашої пошти";
$MESS["INTR_MAIL_DOMAIN_INSTR_TITLE"] = "Для підключення свого домену до Бітрікс24 вам необхідно виконати декілька кроків.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1"] = "Крок 1. Підтвердити володіння доменом";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2"] = "Крок 2. Налаштувати MX-записи";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_PROMPT"] = "Якщо ви є власником зазначеного домену, підтвердіть це будь-яким з наступних способів:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_OR"] = "або";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_A"] = "Завантажте в кореневий каталог вашого сайту файл з ім'ям <b>#SECRET_N#.Html</b> і містить текст <b>#SECRET_C#</b>";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B"] = "Для налаштування CNAME-запису у вас повинен бути доступ до редагування DNS-записів вашого домену у вашого реєстратора або хостинг-провайдера. Зазвичай такий доступ надається через веб-інтерфейс.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_PROMPT"] = "Необхідно вказати наступні налаштування:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_TYPE"] = "Тип запису:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_NAME"] = "Ім'я запису:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_NAMEV"] = "<b>yamail-#SECRET_N# </b> (або <b>yamail-#SECRET_N#.#DOMAIN#.</b> з точкою на кінці, залежно від інтерфейсу)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_VALUE"] = "Значення:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_B_VALUEV"] = "<b>mail.yandex.ru.</b> (точка на кінці адреси істотна)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_C"] = "Вкажіть адресу <b>#SECRET_N#@yandex.ru</b> в якості контактного поштової адреси в реєстраційних даних вашого домену. Ця операція проводиться за допомогою інструментів вашого реєстратора доменів.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_C_HINT"] = "Одразу після підтвердження домену необхідно поміняти цю адресу на ваш дійсний e-mail.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP1_HINT"] = "Якщо у вас виникли питання або проблеми, пов'язані з підтвердженням домену, <a href=\"http://dev.1c-bitrix.ru/support/\" target=\"_blank\"> звертайтеся до служби підтримки</a>.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_PROMPT"] = "Після того, як ви підтвердите володіння доменом, від вас буде потрібно змінити MX-записи, які йому відповідають. Ця операція проводиться за допомогою інструментів хостинг-провайдера, який обслуговує ваш домен.";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_TITLE"] = "Налаштування MX-запису";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_MXPROMPT"] = "Заведіть новий MX-запис з наступними параметрами:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_TYPE"] = "Тип запису:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_NAME"] = "Ім'я запису:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_NAMEV"] = "<b>@</b> (або <b>#DOMAIN#.</b> з точкою на кінці, залежно від інтерфейсу)";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_VALUE"] = "Значення:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_VALUEV"] = "<b>mx.yandex.net.</b>";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_PRIORITY"] = "Пріоритет:";
$MESS["INTR_MAIL_DOMAIN_INSTR_STEP2_HINT"] = "Видаліть всі колишні MX-записи та TXT-записи, які не вказують на сервери Яндекса. Процес поширення інформації про зміну MX-записів може зайняти від декількох годин до двох-трьох діб.";
$MESS["INTR_MAIL_DOMAIN_STATUS_TITLE"] = "Статус підключення домену";
$MESS["INTR_MAIL_DOMAIN_STATUS_TITLE2"] = "Домен підтверджений";
$MESS["INTR_MAIL_DOMAIN_STATUS_CONFIRM"] = "Підтверджено";
$MESS["INTR_MAIL_DOMAIN_STATUS_NOCONFIRM"] = "Не підтверджений";
$MESS["INTR_MAIL_DOMAIN_STATUS_NOMX"] = "MX-записи не налаштовані";
$MESS["INTR_MAIL_DOMAIN_HELP"] = "Якщо ваш домен ще не налаштований для роботи в Яндекс.Пошті для домену, виконайте наступні дії:
<br/><br/>
- <a href=\"https://passport.yandex.ru/registration/\" target=\"_blank\">Заведіть акаунт</a> в Яндекс.Пошті або використовуйте вже наявний<br/>
- <a href=\"https://pdd.yandex.ru/domains_add/\" target=\"_blank\">Підключіть домен</a> до Яндекс.Пошти для домена <sup>(<a href=\"http://help.yandex.ru/pdd/add-domain/add-exist.xml\" target=\"_blank\" title=\"Як підключити?\">?</a>)</sup><br/>
- Підтвердіть володіння доменом <sup>(<a href=\"http://help.yandex.ru/pdd/confirm-domain.xml\" target=\"_blank\" title=\"Як підтвердити?\">?</a>)</sup><br/>
- Налаштуйте MX-записи <sup>(<a href=\"http://help.yandex.ru/pdd/records.xml#mx\" target=\"_blank\" title=\"Як налаштувати MX-записи?\">?</a>)</sup> ибо делегуйте свій домен на Яндекс <sup>(<a href=\"http://help.yandex.ru/pdd/hosting.xml#delegate\" target=\"_blank\" title=\"Як делегувати домен на Яндекс?\">?</a>)</sup>
<br/><br/>
Після того, як всі налаштування на стороні Яндекс.Пошти для домену виконані, підключіть домен до свого порталу:
<br/><br/>
- <a href=\"https://pddimp.yandex.ru/api2/admin/get_token\" target=\"_blank\" onclick=\"window.open(this.href, '_blank', 'height=480,width=720,top='+parseInt(screen.height/2-240)+',left='+parseInt(screen.width/2-360)); return false; \">Отримайте токен</a> (у вікні, що відкрилося, заповніть форму та натисніть кнопку \"Get token\", скопіюйте отриманий токен)<br/>
- Вкажіть домен и токен у формі";
$MESS["INTR_MAIL_INP_CANCEL"] = "Скасування";
$MESS["INTR_MAIL_INP_DOMAIN"] = "Доменне ім'я";
$MESS["INTR_MAIL_INP_TOKEN"] = "Токен";
$MESS["INTR_MAIL_GET_TOKEN"] = "отримати";
$MESS["INTR_MAIL_INP_PUBLIC_DOMAIN"] = "Дозволити співробітникам реєструвати ящики в новому домені";
$MESS["INTR_MAIL_DOMAIN_SAVE"] = "Зберегти";
$MESS["INTR_MAIL_DOMAIN_SAVE2"] = "Підключити";
$MESS["INTR_MAIL_DOMAIN_WHOIS"] = "Перевірити";
$MESS["INTR_MAIL_DOMAIN_REMOVE"] = "Відключити";
$MESS["INTR_MAIL_DOMAIN_CHECK"] = "Перевірити";
$MESS["INTR_MAIL_DOMAINREMOVE_CONFIRM"] = "Відключити домен?";
$MESS["INTR_MAIL_DOMAINREMOVE_CONFIRM_TEXT"] = "Ви дійсно хочете відключити домен? <br> Всі підключення до порталу ящики теж будуть відключені!";
$MESS["INTR_MAIL_CHECK_TEXT"] = "Остання перевірка #DATE#";
$MESS["INTR_MAIL_CHECK_JUST_NOW"] = "тільки що";
$MESS["INTR_MAIL_CHECK_TEXT_NA"] = "Немає даних про стан домену";
$MESS["INTR_MAIL_CHECK_TEXT_NEXT"] = "Наступна перевірка через #DATE#";
$MESS["INTR_MAIL_MANAGE"] = "Налаштувати скриньки співробітникам";
$MESS["INTR_MAIL_DOMAIN_NOCONFIRM"] = "Домен не підтверджений";
$MESS["INTR_MAIL_DOMAIN_NOMX"] = "MX-записи не налаштовані";
$MESS["INTR_MAIL_DOMAIN_WAITCONFIRM"] = "У черзі";
$MESS["INTR_MAIL_DOMAIN_WAITMX"] = "MX-записи не налаштовані";
$MESS["INTR_MAIL_AJAX_ERROR"] = "Помилка при виконанні запиту";
$MESS["INTR_MAIL_DOMAIN_CHOOSE_TITLE"] = "Підібрати домен";
$MESS["INTR_MAIL_DOMAIN_CHOOSE_HINT"] = "Виберіть ім'я в зоні .ru";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_WAIT"] = "Пошук варіантів...";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_TITLE"] = "Придумайте інше ім'я або виберіть";
$MESS["INTR_MAIL_DOMAIN_SUGGEST_MORE"] = "Показати інші варіанти";
$MESS["INTR_MAIL_DOMAIN_EULA_CONFIRM"] = "Я приймаю умови <a href=\"http://www.bitrix24.ru/about/domain.php\" target=\"_blank\"> Угоди користувача </a>";
$MESS["INTR_MAIL_DOMAIN_EMPTY_NAME"] = "Введіть ім'я";
$MESS["INTR_MAIL_DOMAIN_SHORT_NAME"] = "Мінімум  2 символи перед .ru";
$MESS["INTR_MAIL_DOMAIN_LONG_NAME"] = "Максимум  63 символи перед .ru";
$MESS["INTR_MAIL_DOMAIN_BAD_NAME"] = "Неприпустиме ім'я";
$MESS["INTR_MAIL_DOMAIN_BAD_NAME_HINT"] = "Ім'я домену може складатися з латинських букв, цифр і дефісів (не може починатися або закінчуватися дефісом, не може містити дефіс на 3 і 4 позиціях одночасно). Після імені повинна бути вказана зона <b> .ru <b>";
$MESS["INTR_MAIL_DOMAIN_NAME_OCCUPIED"] = "ім'я  зайнято";
$MESS["INTR_MAIL_DOMAIN_NAME_FREE"] = "ім'я вільне";
$MESS["INTR_MAIL_DOMAIN_REG_CONFIRM_TITLE"] = "Перевірте, будь ласка, коректність зазначеного імені домена.";
$MESS["INTR_MAIL_DOMAIN_REG_CONFIRM_TEXT"] = "Після підключення ви не зможете змінити ім'я поточного домену <br> або отримати новий, так як ви можете зареєструвати <br> тільки один домен для вашого Бітрікс24. <br> <br> Якщо обране ім'я <b>#DOMAIN#</b> є коректним, підтвердіть підключення домену.";
$MESS["INTR_MAIL_DOMAIN_SETUP_HINT"] = "Підтвердження домену може зайняти від 1 години до декількох діб.";
?>