<?php
$module_id = 'sotbit.restapi';
$MESS[$module_id."_TITLE_SETTINGS"] = "Сотбит: REST API";

$MESS[$module_id."_TAB_MAIN"] = "Настройки";
$MESS[$module_id."_TAB_AUTH"] = "Авторизация";

$MESS[$module_id."_OPTION_MAIN"] = "Общие";
$MESS[$module_id."_OPTION_AUTH"] = "Токен";

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

$MESS[$module_id."_ERROR_DEMO"] = 'Решение <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">"Сотбит: REST API"</a> работает в демо-режиме в течение 14 дней. Вы можете его приобрести по адресу: <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/</a>';
$MESS[$module_id."_ERROR_DEMO_END"] = 'Демо-режим закончен. Приобрести полнофункциональную версию вы можете по адресу: <a target="_blank" title="Сотбит: REST API" href="https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/">https://marketplace.1c-bitrix.ru/solutions/sotbit.restapi/</a>';
$MESS[$module_id."_ERROR_PHP_VERSION"] = 'Модуль отключен. Необходимая минимальная версия PHP 7.2';
$MESS[$module_id."_ERROR_SUPPORT_MODULE"] = 'Модуль "Техподдержка" не установлен';

$MESS[$module_id."_DAY_1"] = 'день';
$MESS[$module_id."_DAY_2"] = 'дня';
$MESS[$module_id."_DAY_3"] = 'дней';

$MESS[$module_id."_MONTH_1"] = 'месяц';
$MESS[$module_id."_MONTH_2"] = 'месяца';
$MESS[$module_id."_MONTH_3"] = 'месяцев';

$MESS[$module_id."_YEAR_1"] = 'год';
$MESS[$module_id."_YEAR_2"] = 'года';
$MESS[$module_id."_YEAR_3"] = 'лет';