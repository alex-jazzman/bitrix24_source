<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];

if (\Bitrix\Main\Loader::includeModule('messageservice'))
{
	$config = \Bitrix\Main\DI\ServiceLocator::getInstance()->get(\Bitrix\MessageService\Infrastructure\UI\Message\Editor\GlobalConfig::class);

	$settings = [
		...$settings,
		'recommendedMaxMessageLength' => $config->getRecommendedMaxMessageLength(),
		'contactCenterUrl' => \Bitrix\MessageService\Integration\ImOpenLines::getContactCenterUrl(),
	];
}

return [
	'css' => 'dist/editor.bundle.css',
	'js' => 'dist/editor.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'messageservice.channel.selector',
		'messageservice.message.editor.skeleton',
		'messageservice.template.editor',
		'ui.alerts',
		'ui.analytics',
		'ui.bbcode.model',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.social',
		'ui.lexical.clipboard',
		'ui.lexical.core',
		'ui.system.chip.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.text-editor',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
	'settings' => $settings,
];
