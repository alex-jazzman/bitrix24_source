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
		'crm.integration.analytics',
		'crm.messagesender',
		'crm.messagesender.channel-selector',
		'crm.messagesender.editor.skeleton',
		'crm.template.editor',
		'main.core',
		'main.core.events',
		'ui.alerts',
		'ui.analytics',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.social',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
	'settings' => $settings,
];
