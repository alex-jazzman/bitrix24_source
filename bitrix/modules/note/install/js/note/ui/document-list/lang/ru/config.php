<?php

$MESS['NOTE_DOCUMENT_LIST_EMPTY'] = 'Нет статей';
// Failure of the next page: the pages already loaded stay on screen, so the message and its retry
// take the place of the paging loader at the bottom of the list, not the place of the list.
$MESS['NOTE_DOCUMENT_LIST_LOAD_MORE_ERROR'] = 'Не удалось загрузить следующие статьи, попробуйте ещё раз';
$MESS['NOTE_DOCUMENT_LIST_LOAD_MORE_RETRY'] = 'Повторить';
$MESS['NOTE_DOCUMENT_LIST_SELECT_ITEM_ARIA'] = 'Выбрать: #TITLE#';
$MESS['NOTE_DOCUMENT_LIST_SECTION_TOGGLE_ARIA'] = 'Свернуть или развернуть список статей';

$MESS['NOTE_DOCUMENT_LIST_BULK_SELECTED'] = 'Выбрано: #COUNT#';
$MESS['NOTE_DOCUMENT_LIST_BULK_SELECT_ALL'] = 'Выбрать все';
$MESS['NOTE_DOCUMENT_LIST_BULK_SELECTED_ALL'] = 'Выбраны все';
$MESS['NOTE_DOCUMENT_LIST_BULK_MOVE'] = 'Переместить';
$MESS['NOTE_DOCUMENT_LIST_BULK_ARCHIVE'] = 'Архивировать';
$MESS['NOTE_DOCUMENT_LIST_BULK_RESTORE'] = 'Восстановить';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE'] = 'Удалить';
$MESS['NOTE_DOCUMENT_LIST_BULK_HARD_DELETE'] = 'Удалить навсегда';
$MESS['NOTE_DOCUMENT_LIST_BULK_TOOLBAR_ARIA'] = 'Групповые действия со статьями';
$MESS['NOTE_DOCUMENT_LIST_BULK_CLEAR_ARIA'] = 'Выйти из режима выбора';

// Shared bulk-action feedback (result toasts, confirm counts, errors) reused by the
// workspace / archive / recyclebin pages so identical wording lives in one place.
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_0'] = '#COUNT# статья переместится в корзину и удалится через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_1'] = '#COUNT# статьи переместятся в корзину и удалятся через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT_PLURAL_2'] = '#COUNT# статей переместятся в корзину и удалятся через 30 дней';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_0'] = 'Архивирована #COUNT# статья';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_1'] = 'Архивировано #COUNT# статьи';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE_PLURAL_2'] = 'Архивировано #COUNT# статей';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_0'] = 'Удалена #COUNT# статья';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_1'] = 'Удалено #COUNT# статьи';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_DELETE_PLURAL_2'] = 'Удалено #COUNT# статей';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_0'] = 'Перемещена #COUNT# статья';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_1'] = 'Перемещено #COUNT# статьи';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_MOVE_PLURAL_2'] = 'Перемещено #COUNT# статей';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_0'] = 'Восстановлена #COUNT# статья';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_1'] = 'Восстановлено #COUNT# статьи';
$MESS['NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE_PLURAL_2'] = 'Восстановлено #COUNT# статей';
// Partial-success toasts: one whole phrase per action (no fragment gluing), pluralised on the
// processed count; #SKIPPED# is a bare number, the invariant "пропущено" reads fine for any value.
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_0'] = 'Архивирована #DONE# статья, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_1'] = 'Архивировано #DONE# статьи, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE_PLURAL_2'] = 'Архивировано #DONE# статей, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_0'] = 'Удалена #DONE# статья, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_1'] = 'Удалено #DONE# статьи, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE_PLURAL_2'] = 'Удалено #DONE# статей, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_0'] = 'Перемещена #DONE# статья, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_1'] = 'Перемещено #DONE# статьи, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE_PLURAL_2'] = 'Перемещено #DONE# статей, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_0'] = 'Восстановлена #DONE# статья, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_1'] = 'Восстановлено #DONE# статьи, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE_PLURAL_2'] = 'Восстановлено #DONE# статей, пропущено #SKIPPED#';
$MESS['NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL'] = 'Недостаточно прав на выбранные статьи';
$MESS['NOTE_DOCUMENT_LIST_BULK_NOTHING'] = 'Ничего не изменилось';
$MESS['NOTE_DOCUMENT_LIST_BULK_LIMIT'] = 'Слишком много статей за один раз. Выберите меньше статей и попробуйте снова';
$MESS['NOTE_DOCUMENT_LIST_BULK_ERROR'] = 'Не удалось выполнить действие, попробуйте ещё раз немного позже';
