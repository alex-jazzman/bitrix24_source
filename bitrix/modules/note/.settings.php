<?php

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Note\\Controller',
			'namespaces' => [
				'\\Bitrix\\Note\\Infrastructure\\Controller' => 'infrastructure',
			],
		],
		'readonly' => true,
	],
	'rest' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Note\\Infrastructure\\Rest\\V3\\Controller',
		],
	],
	'accessRightsV2' => [
		'value' => [
			'access' => '\\Bitrix\\Note\\Internal\\Access\\Permission\\Permission',
		],
	],
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'note-collection',
					'provider' => [
						'moduleId' => 'note',
						'className' => '\\Bitrix\\Note\\Internal\\Integration\\UI\\EntitySelector\\CollectionProvider',
					],
				],
			],
		],
		'readonly' => true,
	],
];
