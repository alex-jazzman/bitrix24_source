<?php

declare(strict_types=1);

use Bitrix\AI\Facade\Portal;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\EventManager;
use Bitrix\Main\ModuleManager;

if (!ModuleManager::isModuleInstalled('bitrix24') || Portal::getRegion() !== 'by')
{
	return;
}

Application::getInstance()->addBackgroundJob(function ()
{
	if (\defined('BX_CHECK_AGENT_START'))
	{
		return;
	}

	$moduleId = 'ai';
	$optionHandlerCheckedAt = 'bitrixgpt_agreement_handler_checked_at';
	$checkTtl = 21600;
	$expectedClass = 'Bitrix\\AI\\Handler\\Main';
	$expectedMethod = 'onProlog';
	$lastCheck = (int)Option::get($moduleId, $optionHandlerCheckedAt, 0);

	if ($lastCheck > 0 && (time() - $lastCheck) < $checkTtl)
	{
		return;
	}

	$eventManager = EventManager::getInstance();

	foreach ($eventManager->findEventHandlers('main', 'onProlog', ['ai']) as $handler)
	{
		$handlerClass = $handler['TO_CLASS'] ?? null;
		$handlerMethod = $handler['TO_METHOD'] ?? null;

		if (($handlerClass === $expectedClass) && ($handlerMethod === $expectedMethod))
		{
			Option::set($moduleId, $optionHandlerCheckedAt, (string)time());

			return;
		}
	}

	$eventManager->registerEventHandler('main', 'onProlog', 'ai', '\\Bitrix\\AI\\Handler\\Main', 'onProlog');
	Option::set($moduleId, $optionHandlerCheckedAt, (string)time());
});
