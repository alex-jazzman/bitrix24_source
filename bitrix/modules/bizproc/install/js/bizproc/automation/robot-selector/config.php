<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$portalUri = null;
$forms = null;

if (\Bitrix\Main\Loader::includeModule('ui'))
{
	$portalUri = (new Bitrix\UI\Form\UrlProvider())->getPartnerPortalUrl();
	$forms = Bitrix\UI\Form\formsprovider::getForms();
}

return [
	'css' => 'dist/robot-selector.bundle.css',
	'js' => 'dist/robot-selector.bundle.js',
	'rel' => [
		'main.core.events',
		'main.popup',
		'bizproc.automation',
		'bizproc.local-settings',
		'main.core',
		'ui.entity-catalog',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
	'settings' => [
		'portalUri' => $portalUri,
		'forms' => $forms,
	],
];