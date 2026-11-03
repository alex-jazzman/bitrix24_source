<?php

$MESS['DISK_SYNC_REQUEST_UNKNOWN_PARAMETER'] = 'Параметр «#PARAMETER#» не поддерживается. Проверьте его название или удалите из запроса';
$MESS['DISK_SYNC_REQUEST_PAGINATION_INVALID'] = 'Параметры страницы переданы не объектом. Передайте их объектом';
$MESS['DISK_SYNC_REQUEST_LIMIT_INVALID'] = 'Размер страницы указан неверно. Укажите целое число больше нуля';
$MESS['DISK_SYNC_REQUEST_LIMIT_TOO_LARGE'] = 'Размер страницы превышает #MAX#. Укажите значение не больше #MAX#';
$MESS['DISK_SYNC_REQUEST_SECTIONS_INVALID'] = 'Список секций пуст или имеет неверный формат. Передайте непустой список названий секций';
$MESS['DISK_SYNC_REQUEST_SECTION_UNKNOWN'] = 'Секция «#SECTION#» не объявлена в схеме. Проверьте название';
$MESS['DISK_SYNC_REQUEST_SECTION_UNAVAILABLE'] = 'Секция «#SECTION#» объявлена в схеме, но недоступна в этом Битрикс24. Получите список доступных секций в disk.sync.capabilities.get';
$MESS['DISK_SYNC_REQUEST_PARAMETER_REQUIRED'] = 'Обязательный параметр «#PARAMETER#» не передан. Добавьте его в запрос';
$MESS['DISK_SYNC_REQUEST_HISTORY_DEPTH_INVALID'] = 'Глубина истории указана неверно. Укажите целое число дней больше нуля';
$MESS['DISK_SYNC_REQUEST_POLL_INTERVAL_OUT_OF_BOUNDS'] = 'Планируемый шаг опроса не входит в диапазон от #MIN# до #MAX# секунд. Укажите значение в границах, которые возвращает disk.sync.capabilities.get';
$MESS['DISK_SYNC_REQUEST_CHECK_MODE_AMBIGUOUS'] = 'В запросе одновременно указаны «objectIds» и «scopeRootId». Оставьте один режим сверки: список идентификаторов объектов «objectIds» или корень области «scopeRootId»';
$MESS['DISK_SYNC_REQUEST_CHECK_MODE_MISSING'] = 'В запросе не указан режим сверки. Передайте один параметр: список идентификаторов объектов «objectIds» или корень области «scopeRootId»';
$MESS['DISK_SYNC_REQUEST_OBJECT_IDS_INVALID'] = 'Передайте непустой список положительных идентификаторов объектов';
$MESS['DISK_SYNC_REQUEST_OBJECT_IDS_TOO_MANY'] = 'Передайте не больше #MAX# идентификаторов за запрос';
$MESS['DISK_SYNC_REQUEST_SCOPE_ROOT_INVALID'] = 'Укажите положительный идентификатор корня области';
$MESS['DISK_SYNC_REQUEST_CHECK_TOKEN_OTHER_SCOPE'] = 'Токен сверки выдан для другой области';
$MESS['DISK_SYNC_REQUEST_LIMIT_NOT_APPLICABLE'] = 'Размер страницы применяется только при сверке по области';
$MESS['DISK_SYNC_REQUEST_DOWNLOAD_ID_REQUIRED'] = 'Идентификатор скачивания не передан. Передайте его без изменений из карточки объекта';
