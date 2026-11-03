<?php

use Bitrix\Mobile\Menu\ToolUsage\ToolUsage;

return [
	'allowedToolIds' => ToolUsage::getAllowedTools(),
	'isTrackingAvailable' => ToolUsage::isTrackingAvailable(),
];
