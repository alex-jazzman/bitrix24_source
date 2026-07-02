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
		'crm.ai.name-service',
		'crm.integration.analytics',
		'crm.timeline.tools',
		'main.core',
		'main.popup',
		'ui.analytics',
		'ui.confetti',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.feedback.form',
		'ui.hint',
		'ui.lottie',
		'ui.notification',
		'ui.system.highlighter',
	],
	'skip_core' => false,
	'settings' => $settings,
];
