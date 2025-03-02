<?
$MESS["MCACHE_TITLE"] = "Настройки кеширования";
$MESS["MAIN_TAB_3"] = "Очистка файлов кеша";
$MESS["MAIN_TAB_4"] = "Кеширование компонентов";
$MESS["MAIN_OPTION_CLEAR_CACHE"] = "Очистка файлов кеша";
$MESS["MAIN_OPTION_PUBL"] = "Настройка кеширования компонентов";
$MESS["MAIN_OPTION_CLEAR_CACHE_OLD"] = "Только устаревшие";
$MESS["MAIN_OPTION_CLEAR_CACHE_ALL"] = "Все";
$MESS["MAIN_OPTION_CLEAR_CACHE_MENU"] = "Меню";
$MESS["MAIN_OPTION_CLEAR_CACHE_MANAGED"] = "Весь управляемый";
$MESS["MAIN_OPTION_CLEAR_CACHE_STATIC"] = "Все страницы HTML кеша";
$MESS["MAIN_OPTION_CLEAR_CACHE_LANDING"] = "Сайты24";
$MESS["MAIN_OPTION_CLEAR_CACHE_CLEAR"] = "Очистить";
$MESS["MAIN_OPTION_CACHE_ON"] = "Автокеширование компонентов включено";
$MESS["MAIN_OPTION_CACHE_OFF"] = "Автокеширование компонентов выключено";
$MESS["MAIN_OPTION_CACHE_BUTTON_OFF"] = "Выключить автокеширование";
$MESS["MAIN_OPTION_CACHE_BUTTON_ON"] = "Включить автокеширование";
$MESS["cache_admin_note4"] = "<p>Механизм HTML-кеширования лучше всего включить на какой-нибудь редко изменяющийся раздел с регулярным посещением анонимных посетителей, так как при включенном HTML-кешировании происходят следующие процессы:</p>
<ul style=\"font-size:100%\">
<li>механизмом HTML-кеша обрабатываются только страницы, не указанные в маске исключения и указанные в маске включения;</li>
<li>если на такие страницы заходит не авторизованный пользователь, то выполняется проверка существования файла кеша и если таковой найден, то выдается страница из кеша, не задействуя никакие модули продукта; например, не будет работать модуль статистики (не засчитаются хиты этого пользователя), модуль рекламы, главный и другие модули;</li>
<li>при этом, если на момент включения кеша был установлен модуль компрессии, то страница будет отдаваться в сжатом виде;</li>
<li>если страница в кеше не найдена, то код исполняется в обычном режиме; когда страница полностью сформирована, ее копия сохраняется в HTML-кеш;</li>
</ul>
<p>Oчистка кеша:</p>
<ul style=\"font-size:100%\">
<li>если сохраняемый объем приводит к превышению дисковой квоты кеша, то кеш полностью очищается;</li>
<li>так же полная очистка кеша происходит при любом изменении данных в административной части системы;</li>
<li>если в публичной части сайта происходит POST данных (например, добавление комментария или голосование), то сбрасывается соответствующая часть кеша;</li>
</ul>

<p>Необходимо отметить, что если неавторизованный пользователь перейдет в незакешированную часть сайта, то для него начнется сессия и для этого посетителя HTML-кеш работать больше не будет.</p>

