<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];

if (\Bitrix\Main\Loader::includeModule('crm'))
{
	$config =  \Bitrix\Crm\MessageSender\UI\Editor\GlobalConfig::getInstance();

	$settings = [
		'recommendedMaxMessageLength' => $config->getRecommendedMaxMessageLength(),
	];
}

return [
	'css' => 'dist/editor.bundle.css',
	'js' => 'dist/editor.bundle.js',
	'rel' => [
		'crm.messagesender',
		'crm.messagesender.editor.skeleton',
		'main.core.events',
		'ui.vue3',
		'ui.vue3.directives.hint',
		'ui.alerts',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
		'crm.messagesender.channel-selector',
		'ui.icon-set.outline',
		'ui.icon-set.social',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.system.chip.vue',
		'crm.template.editor',
		'ui.vue3.vuex',
		'crm.integration.analytics',
		'ui.analytics',
		'main.core',
		'ui.design-tokens',
		'ui.design-tokens.air',
	],
	'skip_core' => false,
	'settings' => $settings,
];
