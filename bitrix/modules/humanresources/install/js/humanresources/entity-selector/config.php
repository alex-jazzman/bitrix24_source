<?php

use \Bitrix\Main\Localization\Loc;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loc::loadMessages(__DIR__ . '/options.php');

return [
	'css' => 'dist/entity-selector.bundle.css',
	'js' => 'dist/entity-selector.bundle.js',
	'rel' => [
		'humanresources.department-creation-popup',
		'main.core',
		'ui.entity-selector',
	],
	'skip_core' => false,
	'settings' => [
		'entities' => [
			[
				'id' => 'structure-node',
				'options' => [
					'dynamicLoad' => true,
					'dynamicSearch' => true,
				],
			],
		],
	],
];
