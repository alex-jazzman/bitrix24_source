<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/edit-form.bundle.css',
	'js' => 'dist/edit-form.bundle.js',
	'rel' => [
		'ui.buttons',
		'tasks.wizard',
		'tasks.interval-selector',
		'main.popup',
		'ui.hint',
		'pull.client',
		'ui.entity-selector',
		'main.core.events',
		'main.core',
		'ui.form-elements.view',
		'ui.lottie',
		'ui.sidepanel-content',
		'ui.forms',
	],
	'settings' => [
		'currentUser' => \Bitrix\Main\Engine\CurrentUser::get()->getId(),
	],
	'skip_core' => false,
];