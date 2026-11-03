<?php

//ACCESS_DENIED
$MESS['BIZPROC_API_ENUM_ERRORS_ACCESS_DENIED'] = 'Недостаточно прав для доступа';
$MESS['BIZPROC_API_ENUM_ERRORS_DOCUMENT_TYPE_ERROR'] = 'Для этого элемента бизнес-процессы недоступны';
$MESS['BIZPROC_API_ENUM_ERRORS_BP_NO_ACCESS'] = 'Недостаточно прав для остановки процесса';
$MESS['BIZPROC_API_ENUM_ERRORS_ROBOTS_NO_ACCESS'] = 'Недостаточно прав для остановки роботов';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_NO_PRERMISSIONS'] = 'Недостаточно прав для просмотра бизнес-процессов. Обратитесь к администратору вашего Битрикс24';
$MESS['BIZPROC_API_ENUM_ERRORS_START_ACCESS_DENIED'] = 'Недостаточно прав для запуска бизнес-процесса. Обратитесь к руководителю или администратору вашего Битрикс24';
$MESS['BIZPROC_API_ENUM_ERRORS_VIEW_RIGHTS_ERROR'] = 'Недостаточно прав на просмотр. Обратитесь к администратору вашего Битрикс24';
$MESS['BIZPROC_API_ENUM_ERRORS_RESULT_NO_RIGHTS_VIEW'] = 'Недостаточно прав для просмотра результата';
$MESS['BIZPROC_API_ENUM_ERRORS_IMPORT_ACCESS_DENIED'] = 'Недостаточно прав для импорта шаблона';
$MESS['BIZPROC_API_ENUM_ERRORS_EXPORT_ACCESS_DENIED'] = 'Недостаточно прав для экспорта шаблона';
$MESS['BIZPROC_API_ENUM_ERRORS_DELETE_TEMPLATE_UNAUTHORIZED'] = 'Недостаточно прав на удаление шаблона бизнес-процесса';

//NOT_FOUND
$MESS['BIZPROC_API_ENUM_ERRORS_BP_NOT_FOUND'] = 'Бизнес-процесс не найден';
$MESS['BIZPROC_API_ENUM_ERRORS_TASK_NOT_FOUND'] = 'Задание не найдено';
$MESS['BIZPROC_API_ENUM_ERRORS_NO_ENTITY'] = 'Не указана сущность, для которой запускается бизнес-процесс';
$MESS['BIZPROC_API_ENUM_ERRORS_EMPTY_DOCUMENT'] = 'Не указан тип документа';
$MESS['BIZPROC_API_ENUM_ERRORS_USER_NOT_FOUND'] = 'Пользователь №#USER_ID# не найден';
$MESS['BIZPROC_API_ENUM_ERRORS_ACTIVITY_NOT_FOUND'] = 'Действие не найдено (#ACTIVITY#)';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_NOT_FOUND'] = 'Шаблон бизнес-процесса с кодом #ID# не найден';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_VERSION_NOT_FOUND'] = 'Версия шаблона недоступна';
$MESS['BIZPROC_API_ENUM_ERRORS_DRAFT_NOT_FOUND'] = 'Черновик шаблона не найден или уже обновлён. Обновите страницу и продолжите работу';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_CHANGE_NOT_FOUND'] = 'Изменение шаблона недоступно: оно вытеснено из истории или удалено';
$MESS['BIZPROC_API_ENUM_ERRORS_ENTITY_NOT_EXISTS'] = 'Запрашиваемая сущность не найдена.';
$MESS['BIZPROC_API_ENUM_ERRORS_GET_DATA_ERROR'] = 'Не удалось получить данные';
$MESS['BIZPROC_API_ENUM_ERRORS_CREATE_WORKFLOW'] = 'Не удалось запустить бизнес-процесс';
$MESS['BIZPROC_API_ENUM_ERRORS_SCRIPT_START_NOT_SUPPORTED'] = 'Запуск умных сценариев не поддерживается';
$MESS['BIZPROC_API_ENUM_ERRORS_INVALID_USER_ID'] = 'Не указан идентификатор пользователя';
$MESS['BIZPROC_API_ENUM_ERRORS_NO_AVAILABLE_AI_AGENTS_TO_DELETE'] = 'Выбранные агенты недоступны для удаления';

//VALIDATION
$MESS['BIZPROC_API_ENUM_ERRORS_INVALID_TYPE'] = 'Тип параметра не определён';
$MESS['BIZPROC_API_ENUM_ERRORS_INVALID_FILE'] = 'Не удалось загрузить файл';
$MESS['BIZPROC_API_ENUM_ERRORS_EMPTY_TEMPLATE'] = "Шаблон бизнес-процесса с кодом '#ID#' имеет пустое тело";
$MESS['BIZPROC_API_ENUM_ERRORS_EMPTY_PROP'] = 'Не заполнено обязательное поле: #PROPERTY#';
$MESS['BIZPROC_API_ENUM_ERRORS_INVALID_PARAM_TYPE'] = "Аргумент '#PARAM#' должен иметь тип '#VALUE#'";
$MESS['BIZPROC_API_ENUM_ERRORS_INVALID_PARAM_ARG'] = "Аргумент '#PARAM#' имеет недопустимое значение '#VALUE#'";
$MESS['BIZPROC_API_ENUM_ERRORS_PARAM_REQUIRED'] = "Не заполнено обязательное поле #NAME#";
$MESS['BIZPROC_API_ENUM_ERRORS_CONSTANTS_NOT_TUNED'] = 'Константы бизнес-процесса не настроены';
$MESS['BIZPROC_API_ENUM_ERRORS_AI_AGENT_TRANSFER_INVALID_RECIPIENT'] = 'Передать агента можно только действующему сотруднику Битрикс24';
$MESS['BIZPROC_API_ENUM_ERRORS_AI_AGENT_TRANSFER_ALREADY_OWNER'] = 'Этот сотрудник уже владеет агентом';

