<?php

declare(strict_types=1);

use \Bitrix\Rest;

return [
	'rest' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Rest\\V3\\Realisation\\Controller',
			'namespaces' => [
				'\\Bitrix\\Rest\\Infrastructure\\Rest\\Controller',
			],
			'routes' => [
				'documentation' => 'rest.documentation.openApi',
				'scopes' => 'rest.scope.list',
			],
			'documentation' => [
				'methods' => [
					'batch' => \Bitrix\Rest\V3\Documentation\BatchMethodProvider::class,
				],
			],
		]
	],
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Rest\\Controller',
			'restIntegration' => [
				'enabled' => true,
				'hideModuleScope' => true,
				'scopes' => [
					'appform',
					'configuration.import',
					'user',
				],
			],
		],
		'readonly' => true
	],
	'services' => [
		'value' => [
			'rest.service.apauth.password' => [
				'className' => \Bitrix\Rest\Service\APAuth\PasswordService::class,
			],
			'rest.service.apauth.permission' => [
				'className' => \Bitrix\Rest\Service\APAuth\PermissionService::class,
			],
			'rest.service.app' => [
				'constructor' => function () {
					return new Rest\Service\AppService(
						new Rest\Internal\Repository\Application\AppRepository()
					);
				},
			],
			'rest.service.integration' => [
				'constructor' => function () {
					return new \Bitrix\Rest\Service\IntegrationService(
						new \Bitrix\Rest\Repository\IntegrationRepository(
							new Bitrix\Rest\Model\Mapper\Integration()
						)
					);
				},
			],
			'rest.repository.app' => [
				'constructor' => static function () {
					return new Rest\Internal\Repository\Application\AppRepository();
				},
			],
			Rest\Internal\Service\Application\ApplicationInstaller::class => [
				'constructor' => static function () {
					return new Rest\Internal\Service\Application\ApplicationInstaller(
						\Bitrix\Main\DI\ServiceLocator::getInstance()->get('rest.repository.app'),
					);
				},
			],
			'rest.repository.integration' => [
				'constructor' => static function () {
					return new \Bitrix\Rest\Repository\IntegrationRepository(
						new \Bitrix\Rest\Model\Mapper\Integration()
					);
				},
			],
		],
		'readonly' => true,
	]
];
