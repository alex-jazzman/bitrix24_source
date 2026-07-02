<?php

use Bitrix\AI\Engine;
use Bitrix\Main\EventResult;
use Bitrix\Main\EventManager;
use Bitrix\Main\Loader;
use Bitrix\Main\UI\Copyright;

Engine::triggerEngineAddedEvent();

include(__DIR__ . '/prompt_updater.php');

$documentRoot = Loader::getDocumentRoot();
if (is_dir($documentRoot . '/bitrix/modules/ai/dev/'))
{
	// developer mode
	Loader::registerNamespace('Bitrix\AI\Dev',  $documentRoot . '/bitrix/modules/ai/dev');
}

Loader::registerAutoLoadClasses(null, [
	'Parsedown' => '/bitrix/modules/ai/vendor/erusev/parsedown/Parsedown.php'
]);
