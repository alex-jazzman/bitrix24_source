<?php

$MESS['NOTE_NOTIFY_UNTITLED'] = 'Без названия';

$MESS['NOTE_NOTIFY_MESSAGE_CREATED'] = 'Статья «#TITLE#» создана';
// The notified kind merges a content edit with a rename, so the text cannot say "содержимое".
$MESS['NOTE_NOTIFY_MESSAGE_CONTENT_CHANGED'] = 'Статья «#TITLE#» изменена';
$MESS['NOTE_NOTIFY_MESSAGE_TITLE_CHANGED'] = 'Статья переименована в «#TITLE#»';
$MESS['NOTE_NOTIFY_MESSAGE_MOVED'] = 'Статья «#TITLE#» перемещена';
$MESS['NOTE_NOTIFY_MESSAGE_ARCHIVED'] = 'Статья «#TITLE#» перемещена в архив';
$MESS['NOTE_NOTIFY_MESSAGE_ARCHIVE_RESTORED'] = 'Статья «#TITLE#» восстановлена из архива';
$MESS['NOTE_NOTIFY_MESSAGE_TRASHED'] = 'Статья «#TITLE#» перемещена в корзину';
$MESS['NOTE_NOTIFY_MESSAGE_TRASH_RESTORED'] = 'Статья «#TITLE#» восстановлена из корзины';
$MESS['NOTE_NOTIFY_MESSAGE_ACCESS_CHANGED'] = 'Права доступа к статье «#TITLE#» изменены';

// Aggregate: _PLURAL_0 = ...1, 21, 31 (excl. 11); _PLURAL_1 = ...2-4, 22-24;
// _PLURAL_2 = ...5-20, 25-30... — see Loc::getPluralForm() 'ru' branch. The verb stays
// an impersonal neuter form in _PLURAL_1/_PLURAL_2 (genitive noun count), and agrees
// with the feminine singular noun in _PLURAL_0.
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_0'] = '#COUNT# статья создана в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_1'] = '#COUNT# статьи создано в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CREATED_PLURAL_2'] = '#COUNT# статей создано в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_0'] = '#COUNT# статья изменена в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_1'] = '#COUNT# статьи изменено в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_CONTENT_CHANGED_PLURAL_2'] = '#COUNT# статей изменено в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_0'] = '#COUNT# статья переименована в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_1'] = '#COUNT# статьи переименовано в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TITLE_CHANGED_PLURAL_2'] = '#COUNT# статей переименовано в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_0'] = '#COUNT# статья перемещена в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_1'] = '#COUNT# статьи перемещено в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_MOVED_PLURAL_2'] = '#COUNT# статей перемещено в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_0'] = '#COUNT# статья перемещена в архив в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_1'] = '#COUNT# статьи перемещено в архив в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVED_PLURAL_2'] = '#COUNT# статей перемещено в архив в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_0'] = '#COUNT# статья восстановлена из архива в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_1'] = '#COUNT# статьи восстановлено из архива в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ARCHIVE_RESTORED_PLURAL_2'] = '#COUNT# статей восстановлено из архива в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_0'] = '#COUNT# статья перемещена в корзину в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_1'] = '#COUNT# статьи перемещено в корзину в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASHED_PLURAL_2'] = '#COUNT# статей перемещено в корзину в базе знаний «#COLLECTION#»';

$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_0'] = '#COUNT# статья восстановлена из корзины в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_1'] = '#COUNT# статьи восстановлено из корзины в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_TRASH_RESTORED_PLURAL_2'] = '#COUNT# статей восстановлено из корзины в базе знаний «#COLLECTION#»';

// Dative plural of "статья" ("статьям") does not change between the 2-4 and
// 5+ count bands in Russian — only the singular dative ("статье") differs.
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_0'] = 'Изменены права доступа к #COUNT# статье в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_1'] = 'Изменены права доступа к #COUNT# статьям в базе знаний «#COLLECTION#»';
$MESS['NOTE_NOTIFY_MESSAGE_AGGREGATE_ACCESS_CHANGED_PLURAL_2'] = 'Изменены права доступа к #COUNT# статьям в базе знаний «#COLLECTION#»';
