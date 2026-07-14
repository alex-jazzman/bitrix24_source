<?php

$MESS['MAIL_CONFIG_FORM_EMAIL_LABEL'] = 'E-mail';
$MESS['MAIL_CONFIG_FORM_EMAIL_LABEL_PLACEHOLDER'] = 'info@example.com';
$MESS['MAIL_CONFIG_FORM_SERVER_LABEL'] = 'IMAP';
$MESS['MAIL_CONFIG_FORM_SERVER_LABEL_PLACEHOLDER'] = 'imap.example.com';
$MESS['MAIL_CONFIG_FORM_PORT_LABEL'] = 'Порт';
$MESS['MAIL_CONFIG_FORM_PORT_PLACEHOLDER'] = '993';
$MESS['MAIL_CONFIG_FORM_LOGIN_LABEL'] = 'Логин';
$MESS['MAIL_CONFIG_FORM_PASSWORD_LABEL'] = 'Пароль';

$MESS['MAIL_CONFIG_FORM_SMTP_TITLE'] = 'Настройки SMTP';
$MESS['MAIL_CONFIG_FORM_SMTP_SERVER_LABEL'] = 'SMTP-сервер';
$MESS['MAIL_CONFIG_FORM_SMTP_PORT_LABEL'] = 'Порт';
$MESS['MAIL_CONFIG_FORM_SMTP_LOGIN_LABEL'] = 'Логин';
$MESS['MAIL_CONFIG_FORM_SMTP_PASSWORD_LABEL'] = 'Пароль';
$MESS['MAIL_CONFIG_FORM_SMTP_LIMIT_LABEL'] = 'Ограничить количество отправляемых сообщений';
$MESS['MAIL_CONFIG_FORM_SMTP_UPLOAD_OUTGOING_LABEL'] = 'Сохранять копию отправленных писем на сервере';
$MESS['MAIL_CONFIG_FORM_SMTP_UPLOAD_OUTGOING_HINT'] = 'Если в ящике дублируются письма, которые вы отправляете через внешний SMTP, попробуйте отключить эту настройку';
$MESS['MAIL_CONFIG_FORM_SMTP_WARNING_ALERT'] = 'Будьте внимательны при настройке SMTP-сервера: если данные указаны неверно, письма могут не доходить до получателя';

$MESS['MAIL_CONFIG_FORM_MAILBOX_NAME_LABEL'] = 'Название ящика';
$MESS['MAIL_CONFIG_FORM_USE_SENDER_NAME_LABEL'] = 'Использовать одно имя отправителя для всех сотрудников с доступом к этому ящику';
$MESS['MAIL_CONFIG_FORM_SENDER_NAME_PLACEHOLDER'] = 'Имя отправителя';
$MESS['MAIL_CONFIG_FORM_LINK_LABEL'] = 'Адрес веб-интерфейса почтового сервера';
$MESS['MAIL_CONFIG_FORM_USE_SSL_LABEL'] = 'Использовать защищённое соединение';

$MESS['MAIL_CONFIG_FORM_ACCESS_LABEL'] = 'Доступ к почтовому ящику';
$MESS['MAIL_CONFIG_FORM_ACCESS_DESCRIPTION'] = 'Разрешите другим сотрудникам получать письма из этого ящика и отвечать на них. Добавьте нужных сотрудников и организуйте совместную работу с почтой, например, для отдела продаж или службы поддержки клиентов.';
$MESS['MAIL_CONFIG_FORM_ACCESS_OWNER_ONLY'] = 'Настраивать общий доступ к ящику может только его владелец. Чтобы открыть доступ коллегам, попросите владельца добавить вас в список сотрудников с доступом к этому ящику';
$MESS['MAIL_CONFIG_FORM_ACCESS_LIMIT_TITLE'] = 'Достигнут лимит ящиков с общим доступом';
$MESS['MAIL_CONFIG_FORM_ACCESS_LIMIT_HINT_PLURAL_0'] = 'На вашем тарифе можно подключить общий доступ только для #LIMIT# ящика. Сейчас все доступные ящики уже используются.

Чтобы добавить сотрудников к этому ящику, отключите общий доступ у другого ящика или перейдите на другой тариф.';
$MESS['MAIL_CONFIG_FORM_ACCESS_LIMIT_HINT_PLURAL_1'] = 'На вашем тарифе можно подключить общий доступ только для #LIMIT# ящиков. Сейчас все доступные ящики уже используются.

Чтобы добавить сотрудников к этому ящику, отключите общий доступ у другого ящика или перейдите на другой тариф.';
$MESS['MAIL_CONFIG_FORM_ACCESS_LIMIT_SAVE_ERROR'] = 'На вашем тарифе достигнут лимит ящиков с общим доступом. Попробуйте отключить общий доступ у другого ящика и сохранить настройки ещё раз';
$MESS['MAIL_CONFIG_FORM_OWNER_LABEL'] = 'Владелец ящика';
$MESS['MAIL_CONFIG_FORM_CONNECTION_REQUEST_OWNER_LABEL'] = 'Кому подключить';

$MESS['MAIL_CONFIG_FORM_OAUTH_CONNECT'] = 'Подключить через OAuth';
$MESS['MAIL_CONFIG_FORM_OAUTH_DISCONNECT'] = 'Отключить';

