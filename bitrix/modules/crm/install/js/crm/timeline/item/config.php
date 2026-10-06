<?php

use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\AI\Operation\Scenario;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$aiScenarioList = [];
if (Loader::includeModule('crm'))
{
	$aiScenarioList = [
		Scenario::TRANSCRIBE_RECORD_SCENARIO,
		Scenario::SUMMARIZE_SCENARIO,
		Scenario::FILL_FIELDS_SCENARIO,
		Scenario::CALL_SCORING_SCENARIO,
		Scenario::CALL_SCORING_V2_SCENARIO,
		Scenario::ANALYZE_COMMUNICATION_SCENARIO,
		Scenario::FULL_SCENARIO,
	];
}

$settings = [
	'hasLocationModule' => ModuleManager::isModuleInstalled('location'),
	'aiScenarioList' => $aiScenarioList,
];

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'ai.ajax-error-handler',
		'bizproc.types',
		'calendar.sharing.interface',
		'calendar.util',
		'crm.activity.file-uploader-popup',
		'crm.ai.call',
		'crm.ai.name-service',
		'crm.audio-player',
		'crm.entity-editor',
		'crm.entity-editor.field.payment-documents',
		'crm.field.color-selector',
		'crm.field.item-selector',
		'crm.field.ping-selector',
		'crm.integration.analytics',
		'crm.router',
		'crm.timeline.dialog',
		'crm.timeline.editors.comment-editor',
		'crm.timeline.tools',
		'crm_common',
		'currency.currency-core',
		'location.core',
		'location.widget',
		'main.core',
		'main.core.events',
		'main.date',
		'main.lazyload',
		'main.loader',
		'main.popup',
		'main.sidepanel',
		'pull.client',
		'rest.client',
		'ui.a11y',
		'ui.alerts',
		'ui.analytics',
		'ui.avatar',
		'ui.bbcode.formatter.html-formatter',
		'ui.buttons',
		'ui.cnt',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.feedback.form',
		'ui.hint',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.icons.generator',
		'ui.image-stack-steps',
		'ui.info-helper',
		'ui.lottie',
		'ui.notification',
		'ui.progressround',
		'ui.sidepanel',
		'ui.system.chip.vue',
		'ui.system.dialog',
		'ui.system.label',
		'ui.system.menu',
		'ui.system.typography.vue',
		'ui.text-editor',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.directives.hint',
	],
	'settings' => $settings,
	'skip_core' => false,
	'oninit' => static function() {
		if (!Loader::includeModule('crm'))
		{
			return [];
		}

		return [
			'lang_additional' => [
				'AI_APP_COLLECTION_MARKET_LINK' => AIManager::getAiAppCollectionMarketLink(),
			],
		];
	}
];
