<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];

// Whom the editor offers the release of a foreign lease to. The same definition the lease actions of
// the controller use, so the menu never offers what the server would refuse. The feature is asked first:
// with it off there is no such menu item, and this config runs on every load of the editor page - neither
// bizproc nor the legacy object is worth including for an answer nobody reads. Its own module comes
// first all the same: the extension may be pulled in by a page that has not loaded it, and Feature
// lives there.
if (
	CModule::IncludeModule('bizprocdesigner')
	&& \Bitrix\BizprocDesigner\Internal\Config\Feature::instance()->isTemplateEditLockAvailable()
	&& CModule::IncludeModule('bizproc')
)
{
	$currentUser = \Bitrix\Main\Engine\CurrentUser::get();
	$settings['isPortalAdmin'] = $currentUser->isAdmin()
		|| (CModule::IncludeModule('bitrix24') && CBitrix24::IsPortalAdmin((int)$currentUser->getId()));
}

return [
	'css' => 'dist/chart.bundle.css',
	'js' => 'dist/chart.bundle.js',
	'rel' => [
		'bizproc.condition',
		'bizproc.dataview',
		'bizproc.router',
		'bizprocdesigner.editor.ai-assistant-widget-settings',
		'bizprocdesigner.expression-builder',
		'bizprocdesigner.feature',
		'disk.uploader.user-field-widget',
		'main.core',
		'main.core.events',
		'main.core.z-index-manager',
		'main.date',
		'main.popup',
		'pull.client',
		'ui.a11y',
		'ui.banner-dispatcher',
		'ui.bbcode.formatter.html-formatter',
		'ui.block-diagram',
		'ui.buttons',
		'ui.date-picker',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.draganddrop.draggable',
		'ui.entity-selector',
		'ui.feedback.form',
		'ui.icon-set.animated',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.solid',
		'ui.info-helper',
		'ui.loader',
		'ui.notification',
		'ui.progressround',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.checkbox',
		'ui.system.chip.vue',
		'ui.system.dialog',
		'ui.system.input',
		'ui.system.input.vue',
		'ui.system.skeleton.vue',
		'ui.system.typography.vue',
		'ui.text-editor',
		'ui.tour',
		'ui.uploader.vue',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-loc',
		'ui.vue3.directives.hint',
		'ui.vue3.pinia',
		'window',
	],
	'skip_core' => false,
	'settings' => $settings,
];