$MESS['MAIL_CONFIG_FORM_OAUTH_EMAIL_NEEDS_CONFIRMATION_HINT'] = 'OAuth-аккаунт не совпадает с адресом ящика, попробуйте ввести адрес вручную';
$MESS['MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECKING'] = 'Проверяем подключение к ящику…';
$MESS['MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECK_SUCCESS'] = 'Ящик подключён';
$MESS['MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECK_ERROR'] = 'Не удалось подключиться к ящику с этим адресом, проверьте e-mail и попробуйте ещё раз';

$MESS['MAIL_CONFIG_FORM_UPN_LABEL'] = 'User Principal Name';
$MESS['MAIL_CONFIG_FORM_UPN_HINT'] = 'Если ваш логин SMTP отличается от e-mail — например, для Exchange или Office365';

$MESS['MAIL_CONFIG_FORM_SAVE_BUTTON'] = 'Сохранить';
$MESS['MAIL_CONFIG_FORM_CONNECT_BUTTON'] = 'Подключить';
$MESS['MAIL_CONFIG_FORM_DISCONNECT_BUTTON'] = 'Отключить ящик';
$MESS['MAIL_CONFIG_FORM_CANCEL_BUTTON'] = 'Отмена';

$MESS['MAIL_CONFIG_FORM_DELETE_CONFIRM_TITLE'] = 'Отключить этот ящик?';
$MESS['MAIL_CONFIG_FORM_DELETE_CONFIRM_OK'] = 'Отключить';

$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_EMAIL'] = 'Укажите корректный e-mail';
$MESS['MAIL_CONFIG_FORM_ERROR_EMPTY_PASSWORD'] = 'Укажите пароль';
$MESS['MAIL_CONFIG_FORM_ERROR_EMPTY_LOGIN'] = 'Укажите логин';
$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_SERVER'] = 'Некорректный адрес сервера';
$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_PORT'] = 'Некорректный порт';
$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_LINK'] = 'Некорректный адрес сайта почты';
$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_PASSWORD'] = 'Пароль SMTP содержит недопустимые символы';
$MESS['MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_LIMIT'] = 'Ограничение должно быть числом больше ноля';
$MESS['MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TITLE'] = 'Не удалось подключиться через OAuth, попробуйте ещё раз немного позже';
$MESS['MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TEXT'] = 'Не удалось синхронизировать почту из-за некорректной авторизации. Попробуйте подключить ящик ещё раз и сохранить настройки';
$MESS['MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TITLE'] = 'Не удалось подключиться к почтовому ящику, попробуйте ещё раз немного позже';
$MESS['MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TEXT'] = 'Не удалось синхронизировать почту из-за некорректной авторизации. Проверьте логин и пароль почтового ящика и сохраните настройки';
$MESS['MAIL_CONFIG_FORM_ERROR_GENERAL'] = 'Не удалось выполнить действие, попробуйте ещё раз немного позже';
$MESS['MAIL_CONFIG_FORM_ERROR_AJAX'] = 'Не удалось выполнить действие, проверьте доступ к интернету и попробуйте ещё раз';
$MESS['MAIL_CONFIG_FORM_ERROR_DETAILS'] = 'подробнее';

$MESS['MAIL_CONFIG_FORM_DIRS_LINK'] = 'Настроить папки для синхронизации';
$MESS['MAIL_CONFIG_FORM_EXTRA_PARAMS_LINK'] = 'Указать дополнительные параметры';
$MESS['MAIL_CONFIG_FORM_SELECTED_CLIENT_TITLE'] = 'Выбранный почтовый клиент';
$MESS['MAIL_CONFIG_FORM_LAST_CHECK_TITLE'] = 'Последняя проверка #TIME_AGO#';
$MESS['MAIL_CONFIG_FORM_LAST_CHECK_NO_DATA'] = 'Не удалось получить данные о ящике';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_SECONDS_PLURAL_0'] = '#COUNT# секунду назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_SECONDS_PLURAL_1'] = '#COUNT# секунды назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_SECONDS_PLURAL_2'] = '#COUNT# секунд назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_MINUTES_PLURAL_0'] = '#COUNT# минуту назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_MINUTES_PLURAL_1'] = '#COUNT# минуты назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_MINUTES_PLURAL_2'] = '#COUNT# минут назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_HOURS_PLURAL_0'] = '#COUNT# час назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_HOURS_PLURAL_1'] = '#COUNT# часа назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_HOURS_PLURAL_2'] = '#COUNT# часов назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_DAYS_PLURAL_0'] = '#COUNT# день назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_DAYS_PLURAL_1'] = '#COUNT# дня назад';
$MESS['MAIL_CONFIG_FORM_TIME_AGO_DAYS_PLURAL_2'] = '#COUNT# дней назад';
$MESS['MAIL_CONFIG_FORM_SYNC_PERIOD_BEFORE'] = 'Забрать письма из ящика за';
$MESS['MAIL_CONFIG_FORM_PROVIDER_TITLE_IMAP'] = 'Корпоративная почта';
$MESS['MAIL_CONFIG_FORM_PROVIDER_TITLE_PREFIXED'] = 'Почтовый клиент #NAME#';