//SYSTEM
$MESS['BIZPROC_API_ENUM_ERRORS_MODULE_NOT_INSTALLED'] = 'Модуль «Бизнес-процессы» не установлен';
$MESS['BIZPROC_API_ENUM_ERRORS_WRONG_TEMPLATE'] = 'Некорректный шаблон бизнес-процесса';
$MESS['BIZPROC_API_ENUM_ERRORS_UNKNOWN_ERROR'] = 'Неизвестная ошибка';
$MESS['BIZPROC_API_ENUM_ERRORS_FEATURE_DISABLED'] = 'Бизнес-процесс недоступен. Обратитесь к администратору вашего Битрикс24';
$MESS['BIZPROC_API_ENUM_ERRORS_OVER_LIMITED'] = 'Превышены лимиты автоматизации';
$MESS['BIZPROC_API_ENUM_ERRORS_AI_AGENT_DELETE_ERROR'] = 'Не удалось удалить';
$MESS['BIZPROC_API_ENUM_ERRORS_AI_AGENT_TRANSFER_ERROR'] = 'Не удалось передать агента, попробуйте ещё раз';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_HISTORY_UNAVAILABLE'] = 'Не удалось получить историю версий шаблона. Попробуйте ещё раз';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_VERSION_CONFLICT'] = 'Шаблон уже опубликован другим пользователем. Обновите страницу и повторите публикацию';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_RESTORE_UNDO_UNAVAILABLE'] = 'Отменить восстановление нельзя: текущий черновик создан не из восстановленной версии';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_LOCKED'] = 'Шаблон редактирует другой сотрудник. Дождитесь, когда он закончит, и повторите попытку';
$MESS['BIZPROC_API_ENUM_ERRORS_DRAFT_REVISION_CONFLICT'] = 'Другой сотрудник изменил шаблон. Обновите страницу, чтобы продолжить работу с последней версией';
$MESS['BIZPROC_API_ENUM_ERRORS_TEMPLATE_DRAFT_CONFLICT'] = 'Черновик изменился во время сохранения. Обновите страницу и повторите действие';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_BLOCK_CONSTANTS'] = 'константы';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_BLOCK_PARAMETERS'] = 'параметры';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_BLOCK_VARIABLES'] = 'переменные';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_HAS_WRITERS'] = 'Нельзя сменить назначение данных «#KEY#»: в них пишут действия процесса';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_IN_USE'] = 'Нельзя удалить данные «#KEY#»: на них ссылаются действия процесса или значения по умолчанию других данных';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_KEY_DUPLICATE'] = 'Идентификатор «#KEY#» уже занят в данных процесса (#BLOCKS#). Задайте другой идентификатор';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_KEY_INVALID'] = 'Идентификатор «#KEY#» недопустим. Используйте латинские буквы, цифры и знак подчёркивания';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_LEGACY_MECHANICS'] = 'Данные процесса недоступны для этого шаблона: он работает по прежним правилам';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_PAIR_MISMATCH'] = 'Входное и рабочее значения «#KEY#» описаны по-разному. У них должны совпадать тип, множественность и список вариантов';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_TYPE_UNSUPPORTED'] = 'Тип данных «#KEY#» не поддерживается в данных процесса. Выберите тип из списка в настройках данных';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_HAS_WRITERS'] = 'Нельзя перенести общее значение «#KEY#» в процесс: в него пишут действия процесса';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_IN_USE'] = 'Нельзя удалить общее значение «#KEY#»: на него ссылаются действия процесса, значения по умолчанию данных процесса или другие процессы портала';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_SCHEMA_LOCKED'] = 'Нельзя изменить тип, множественность, обязательность и видимость общего значения «#KEY#»: они задаются при создании. Создайте новое общее значение с нужными настройками';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_KEY_DUPLICATE'] = 'Общее значение с идентификатором «#KEY#» уже есть на портале. Переименуйте элемент и повторите';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_USED_ELSEWHERE'] = 'Общее значение «#KEY#» осталось общим: его используют другие процессы. Перенести значение в шаблон можно, только когда ссылок на него не осталось нигде, кроме этого процесса';
$MESS['BIZPROC_API_ENUM_ERRORS_FRAGMENT_FORMAT_UNSUPPORTED'] = 'Не удалось прочитать сохранённые ноды: они записаны в неподдерживаемом формате';
$MESS['BIZPROC_API_ENUM_ERRORS_FRAGMENT_TOO_DEEP'] = 'Слишком много уровней вложенных нод';
$MESS['BIZPROC_API_ENUM_ERRORS_FRAGMENT_TOO_LARGE'] = 'Слишком много нод для библиотеки';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_SHARED_USAGE_UNKNOWN'] = 'Не удалось проверить, используется ли общее значение «#KEY#» в других процессах портала: их слишком много. Операция отменена, значение осталось без изменений';
$MESS['BIZPROC_API_ENUM_ERRORS_PROCESS_DATA_UNRESOLVED_REFERENCE'] = 'Ссылка на данные «#KEY#» не разрешается: таких данных в шаблоне нет';
