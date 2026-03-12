<?php

use Bitrix\AI\Engine;
use Bitrix\Main\Loader;

Engine::triggerEngineAddedEvent();

include(__DIR__ . '/prompt_updater.php');
include(__DIR__ . '/bitrixgpt_agreement.php');

//\Bitrix\Main\Config\Option::set('ai', 'MARTA_BOT_ENABLE', 'Y');

$documentRoot = Loader::getDocumentRoot();
if (is_dir($documentRoot . '/bitrix/modules/ai/dev/'))
{
	// developer mode
	Loader::registerNamespace('Bitrix\AI\Dev',  $documentRoot . '/bitrix/modules/ai/dev');
}