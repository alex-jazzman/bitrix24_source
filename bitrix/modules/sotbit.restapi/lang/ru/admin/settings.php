<?php
$module_id = 'sotbit.restapi';
$MESS[$module_id."_TITLE_SETTINGS"] = "Сотбит: REST API";

$MESS[$module_id."_TAB_MAIN"] = "Общие";
$MESS[$module_id."_TAB_AUTH"] = "Авторизация";
$MESS[$module_id."_TAB_CONFIG"] = "Данные";
$MESS[$module_id."_TAB_ROUTE"] = "Маршруты";

$MESS[$module_id."_TAB_CONFIG_WARNING_TEXT"] = "Не влияют на настройки мобильного приложения Sotbit.B2BMobile, изменяются в настройках самого модуля";


$MESS[$module_id."_OPTION_GROUP_MAIN"] = "Общие";
$MESS[$module_id."_OPTION_GROUP_AUTH"] = "Токен";
$MESS[$module_id."_OPTION_GROUP_PERMISSIONS"] = "Права доступа";
$MESS[$module_id."_OPTION_GROUP_ROUTE"] = "Список маршрутов";
$MESS[$module_id."_OPTION_GROUP_CONFIG"] = "Данные по умолчанию";

$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_ACTIVE"] = "Активность каталога";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_CONNECT"] = "Выбор каталога";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_SETTING"] = "Настройка каталога";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_DATA"] = "Источник данных";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_VIEW"] = "Внешний вид";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_PRICES"] = "Цены";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_BASKET"] = "Добавление в корзину";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_SEARCH"] = "Настройки поиска";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_LIST"] = "Настройки списка";
$MESS[$module_id."_OPTION_GROUP_CONFIG_CATALOG_DETAIL"] = "Настройки детального просмотра";

$MESS[$module_id."_OPTION_ACTIVE"] = "Активность:";
$MESS[$module_id."_OPTION_ACTIVE_HELP"] = "Включает или выключает работу модуля.";
$MESS[$module_id."_OPTION_URL"] = "Путь к REST API:";
$MESS[$module_id."_OPTION_URL_HELP"] = "Адрес по которому будет доступен модуль Сотбит:REST API для запросов

Стандартный путь: /sotbit_api/";

$MESS[$module_id."_OPTION_URL_NOTES"] = "При использовании модуля <b>Сотбит:B2BMobile</b>, укажите путь /sotbit_api<br><br>
Пример REST API запроса: <br>
/sotbit_api/v1/orders/{id}<br>
sotbit_api - точка входа (Путь к REST API)<br>
v1 - версия API<br>
orders - сущность заказа<br>
{id} - ID заказа<br>";

$MESS[$module_id."_OPTION_DEBUG"] = "Режим отладки:";
$MESS[$module_id."_OPTION_DEBUG_HELP"] = "При включенной опции, в ответе будет указана дополнительная информация об ошибках";

$MESS[$module_id."_OPTION_LOG"] = "Ведение журнала запросов:";
$MESS[$module_id."_OPTION_LOG_HELP"] = "При включенной опции, будет вестись журнал запросов";

$MESS[$module_id."_OPTION_SECRET_KEY"] = "Секретный ключ:";
$MESS[$module_id."_OPTION_SECRET_KEY_HELP"] = "Секретный ключ используется при авторизации в модуле.
Рекомендуется в целях безопасности время от времени его менять.";

$MESS[$module_id."_OPTION_TOKEN_EXPIRE"] = "Время жизни токена:";
$MESS[$module_id."_OPTION_TOKEN_EXPIRE_HELP"] = "Токен выдается при авторизации в модуле, и используется для запросов.";

$MESS[$module_id."_OPTION_AFTER_TEXT_SEC"] = 'сек. <span id="tokenExpireResult"></span><br>
        <button id="tokenExpireYear">+год</button> 
        <button id="tokenExpireMonth">+месяц</button> 
        <button id="tokenExpireWeek">+неделя</button> 
        <button id="tokenExpireDay">+день</button>';

$MESS[$module_id."_BUTTON_GENERATION_LABEL"] = "Сгенерировать";

$MESS[$module_id."_OPTION_USER_GROUP"] = "Группы пользователей:";
$MESS[$module_id."_OPTION_USER_GROUP_HELP"] = "Выберите группы пользователей, которым будет открыт доступ для авторизации<br>
Если группы не выбраны, то авторизация будет доступна всем группам пользователей";


$MESS[$module_id."_EMPTY"] = "не выбрано";


