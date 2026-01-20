<?php

use Bitrix\Tasks\V2\Internal\Entity\UF\UserField;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$ufManager = $GLOBALS['USER_FIELD_MANAGER'];
$crmIntegration = [
	'task' => $ufManager->getUserFields(UserField::TASK)[UserField::TASK_CRM]['SETTINGS'] ?? null,
	'template' => $ufManager->getUserFields(UserField::TEMPLATE)[UserField::TASK_CRM]['SETTINGS'] ?? null,
];

return [
	'css' => 'dist/crm.bundle.css',
	'js' => 'dist/crm.bundle.js',
	'rel' => [
		'ui.system.skeleton.vue',
		'tasks.v2.component.elements.add-button',
		'tasks.v2.component.elements.field-add',
		'ui.vue3.components.rich-loc',
		'ui.system.typography.vue',
		'ui.system.menu.vue',
		'tasks.v2.component.elements.hover-pill',
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.id-utils',
		'tasks.v2.provider.service.crm-service',
		'tasks.v2.provider.service.task-service',
		'tasks.v2.lib.entity-selector-dialog',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.core',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.show-limit',
	],
	'skip_core' => false,
	'settings' => [
		'crmIntegration' => $crmIntegration,
	],
];
