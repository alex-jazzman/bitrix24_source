<?php
$MESS['USER_MALE'] = "Мужской";
$MESS['USER_FEMALE'] = "Женский";
$MESS['USER_DONT_KNOW'] = "(неизвестно)";

$MESS['CORE_access_Tab'] = "Права доступа";
$MESS['CORE_access_title'] = "Настройка прав доступа";
$MESS['CORE_choice_color'] = "Выбор цвета";
$MESS['CORE_submit_save'] = "Сохранить";
$MESS['CORE_submit_cancel'] = "Отменить";
$MESS['CORE_edit1'] = "Настройки";
$MESS['CORE_OPTION_5'] = "Настройки";
$MESS['CORE_GLOBAL_MENU'] = 'Сотбит';
$MESS['CORE_GLOBAL_MENU_RESTAPI'] = 'Сотбит: REST API';
$MESS['CORE_SETTINGS'] = 'Настройки';
$MESS['CORE_DOCS'] = 'Документация';
$MESS['CORE_LOGS'] = 'Журнал запросов';

$MESS['EMPTY_USER_ID'] = 'Ошибка авторизации';
$MESS['ERROR_EVENT'] = 'Ошибка события';
$MESS['ERROR_AUTH_TOKEN_REQUIRED'] = 'Ошибка авторизации: отсутствует токен';
$MESS['ERROR_AUTH_TOKEN_INVALID'] = 'Ошибка авторизации: неверный токен';
$MESS['ERROR_AUTH_INCORRECT'] = 'Ошибка авторизации: неверный логин или пароль';
$MESS['ERROR_AUTH_INCORRECT'] = 'Ошибка авторизации: неверный логин или пароль';
$MESS['ERROR_AUTH_USER_DEACTIVATED'] = 'Ошибка авторизации: пользователь не активен';
$MESS['ERROR_AUTH'] = 'Доступ запрещен: Вы не авторизированы';

$MESS['ERROR_MODULE_SALE'] = 'Модуль Интернет-магазин (sale) не установлен';
$MESS['ERROR_MODULE_CATALOG'] = 'Модуль Торговый каталог (catalog) не установлен';
$MESS['ERROR_MODULE_SUPPORT'] = 'Модуль Техподдержка (support) не установлен';

$MESS['ERROR_ORDER_NOT_FOUND'] = 'Заказ не найден';
$MESS['ERROR_ORDER_OBJECT_INVALID'] = 'Неверный объект заказа';
$MESS['ERROR_ORDER_CANCEL'] = 'Заказ с кодом ##ID# невозможно отменить, так как он доставлен или оплачен.';

$MESS['ERROR_SUPPORT_TICKET_NOT_FOUND'] = 'Тикет не найден';
$MESS['ERROR_SUPPORT_MESSAGE_NOT_FOUND'] = 'Сообщение не найдено';
$MESS['ERROR_SUPPORT_FILE_NOT_FOUND'] = 'Файл не найден';
$MESS['ERROR_SUPPORT_FILE'] = 'Файл #FILE# превысил максимальный размер (#SIZE# Mb).';

$MESS['ERROR_USER_NOT_FOUND'] = 'Пользователь не найден';
$MESS['ERROR_SUPPORT_EMPTY_TICKET_ID'] = 'Не указан обязательный параметр: id';
$MESS['ERROR_SUPPORT_EMPTY_MESSAGE_ID'] = 'Не указан обязательный параметр: id';
$MESS['ERROR_SUPPORT_EMPTY_FILE_HASH'] = 'Не указан либо неверный обязательный параметр: хэш файла';
$MESS['ERROR_USER_ID_EMPTY'] = 'Не указан обязательный параметр: id';
$MESS['ERROR_USER_LOGIN_EMPTY'] = 'Не указан обязательный параметр: Логин';
$MESS['ERROR_USER_PASSWORD_EMPTY'] = 'Не указан обязательный параметр: Пароль';
$MESS['ERROR_USER_EMAIL_EMPTY'] = 'Не указан обязательный параметр: Эл.почта';
$MESS['ERROR_USER_EMAIL_INVALID'] = 'Некорректный адрес электронной почты';

$MESS['ERROR_EVENT_EMPTY_CALLABLE'] = 'Ошибка события: не указан метод класса';
$MESS['ERROR_EVENT_EMPTY_CALLABLE_INVALID'] = 'Ошибка события: не найден метод класса';
$MESS['ERROR_EVENT_EMPTY_METHOD'] = 'Ошибка события: не указан метод запроса';
$MESS['ERROR_EVENT_EMPTY_PATTERN'] = 'Ошибка события: не указан шаблон URL';

$MESS['ERROR_SERVER'] = 'При выполнении запроса возникла ошибка. Обратитесь к администратору сайта.';
$MESS['ERROR_LOG_TABLE'] = 'Отсутствует таблица журнала.';

$moduleId = 'sotbit.restapi';
$MESS = array_combine( array_map(function($k) use ($moduleId){ return $moduleId.'_'.$k; }, array_keys($MESS)), $MESS );


