<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;

$settings = [
	'region' => mb_strtolower(Application::getInstance()->getLicense()->getRegion() ?? ''),
];

return [
	'css' => 'dist/call.bundle.css',
	'js' => 'dist/call.bundle.js',
	'rel' => [
		'crm.ai.name-service',
		'crm.ai.slider',
		'crm.ai.textbox',
		'crm.audio-player',
		'crm.copilot.call-assessment-selector',
		'crm.router',
		'crm.timeline.tools',
		'main.core',
		'main.core.events',
		'pull.client',
		'pull.queuemanager',
		'ui.bbcode.formatter.html-formatter',
		'ui.design-tokens',
		'ui.lottie',
		'ui.notification',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => $settings,
];
