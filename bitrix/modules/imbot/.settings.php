<?php
return [
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'imbot-network',
					'provider' => [
						'moduleId' => 'imbot',
						'className' => '\\Bitrix\\ImBot\\Integration\\Ui\\EntitySelector\\NetworkProvider',
					],
				],
			],
		],
	],
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\ImBot\\Controller',
			'restIntegration' => [
				'enabled' => true,
			]
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'imbot.bot.support' => [
				'className' => \Bitrix\Imbot\Bot\SupportService::class,
			],
		],
		'readonly' => true,
	],

];
