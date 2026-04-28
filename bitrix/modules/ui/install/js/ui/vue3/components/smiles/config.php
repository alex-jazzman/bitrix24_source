<?php

use Bitrix\Main\Application;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' =>[
		'./dist/smiles.bundle.js',
	],
	'css' => [
		'./dist/smiles.bundle.css',
	],
	'rel' => [
		'rest.client',
		'ui.dexie',
		'main.core',
		'ui.vue3.directives.lazyload',
		'ui.system.chip.vue',
	],
	'skip_core' => false,
	'settings' => [
		'region' => Application::getInstance()->getLicense()->getRegion(),
	],
];