$MESS[$module_id."_ERROR_DEMO"] = 'Решение <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">"Сотбит: REST API"</a> работает в демо-режиме в течение 14 дней. Вы можете его приобрести по адресу: <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/</a>';
$MESS[$module_id."_ERROR_DEMO_END"] = 'Демо-режим закончен. Приобрести полнофункциональную версию вы можете по адресу: <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/</a>';
$MESS[$module_id."_ERROR_PHP_VERSION"] = 'Модуль отключен. Необходимая минимальная версия PHP 7.2';
$MESS[$module_id."_ERROR_SUPPORT_MODULE"] = 'Модуль <a href="/bitrix/admin/module_admin.php?lang=ru">"Техподдержка (support)"</a> не установлен';
$MESS[$module_id."_ERROR_CATALOG_MODULE"] = 'Модуль <a href="/bitrix/admin/module_admin.php?lang=ru">"Торговый каталог (catalog)"</a> не установлен';
$MESS[$module_id."_ERROR_IBLOCK_MODULE"] = 'Модуль <a href="/bitrix/admin/module_admin.php?lang=ru">"Информационные блоки (iblock)"</a> не установлен';

$MESS[$module_id."_DAY_1"] = 'день';
$MESS[$module_id."_DAY_2"] = 'дня';
$MESS[$module_id."_DAY_3"] = 'дней';

$MESS[$module_id."_MONTH_1"] = 'месяц';
$MESS[$module_id."_MONTH_2"] = 'месяца';
$MESS[$module_id."_MONTH_3"] = 'месяцев';

$MESS[$module_id."_YEAR_1"] = 'год';
$MESS[$module_id."_YEAR_2"] = 'года';
$MESS[$module_id."_YEAR_3"] = 'лет';


$MESS[$module_id."_ROUTE_MAP_PATTERN"] = 'Путь';
$MESS[$module_id."_ROUTE_MAP_METHOD"] = 'Метод HTTP';




$MESS[$module_id."_OPTION_CONFIG_CATALOG_ACTIVE"] = "Активность";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ACTIVE_HELP"] = "При включенной опции, будет доступна работа с каталогом и товарами по REST API";

$MESS[$module_id."_OPTION_CONFIG_CATALOG_TYPE"] = "Тип инфоблока";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_TYPE_HELP"] = "Указывается один из созданных в системе типов информационных блоков.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ID"] = "Инфоблок";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ID_HELP"] = "Для выбранного типа инфоблоков указывается идентификатор информационного блока, из которого будет выводиться каталог товаров.";

