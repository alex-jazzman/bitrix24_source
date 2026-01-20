<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/edit-form.bundle.css',
	'js' => 'dist/edit-form.bundle.js',
	'rel' => [
		'main.sidepanel',
		'main.popup',
		'ui.buttons',
		'tasks.wizard',
		'tasks.interval-selector',
		'main.polyfill.intersectionobserver',
		'pull.client',
		'ui.entity-selector',
		'main.core.events',
		'main.core',
		'ui.form-elements.view',
		'ui.lottie',
		'ui.dialogs.messagebox',
		'ui.sidepanel-content',
		'ui.forms',
		'ui.hint',
	],
	'settings' => [
		'currentUser' => \Bitrix\Main\Engine\CurrentUser::get()->getId(),
		'needUseSchedule' => true,
	],
	'skip_core' => false,
];
