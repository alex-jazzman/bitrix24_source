<?php

\CModule::AddAutoloadClasses(
	'call',
	[
		'call' => 'install/index.php',
	]
);

require_once __DIR__ . '/include/internal_events.php';

if (\Bitrix\Call\Integration\AI\CallAISettings::isDebugEnable())
{
	\Bitrix\Call\Integration\AI\ChatEventLog::registerHandlers();
}
