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
	'css' => 'dist/onboarding-popup.bundle.css',
	'js' => 'dist/onboarding-popup.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'crm.integration.ui.banner-dispatcher',
		'main.core',
		'main.popup',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
	'settings' => $settings,
];
