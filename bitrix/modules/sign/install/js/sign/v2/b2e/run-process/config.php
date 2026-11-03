<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'bizproc.a11y',
		'bizproc.fields',
		'bizproc.fields.bool',
		'bizproc.fields.date',
		'bizproc.fields.datetime',
		'bizproc.fields.double',
		'bizproc.fields.file',
		'bizproc.fields.int',
		'bizproc.fields.select',
		'bizproc.fields.string',
		'bizproc.fields.text',
		'bizproc.fields.user',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.sidepanel',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.user-party',
		'ui.system.alert',
		'ui.system.typography',
		'ui.vue3.pinia',
		'ui.wizard',
	],
	'skip_core' => false,
	'settings' => [
		'region' => \Bitrix\Main\Application::getInstance()->getLicense()->getRegion(),
	],
];