$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE"] = "Недоступные товары";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_HELP"] = "Как отображать недоступные товары:<br>
Отображать в общем списке<br>
Отображать в конце<br>
Не отображать<br>
Недоступны товары, для которых количество меньше либо равно нулю, включен количественный учет и не разрешена покупка при отсутствии товара.
Товар с торговыми предложениями считается доступным, если хоть одно предложение доступно.
Доступность товара не означает, что его можно купить. Для покупки должны быть цены тех типов, по которым клиент может покупать.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS"] = "Недоступные торговые предложения";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_HELP"] = "	Указывается способ отображения недоступных для покупки торговых предложений:не отображать;
отображать все.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ADD_PICT_PROP"] = "Дополнительная картинка основного товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ADD_PICT_PROP_HELP"] = "Указывается свойство, в котором хранится дополнительная картинка товара.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LABEL_PROP"] = "Свойство меток товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LABEL_PROP_HELP"] = "Указываются свойство, в котором хранится метка товара (например, новинка).";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFER_ADD_PICT_PROP"] = "Дополнительные картинки предложения";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFER_ADD_PICT_PROP_HELP"] = "Задается свойство, в котором хранится дополнительная картинка для торгового предложения. Параметр доступен для инфоблока с торговыми предложениями.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFER_TREE_PROPS"] = "Свойства для отбора предложений";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFER_TREE_PROPS_HELP"] = "<a href=\"https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=42&amp;LESSON_ID=1986\" target=\"_blank\" rel=\"nofollow\">Указываются свойства, по значениям которых будут группироваться торговые предложения. Параметр доступен для инфоблока с торговыми предложениями.<br><br>Обратите внимание, что данный параметр недоступен при отмеченной опции Использовать параметры свойств в компонентах и формах . Подробнее читайте в</a>";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_DISCOUNT_PERCENT"] = "Показывать процент скидки";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_DISCOUNT_PERCENT_HELP"] = "При отмеченной опции будет отображаться процентное значение скидки, если она задана, станет доступно дополнительное поле .";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_OLD_PRICE"] = "Показывать старую цену";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_OLD_PRICE_HELP"] = "Если задана скидка на товар, то при отмеченной опции будет отображаться старая цена.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY"] = "Показывать остаток товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_HELP"] = "Укажите способ отображения остатка товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_MESS_NOT_AVAILABLE"] = "Сообщение об отсутствии товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_MESS_NOT_AVAILABLE_HELP"] = "Указывается текст, который будет отображаться при отсутствии товара и невозможности его купить.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_CODE"] = "Тип цены";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_CODE_HELP"] = "Указывается какой из типов цен будет выведен в каталоге.<br>Если не выбран ни один из типов цены, то будет выводиться минимальная из всех доступных.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_USE_PRICE_COUNT"] = "Использовать вывод цен с диапазонами";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_USE_PRICE_COUNT_HELP"] = "При отмеченной опции будут отображаться цены всех типов на товары.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_PRICE_COUNT"] = "Выводить цены для количества";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_PRICE_COUNT_HELP"] = "Параметр определяет количество единиц товара, для которых выводить стоимость.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_VAT_INCLUDE"] = "Включать НДС в цену";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_VAT_INCLUDE_HELP"] = "При отмеченной опции цены будут показаны с учетом НДС.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_VAT_SHOW_VALUE"] = "Отображать значение НДС";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRICE_VAT_SHOW_VALUE_HELP"] = "При отмеченной опции цены будут показаны величины НДС.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY"] = "Показывать цены в одной валюте";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY_HELP"] = "При установке флажка цены будут выводиться в одной валюте, даже если в каталоге они будут заданы в разных валютах, станет доступным дополнительное поле .";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY_ID"] = "Валюта, в которую будут сконвертированы цены";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_CONVERT_CURRENCY_ID_HELP"] = "";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ADD_PROPERTIES_TO_BASKET"] = "Добавлять в корзину свойства товаров и предложений";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ADD_PROPERTIES_TO_BASKET_HELP"] = "При отмеченной опции становятся доступными настройки выбора свойств товаров и предложений для передачи их в корзину и заказ.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRODUCT_CART_PROPERTIES"] = "Свойства товаров, добавляемые в корзину";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PRODUCT_CART_PROPERTIES_HELP"] = "";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFERS_CART_PROPERTIES"] = "Свойства предложений, добавляемые в корзину";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_OFFERS_CART_PROPERTIES_HELP"] = "При выборе пункта \"не выбрано\" будут добавлены все доступные свойства";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SEARCH_RESTART"] = "Искать без учета морфологии (при отсутствии результата поиска)";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SEARCH_RESTART_HELP"] = "При отмеченной опции с лучае отсутствия результата поиска будут выведены элементы, имеющие морфологические отклонения от поискового запроса.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_NO_WORD_LOGIC"] = "Отключить обработку слов как логических операторов";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_NO_WORD_LOGIC_HELP"] = "При снятой опции слова логических операторов (\"И\", \"ИЛИ\" и пр.) будут интерпретироваться только как лингвистическая часть поискового запроса.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_USE_LANGUAGE_GUESS"] = "Включить автоопределение раскладки клавиатуры";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_USE_LANGUAGE_GUESS_HELP"] = "При отмеченной опции будет включено автоопределение раскладки клавиатуры.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PAGE_ELEMENT_COUNT"] = "Количество элементов на странице";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_PAGE_ELEMENT_COUNT_HELP"] = "	Указывается количество элементов списка, отображаемых на одной странице.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD"] = "По какому полю сортируем товары в разделе";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD_HELP"] = "Указывается поле, по которому будет происходить сортировка товаров внутри каждого раздела:<br>
shows – по количеству просмотров в среднем;<br>
sort – по индексу сортировки;<br>
timestamp_x – по дате изменения;<br>
name – по названию;<br>
id – по идентификатору;<br>
active_from – по дате активности с;<br>
active_to – по дате активности по;<br>
SCALED_PRICE_[ID] – по типу цен (вместо [ID] - идентификатор типа цены)";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER"] = "Порядок сортировки товаров в разделе";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER_HELP"] = "Задается порядок сортировки товаров в разделе:<br>
asc – По возрастанию;<br>
desc – По убыванию.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD2"] = "Поле для второй сортировки товаров в разделе";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_FIELD2_HELP"] = "Указывается поле, по которому будет происходить вторая сортировка товаров внутри каждого раздела:<br>
shows – по количеству просмотров в среднем;<br>
sort – по индексу сортировки;<br>
timestamp_x – по дате изменения;<br>
name – по названию;<br>
id – по идентификатору;<br>
active_from – по дате активности с;<br>
active_to – по дате активности по;<br>
SCALED_PRICE_[ID] – по типу цен (вместо [ID] - идентификатор типа цены)";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER2"] = "Порядок второй сортировки товаров в разделе";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_ELEMENT_SORT_ORDER2_HELP"] = "Задается порядок второй сортировки товаров в разделе:<br>
asc – По возрастанию;<br>
desc – По убыванию.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_PROPERTY_CODE"] = "Свойства";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_PROPERTY_CODE_HELP"] = "<a href=\"https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=42&amp;LESSON_ID=1986\" target=\"_blank\" rel=\"nofollow\">Указываются свойства инфоблока, которые будут отображены в списке товаров внутри раздела. При выборе пункта (не выбрано)-&gt; и без указания кодов свойств в строках ниже, свойства выведены не будут.<br><br>Обратите внимание, что данный параметр недоступен при отмеченной опции Использовать параметры свойств в компонентах и формах . Подробнее читайте в</a>";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE"] = "Поля предложений";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_OFFERS_FIELD_CODE_HELP"] = "	Выбираются поля предложений для списка. С помощью клавиши Ctrl можно выбрать несколько значений. Данный параметр появляется при настройке компонента на инфоблок с поддержкой SKU.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE"] = "Свойства предложений";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_LIST_OFFERS_PROPERTY_CODE_HELP"] = "<a href=\"https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=42&amp;LESSON_ID=1986\" target=\"_blank\" rel=\"nofollow\">Указываются свойства предложений. Можно добавлять свои. Данный параметр появляется при настройке компонента на инфоблок с поддержкой SKU.<br><br>Обратите внимание, что данный параметр недоступен при отмеченной опции Использовать параметры свойств в компонентах и формах . Подробнее читайте в</a>";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_PROPERTY_CODE"] = "Свойства";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_PROPERTY_CODE_HELP"] = "<a href=\"https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=42&amp;LESSON_ID=1986\" target=\"_blank\" rel=\"nofollow\">Среди всех свойств, определенных для данного инфоблока, выбираются те, которые будут отображены при детальном просмотре элементов.<br><br>Обратите внимание, что данный параметр недоступен при отмеченной опции Использовать параметры свойств в компонентах и формах . Подробнее читайте в</a>";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_DEACTIVATED"] = "Показывать деактивированные товары";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_DEACTIVATED_HELP"] = "При отмеченной опции, будут отображаться также и неактивные товары.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_SKU_DESCRIPTION"] = "Отображать описание для каждого торгового предложения";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_SKU_DESCRIPTION_HELP"] = "При отмеченной опции для каждого торгового предложения будет отображено своё описание для анонса и детальное описание в детальной карточке товара, если они заполнены. Если нет - отобразится описание для анонса и детальное описание самого товара.Примечание: Параметр доступен с версии 20.5.0 модуля Информационные блоки.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_FIELD_CODE"] = "Поля предложений товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_FIELD_CODE_HELP"] = "Выбираются поля предложений. С помощью клавиши Ctrl можно выбрать несколько значений. Данный параметр появляется при настройке компонента на инфоблок с поддержкой SKU.";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_PROPERTY_CODE"] = "Свойства предложений";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_OFFERS_PROPERTY_CODE_HELP"] = "<a href=\"https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=42&amp;LESSON_ID=1986\" target=\"_blank\" rel=\"nofollow\">Указываются свойства предложений. Можно добавлять свои. Данный параметр появляется при настройке компонента на инфоблок с поддержкой SKU.<br><br>Обратите внимание, что данный параметр недоступен при отмеченной опции Использовать параметры свойств в компонентах и формах . Подробнее читайте в</a>";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_USE_VOTE_RATING"] = "Включить рейтинг товара";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_DETAIL_USE_VOTE_RATING_HELP"] = "При установленной опции для товаров будет включен рейтинг, станет доступно дополнительное поле .";





$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_1"] = "не отображать";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_2"] = "отображать в конце";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_3"] = "отображать в общем списке";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_1"] = "отображать только с возможностью подписки";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_HIDE_NOT_AVAILABLE_OFFERS_2"] = "отображать все";
$MESS[$module_id."_IBLOCK_SORT_ASC"] = "по возрастанию";
$MESS[$module_id."_IBLOCK_SORT_DESC"] = "по убыванию";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_Y"] = "с отображением реального остатка";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_M"] = "с подменой остатка текстом";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_N"] = "не показывать";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_MANY"] = "Много";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_MINI"] = "Мало";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_INT"] = "Значение, от которого происходит подмена";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT"] = "Текст для остатка";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_INT_HELP"] = "Сравнение происходит со значением, рассчитанным по формуле \"Доступное количество\"/\"Коэффициент единицы измерения\"";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_DEFAULT"] = "Наличие";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_MAX"] = "Текст для значения больше";
$MESS[$module_id."_OPTION_CONFIG_CATALOG_SHOW_MAX_QUANTITY_TEXT_MIN"] = "Текст для значения меньше";

