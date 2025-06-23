<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\RepeatSale\Widget\WidgetManager;

$settings = [
	'feedbackFormParams' => WidgetManager::getInstance()->getFeedbackFormParams(),
];

return [
	'css' => 'dist/widget.bundle.css',
	'js' => 'dist/widget.bundle.js',
	'rel' => [
		'ui.confetti',
		'ui.notification',
		'main.core',
		'main.popup',
		'ui.lottie',
		'ui.design-tokens',
	],
	'skip_core' => false,
	'settings' => $settings,
];