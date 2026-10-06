<?php

$MESS['NOTE_DOCUMENT_LIST_EMPTY'] = 'Нет документов';
$MESS['NOTE_DOCUMENT_LIST_SELECT_ITEM_ARIA'] = 'Выбрать: #TITLE#';

$MESS['NOTE_DOCUMENT_LIST_BULK_SELECTED'] = 'Выбрано: #COUNT#';
$MESS['NOTE_DOCUMENT_LIST_BULK_SELECT_ALL'] = 'Выбрать все';
$MESS['NOTE_DOCUMENT_LIST_BULK_SELECTED_ALL'] = 'Выбраны все';
$MESS['NOTE_DOCUMENT_LIST_BULK_MOVE'] = 'Переместить';
$MESS['NOTE_DOCUMENT_LIST_BULK_ARCHIVE'] = 'Архивировать';
$MESS['NOTE_DOCUMENT_LIST_BULK_RESTORE'] = 'Восстановить';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE'] = 'Удалить';
$MESS['NOTE_DOCUMENT_LIST_BULK_HARD_DELETE'] = 'Удалить навсегда';
$MESS['NOTE_DOCUMENT_LIST_BULK_TOOLBAR_ARIA'] = 'Групповые действия с документами';
$MESS['NOTE_DOCUMENT_LIST_BULK_CLEAR_ARIA'] = 'Выйти из режима выбора';

// Shared bulk-action feedback (result toasts, confirm counts, errors) reused by the
// workspace / archive / recyclebin pages so identical wording lives in one place.
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_0'] = '#COUNT# документ переместится в корзину и удалится через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_1'] = '#COUNT# документа переместятся в корзину и удалятся через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_2'] = '#COUNT# документов переместятся в корзину и удалятся через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_0'] = 'Архивирован #COUNT# документ';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_1'] = 'Архивировано #COUNT# документа';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_2'] = 'Архивировано #COUNT# документов';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_0'] = 'Удалён #COUNT# документ';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_1'] = 'Удалено #COUNT# документа';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_2'] = 'Удалено #COUNT# документов';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_0'] = 'Перемещён #COUNT# документ';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_1'] = 'Перемещено #COUNT# документа';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_2'] = 'Перемещено #COUNT# документов';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_0'] = 'Восстановлен #COUNT# документ';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_1'] = 'Восстановлено #COUNT# документа';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_2'] = 'Восстановлено #COUNT# документов';
// Partial-success toasts: one whole phrase per action (no fragment gluing), pluralised on the
// processed count; #SKIPPED# is a bare number, the invariant "пропущено" reads fine for any value.
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_0'] = 'Архивирован #DONE# документ, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_1'] = 'Архивировано #DONE# документа, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_2'] = 'Архивировано #DONE# документов, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_0'] = 'Удалён #DONE# документ, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_1'] = 'Удалено #DONE# документа, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_2'] = 'Удалено #DONE# документов, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_0'] = 'Перемещён #DONE# документ, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_1'] = 'Перемещено #DONE# документа, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_2'] = 'Перемещено #DONE# документов, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_0'] = 'Восстановлен #DONE# документ, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_1'] = 'Восстановлено #DONE# документа, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_2'] = 'Восстановлено #DONE# документов, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL'] = 'Недостаточно прав на выбранные документы';
$MESS['NOTE_DOCUMENT_LIST_BULK_NOTHING'] = 'Ничего не изменилось';
$MESS['NOTE_DOCUMENT_LIST_BULK_LIMIT'] = 'Слишком много документов за один раз. Выберите меньше документов и попробуйте снова';
$MESS['NOTE_DOCUMENT_LIST_BULK_ERROR'] = 'Не удалось выполнить действие, попробуйте ещё раз немного позже';
