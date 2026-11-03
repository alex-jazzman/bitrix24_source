<?php

$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_TEMPLATE_DEFAULT_TITLE'] = 'Шаблон бизнес-процесса';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_ERROR_TEMPLATE_TYPE'] = 'Данный тип шаблона бизнес-процесса не поддерживается';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_ERROR_DESCRIPTION_TOO_LONG'] = 'Описание слишком длинное. Сократите его до #LIMIT# символов';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_PILOT_AUDIENCE_EMPTY'] = 'Выберите сотрудников или отделы, для которых публикуется схема';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_PILOT_SETTINGS_FREEZE_CONFIRMATION'] = 'Пока идёт пилот, настройки шаблона изменить нельзя. Они снова станут доступны после прекращения пилота или публикации схемы для всех';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_PILOT_STOP_CONFIRMATION'] = 'Подтвердите прекращение пилота';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_STOP_RUNNING_PROCESSES_CONFIRMATION'] = 'Уже запущенные процессы будут остановлены и сами не продолжатся. Подтвердите публикацию';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_PILOT_NOT_FOUND'] = 'По этому шаблону нет действующего пилота';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_CONNECT_AGENT_CLAUDE'] = 'claude "Выполни в терминале: curl -s \'#URL#\' — получишь инструкцию по инструментам для редактирования бизнес-процесса Bitrix24. Не используй встроенный WebFetch — запрос должен идти с твоей машины. Прочитай ответ и помоги."';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_CONNECT_AGENT_CODEX'] = 'codex "Run in shell: curl -s \'#URL#\' — get Bitrix24 workflow editor instructions. Do not use the built-in WebFetch — the request must come from your machine. Read the response and help me edit the workflow."';
$MESS['BIZPROCDESIGNER_CONTROLLER_DIAGRAM_CONNECT_AGENT_UNIVERSAL'] = "Выполни в терминале: curl -s \"#URL#\"\nНе используй встроенный WebFetch — запрос должен идти с твоей машины.\nВ ответе — инструкция по инструментам для редактирования бизнес-процесса Bitrix24. Прочитай её и помоги мне работать с этим процессом.";
