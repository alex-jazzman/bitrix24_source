<?php

// New section slug for the CRM hub tree (the flat prod tabs have no Vibe equivalent).
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE'] = 'Главная страница';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_ADDRESS'] = 'Адрес раздела';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION'] = 'Описание';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DELETE'] = 'Удалить рабочее место';

// Заголовок страницы в тулбаре слайдера: настройка существующего рабочего места и создание нового.
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_PAGE_TITLE_SETTINGS'] = 'Настройки цифрового рабочего места';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_PAGE_TITLE_NEW'] = 'Новое цифровое рабочее место';

// Экран создания: кнопки в карточке героя и плейсхолдер пустого названия. Фразы свои, хотя у кита
// есть «Сохранить» и «Отменить»: сообщения кита до шаблона не доезжают. Замер на живом экране —
// BX.message('CRM_SETTINGS_HUB_SAVE') пуст, при этом наши собственные коды резолвятся, — и кнопка
// рисовалась пустым квадратом 34×34 (ui-btn-collapsed). Поэтому кит отсюда не переиспользуется.
//
// Плейсхолдер зовёт заполнить поле, а не называет его: на создании имя пусто всегда, и подпись
// «Название рабочего места» в заголовке читалась бы как уже введённое имя.
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_SAVE'] = 'Сохранить';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_CANCEL'] = 'Отмена';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_TITLE_PLACEHOLDER'] = 'Добавьте название';

// Close-confirmation dialog (new client behaviour).
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TITLE'] = 'Закрыть?';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TEXT'] = 'Ваши изменения не сохранятся';

// Accessible name for the error-alert close control.
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_ERROR_CLOSE'] = 'Закрыть сообщение';

// Phrases carried over verbatim from templates/.default/lang/ru/template.php.
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_TAB_COMMON'] = 'Настройки';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TYPES'] = 'Смарт-процессы';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_TITLE'] = 'Название рабочего места';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_PLACEHOLDER_TITLE'] = 'Например, HR-департамент';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_CREATE_TYPE'] = 'Создать новый смарт-процесс';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_CRM_TYPES'] = 'Перенести смарт-процесс, связанный с CRM';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_EXTERNAL_TYPES'] = 'Перенести смарт-процесс, связанный с рабочими местами';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_PERMISSIONS_WILL_BE_RESET_ALERT'] = 'После изменения списка смарт-процессов права доступа к ним нужно будет настроить заново';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_TAG_SELECTOR_ADD_BUTTON_CAPTION'] = 'Выбрать';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_MESSAGE'] = 'Чтобы создать смарт-процесс, сначала сохраните рабочее место';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_YES_CAPTION'] = 'Сохранить';

// Кнопки раздела «Смарт-процессы» после перевода его на строки с тумблерами (D-14): выбор больше
// не живёт внутри TagSelector'а, а создание стало отдельным действием рядом с ним.
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_PICK'] = 'Выбрать';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_ENABLE_VIBE'] = 'Главная страница';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION_PLACEHOLDER'] = 'Добавить описание';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_FAILED'] = 'Не удалось загрузить сохранённые данные рабочего места. Попробуйте ещё раз';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_LOADING'] = 'Загружаются сохранённые данные рабочего места';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_RETRY'] = 'Попробовать ещё раз';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_CREATE'] = 'Создать';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_EMPTY'] = 'Настройки главной страницы недоступны';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADED'] = 'Настройки главной страницы загружены';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADING'] = 'Настройки главной страницы загружаются';
$MESS['CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOAD_ERROR'] = 'Не удалось загрузить настройки главной страницы';
