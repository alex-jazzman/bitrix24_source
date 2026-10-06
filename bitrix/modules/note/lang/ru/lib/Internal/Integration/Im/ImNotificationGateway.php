<?php

$MESS['NOTE_NOTIFY_UNTITLED'] = 'Без названия';

$MESS['NOTE_NOTIFY_MESSAGE_CREATED'] = 'Документ «#TITLE#» создан';
$MESS['NOTE_NOTIFY_MESSAGE_CONTENT_CHANGED'] = 'Содержимое документа «#TITLE#» изменено';
$MESS['NOTE_NOTIFY_MESSAGE_TITLE_CHANGED'] = 'Документ переименован в «#TITLE#»';
$MESS['NOTE_NOTIFY_MESSAGE_MOVED'] = 'Документ «#TITLE#» перемещён';
$MESS['NOTE_NOTIFY_MESSAGE_ARCHIVED'] = 'Документ «#TITLE#» перемещён в архив';
$MESS['NOTE_NOTIFY_MESSAGE_ARCHIVE_RESTORED'] = 'Документ «#TITLE#» восстановлен из архива';
$MESS['NOTE_NOTIFY_MESSAGE_TRASHED'] = 'Документ «#TITLE#» перемещён в корзину';
$MESS['NOTE_NOTIFY_MESSAGE_TRASH_RESTORED'] = 'Документ «#TITLE#» восстановлен из корзины';
$MESS['NOTE_NOTIFY_MESSAGE_ACCESS_CHANGED'] = 'Права доступа к документу «#TITLE#» изменены';

// Aggregate (AC-051): _PLURAL_0 = ...1, 21, 31 (excl. 11); _PLURAL_1 = ...2-4, 22-24;
// _PLURAL_2 = ...5-20, 25-30... — see Loc::getPluralForm() 'ru' branch. The verb stays
// an impersonal neuter form in _PLURAL_1/_PLURAL_2 (genitive noun count), and agrees
// with the masculine singular noun in _PLURAL_0.
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_0'] = '#COUNT# документ создан в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_1'] = '#COUNT# документа создано в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_2'] = '#COUNT# документов создано в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_0'] = '#COUNT# документ изменён в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_1'] = '#COUNT# документа изменено в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_2'] = '#COUNT# документов изменено в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_0'] = '#COUNT# документ переименован в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_1'] = '#COUNT# документа переименовано в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_2'] = '#COUNT# документов переименовано в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_0'] = '#COUNT# документ перемещён в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_1'] = '#COUNT# документа перемещено в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_2'] = '#COUNT# документов перемещено в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_0'] = '#COUNT# документ перемещён в архив в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_1'] = '#COUNT# документа перемещено в архив в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_2'] = '#COUNT# документов перемещено в архив в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_0'] = '#COUNT# документ восстановлен из архива в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_1'] = '#COUNT# документа восстановлено из архива в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_2'] = '#COUNT# документов восстановлено из архива в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_0'] = '#COUNT# документ перемещён в корзину в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_1'] = '#COUNT# документа перемещено в корзину в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_2'] = '#COUNT# документов перемещено в корзину в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_0'] = '#COUNT# документ восстановлен из корзины в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_1'] = '#COUNT# документа восстановлено из корзины в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_2'] = '#COUNT# документов восстановлено из корзины в базе знаний «#COLLECTION#»';

// Dative plural of "документ" ("документам") does not change between the 2-4 and
// 5+ count bands in Russian — only the singular dative ("документу") differs.
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_0'] = 'Изменены права доступа к #COUNT# документу в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_1'] = 'Изменены права доступа к #COUNT# документам в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_2'] = 'Изменены права доступа к #COUNT# документам в базе знаний «#COLLECTION#»';
