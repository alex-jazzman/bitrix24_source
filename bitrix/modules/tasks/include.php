<?php

use Bitrix\Main\Localization\Loc;

IncludeModuleLangFile($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/tasks/lang.php');

Loc::loadMessages(__FILE__);

$moduleRoot = $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/tasks';

require_once __DIR__ . '/autoload.php';
require_once $moduleRoot . '/tools.php';

CJSCore::RegisterExt('task-popups', [
	'js' => '/bitrix/js/tasks/task-popups.js',
	'css' => '/bitrix/js/tasks/css/task-popups.css',
	'rel' => ['ui.design-tokens', 'popup', 'ui.a11y'],
	'lang' => BX_ROOT . '/modules/tasks/lang/' . LANGUAGE_ID . '/task-popups.php',
]);

require_once __DIR__ . '/include/internal_events.php';
require_once $moduleRoot . '/include/asset.php';
require_once $moduleRoot . '/include/migrate_recent_tasks.php';
