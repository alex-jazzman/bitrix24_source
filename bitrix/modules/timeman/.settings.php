<?php
return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Timeman\\Controller',
			'restIntegration' => [
				'enabled' => true,
			],
			'namespaces' => [
				'\\Bitrix\\Timeman\\Controller' => 'api',
				'\\Bitrix\\Timeman\\V2\\Infrastructure\\Controller' => 'v2',
			],
		],
		'readonly' => true,
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'timeman-full-report-user',
					'substitutes' => 'user',
					'provider' => [
						'moduleId' => 'timeman',
						'className' => \Bitrix\Timeman\V2\Internal\Integration\Ui\FullReportUserProvider::class,
					],
					'options' => [
						'dynamicLoad' => true,
						'dynamicSearch' => true,
					],
				],
			],
		],
		'readonly' => true,
	],
	'services' => require __DIR__ . '/config/services.php',
	'rest' => require __DIR__ . '/config/rest.php',
];