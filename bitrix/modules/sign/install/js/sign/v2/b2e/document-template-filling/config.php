<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('sign'))
{
	return [];
}

$container = \Bitrix\Sign\Service\Container::instance();

return [
	'css' => 'dist/document-template-filling.bundle.css',
	'js' => 'dist/document-template-filling.bundle.js',
	'rel' => [
		'crm.router',
		'main.core',
		'main.date',
		'sign.type',
		'sign.v2.b2e.sign-settings-templates',
		'sign.v2.b2e.vue-util',
		'ui.switcher',
		'ui.vue3',
		'ui.vue3.components.hint',
		'ui.vue3.components.switcher',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
	'settings' => [
		'signingMinMinutes' => $container->getSignUntilService()->getMinSigningPeriodInMinutes(),
		'signingMaxMonth' => (int)$container->getSignUntilService()->getMaxSigningPeriod()->format('%m'),
	],
];
