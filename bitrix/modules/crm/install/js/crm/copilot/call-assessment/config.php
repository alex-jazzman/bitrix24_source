<?php

use Bitrix\Crm\Feature;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];
if (Loader::includeModule('crm'))
{
	$settings['callAssessmentAvailabilityEnabled'] = Feature::enabled(Feature\CopilotCallAssessmentAvailability::class);
}

return [
	'css' => 'dist/call-assessment.bundle.css',
	'js' => 'dist/call-assessment.bundle.js',
	'rel' => [
		'crm.ai.name-service',
		'crm.timeline.tools',
		'main.core',
		'main.core.events',
		'main.date',
		'pull.queuemanager',
		'ui.bbcode.parser',
		'ui.buttons',
		'ui.date-picker',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.main',
		'ui.info-helper',
		'ui.notification',
		'ui.text-editor',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => $settings,
];
