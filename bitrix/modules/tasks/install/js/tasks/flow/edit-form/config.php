<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/edit-form.bundle.css',
	'js' => 'dist/edit-form.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'main.sidepanel',
		'pull.client',
		'tasks.interval-selector',
		'tasks.wizard',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.form-elements.view',
		'ui.forms',
		'ui.hint',
		'ui.lottie',
		'ui.sidepanel-content',
	],
	'settings' => [
		'currentUser' => \Bitrix\Main\Engine\CurrentUser::get()->getId(),
		'needUseSchedule' => true,
	],
	'skip_core' => false,
];
