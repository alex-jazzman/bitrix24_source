<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-template-user-party.bundle.css',
	'js' => 'dist/document-template-user-party.bundle.js',
	'rel' => [
		'main.core',
		'sign.v2.api',
		'sign.v2.b2e.sign-settings-templates',
		'sign.v2.b2e.user-party',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => [
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
		'signersLimitCount' => \Bitrix\Main\Loader::includeModule('sign')
			? Bitrix\Sign\Integration\Bitrix24\B2eTariff::instance()->getB2eSignersCountLimitWithUnlimitCheck()
			: null
		,
	],
];