<p>Из всего выше сказанного следует, что:</p>
<ul style=\"font-size:100%\">
<li>не ведется учет статистики;</li>
<li>модуль рекламы будет работать только в момент создания кеша (это не относится к внешней динамической рекламе (Begun и пр.);</li>
<li>например, для неавторизованных пользователей результаты сравнения товаров не будут сохранены (так как его данные хранятся в сессии, которой \"нет\");</li>
<li>необходимо обязательно задать дисковую квоту во избежание DoS-атаки по дисковому пространству;</li>
<li>после включения механизма HTML-кеширования необходимо проверить весь функционал раздела, к которому применен кеш (например, может не сработать публикация комментариев со старыми шаблонами блогов);</li>
</ul>
";
$MESS["MAIN_OPTION_CACHE_OK"] = "Файлы кеша очищены";
$MESS["MAIN_OPTION_CACHE_SUCCESS"] = "Тип автокеширования компонентов успешно переключен";
$MESS["MAIN_OPTION_CACHE_ERROR"] = "Тип автокеширования компонентов уже имеет данное значение";
$MESS["cache_admin_note1"] = "
<p>Использование режима &quot;Автокеширования&quot; позволяет ускорить работу вашего сайта в несколько раз!</p>
<p>Обратите внимание: при использовании режима &quot;Автокеширования&quot;, обновление информации, выводимой компонентами, происходит в соответствии с параметрами отдельных компонентов. </p>
<p>Для того чтобы обновить содержимое закешированных объектов на странице, вы можете: </p>
<p>1. Перейти на нужную страницу и обновить ее содержимое, используя специальную кнопку в административной панели для очистки закешированой информации.</p>
<img src=\"/bitrix/images/main/page_cache.png\" vspace=\"5\" />
<p>2. В режиме Редактирования сайта использовать кнопки для очистки кеша в панели отдельных компонентов.</p>
<img src=\"/bitrix/images/main/comp_cache.png\" vspace=\"5\" />
<p>3. Необходимо перейти к настройкам выбранных компонентов и перевести их в режим работы без кеширования. </p>
<img src=\"/bitrix/images/main/spisok.png\" vspace=\"5\" />
<p>Примечание: При включении режима автокеширования компонентов, компоненты с настройкой кеширования <i>\"Авто\"</i> будут переведены в режим работы с кешированием.</p>
<p>Компоненты с настройкой кеширования <i>\"Кешировать\"</i> и временем кеширования больше нуля, всегда работают в режиме кеширования.</p>
<p>Компоненты с настройкой кеширования <i>\"Не кешировать\"</i> или временем кеширования равным нулю, всегда работают без кеширования.</p>";
$MESS["cache_admin_note2"] = "После удаления файлов кеша выводимые данные будут обновлены до актуального состояния.
		Новые файлы кеша будут создаваться постепенно по мере обращений к страницам с закешированными областями.";
$MESS["main_cache_managed_saved"] = "Настройки управляемого кеширования сохранены.";
$MESS["main_cache_managed"] = "Управляемый кеш";
$MESS["main_cache_managed_sett"] = "Настройка управляемого кеширования";
$MESS["main_cache_managed_on"] = "Управляемый кеш компонентов включен.";
$MESS["main_cache_managed_off"] = "Управляемый кеш компонентов выключен (не рекомендуется).";
$MESS["main_cache_managed_turn_off"] = "Выключить управляемый кеш (не рекомендуется)";
$MESS["main_cache_managed_const"] = "Определена константа BX_COMP_MANAGED_CACHE - управляемый кеш всегда включен.";
$MESS["main_cache_managed_turn_on"] = "Включить управляемый кеш";
$MESS["main_cache_managed_note"] = "		Технология управляемого кеширования <b>Сache Dependencies</b> автоматически обновляет кеш компонентов при изменении данных.
		Если управляемое кеширование включено, вам не потребуется вручную обновлять кеш компонентов при изменении новостей или товаров, изменения сразу станут видны посетителям сайта.
		<br><br>Узнайте подробнее о технологии <a href=\"https://dev.1c-bitrix.ru/community/blogs/rsv/2074.php\">Сache Dependencies</a> на нашем сайте.
	<br><br>
	<span style=\"color:grey\">Замечание: не все компоненты могут поддерживать управляемое кеширование.</span>";
$MESS["cache_admin_note5"] = "В данной редакции HTML кеш всегда включен.";
$MESS["main_cache_wrong_cache_type"] = "Неверный тип кеширования.";
$MESS["main_cache_wrong_cache_path"] = "Неверный путь к файлу кеша.";
$MESS["main_cache_in_progress"] = "Идет удаление файлов кеша.";
$MESS["main_cache_finished"] = "Удаление файлов кеша завершено.";
$MESS["main_cache_files_scanned_count"] = "Обработано: #value#";
$MESS["main_cache_files_scanned_size"] = "Размер обработанных файлов: #value#";
$MESS["main_cache_files_deleted_count"] = "Удалено: #value#";
$MESS["main_cache_files_deleted_size"] = "Размер удаленных файлов: #value#";
$MESS["main_cache_files_delete_errors"] = "Ошибок удаления: #value#";
$MESS["main_cache_files_last_path"] = "Текущий каталог: #value#";
$MESS["main_cache_files_start"] = "Начать";
$MESS["main_cache_files_continue"] = "Продолжить";
$MESS["main_cache_files_stop"] = "Остановить";
?>