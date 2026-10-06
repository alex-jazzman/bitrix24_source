<?php
$MESS['VIBECODECONNECTOR_DIAG_TITLE'] = 'Битрикс24 Вайбкод — диагностика';

$MESS['VIBECODECONNECTOR_DIAG_TAB_VERIFY'] = 'Проверка соединения';
$MESS['VIBECODECONNECTOR_DIAG_TAB_VERIFY_TITLE'] = 'Запросить страницу состояния у выбранного Битрикс24 Вайбкод-сервера и убедиться, что обе стороны видят друг друга';
$MESS['VIBECODECONNECTOR_DIAG_TAB_STATE'] = 'Состояние и ссылки';
$MESS['VIBECODECONNECTOR_DIAG_TAB_STATE_TITLE'] = 'Текущая конфигурация модуля и связанные административные страницы';

$MESS['VIBECODECONNECTOR_DIAG_HEADING_STEP1'] = 'Шаг 1. Выберите сервер для проверки';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_RESULT'] = 'Страница состояния Битрикс24 Вайбкод';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_CHANNELS'] = 'Каналы связи';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_LINKS'] = 'Связанные страницы';

$MESS['VIBECODECONNECTOR_DIAG_STEP1_NOTE'] = 'После нажатия «Проверить» коробка отправит запрос issueStatusUrl на выбранный сервер. Битрикс24 Вайбкод сделает обратный вызов checkConnection с подписанным JWT, и если коробка примет подпись — вернёт URL страницы состояния. Если всё работает, страница загрузится в iframe ниже.';
$MESS['VIBECODECONNECTOR_DIAG_NO_TARGETS'] = 'Не настроено ни одного канала связи с Битрикс24 Вайбкод. Зарегистрируйте портал на <a href="#URL#">странице настроек модуля</a>.';

$MESS['VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED'] = 'Cloud-shared (общий ключ Битрикс24 Вайбкод)';
$MESS['VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED_NO_KEY'] = 'ключа нет — портал заберёт его при проверке';
$MESS['VIBECODECONNECTOR_DIAG_TARGET_PAIRING'] = 'Pairing: #ISS#';
$MESS['VIBECODECONNECTOR_DIAG_PAIRING_EXPIRED'] = 'просрочен';
$MESS['VIBECODECONNECTOR_DIAG_PAIRING_EXPIRES_AT'] = 'действует до: #TIME#';

$MESS['VIBECODECONNECTOR_DIAG_VERIFY_BUTTON'] = 'Проверить';

$MESS['VIBECODECONNECTOR_DIAG_RESULT_OK'] = 'Связь подтверждена. Битрикс24 Вайбкод проверил нашу подпись, мы видим друг друга.';
$MESS['VIBECODECONNECTOR_DIAG_RESULT_FAIL'] = 'Не удалось подтвердить связь';
$MESS['VIBECODECONNECTOR_DIAG_RESULT_EXPIRES_AT'] = 'URL действует до: #TIME#';

$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_LABEL'] = 'Cloud-shared';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OK'] = 'настроен';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_NO_KEY'] = 'активен, ключа пока нет';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OFF'] = 'не применяется';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS_LABEL'] = 'Pairings';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS'] = 'зарегистрировано: #COUNT#';

$MESS['VIBECODECONNECTOR_DIAG_COL_ISS'] = 'Issuer (iss)';
$MESS['VIBECODECONNECTOR_DIAG_COL_PORTAL_ID'] = 'Portal ID';
$MESS['VIBECODECONNECTOR_DIAG_COL_ENDPOINT'] = 'Endpoint';
$MESS['VIBECODECONNECTOR_DIAG_COL_EXPIRES_AT'] = 'Действует до';

$MESS['VIBECODECONNECTOR_DIAG_LINK_INCOMING_LOG'] = 'Журнал входящих JWT';
$MESS['VIBECODECONNECTOR_DIAG_LINK_CLOUD_SHARED_KEY_LOG'] = 'Журнал получения ключа';
$MESS['VIBECODECONNECTOR_DIAG_LINK_DEVELOPER_KEYS'] = 'Ключи разработчика';
$MESS['VIBECODECONNECTOR_DIAG_LINK_SETTINGS'] = 'Настройки модуля';

$MESS['VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED'] = 'Выберите сервер: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED_MSG'] = 'не выбран ни один из доступных вариантов.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND'] = 'Pairing не найден: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND_MSG'] = 'выбранная привязка отсутствует в базе. Возможно, она была удалена в другой вкладке.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_CONFIGURED'] = 'Cloud-shared канал не настроен: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_APPLICABLE_MSG'] = 'портал не облачный либо не заполнен сетевой идентификатор.';

$MESS['VIBECODECONNECTOR_DIAG_ERR_CONNECTION_CHECK_FAILED'] = 'Битрикс24 Вайбкод не смог проверить нашу подпись (#MESSAGE#). Скорее всего, ключ pairing устарел или удалён на стороне портала. Попробуйте обновить ключ в настройках модуля.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_LICENSE'] = 'Проблема с лицензией коробки: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_UPSTREAM'] = 'Битрикс24 Вайбкод недоступен по выбранному адресу: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_INTERNAL'] = 'Внутренняя ошибка Битрикс24 Вайбкод: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_INVALID_RESPONSE'] = 'Битрикс24 Вайбкод прислал ответ в неожиданном формате: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_UNKNOWN_ACTION'] = 'Инстанс Битрикс24 Вайбкод не поддерживает текущий контракт: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_GENERIC'] = 'Ошибка: #MESSAGE#';
