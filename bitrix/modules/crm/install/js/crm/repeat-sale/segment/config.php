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
	'css' => 'dist/segment.bundle.css',
	'js' => 'dist/segment.bundle.js',
	'rel' => [
		'crm.ai.name-service',
		'crm.field.inline-placeholder-selector',
		'crm.integration.analytics',
		'main.core',
		'main.core.events',
		'ui.analytics',
		'ui.bbcode.parser',
		'ui.buttons',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.info-helper',
		'ui.notification',
		'ui.promo-video-popup',
		'ui.switcher',
		'ui.text-editor',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => $settings,
];
