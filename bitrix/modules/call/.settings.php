<?php

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Call\\Controller',
			'restIntegration' => [
				'enabled' => true,
			],
		],
		'readonly' => true,
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'call-log',
					'provider' => [
						'moduleId' => 'call',
						'className' => \Bitrix\Call\Integration\UI\EntitySelector\CallLogProvider::class,
					],
				],
			],
			'extensions' => ['im.entity-selector'],
		],
		'readonly' => true,
	],
];