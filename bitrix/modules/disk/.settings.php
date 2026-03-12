<?php

use Bitrix\Disk\Bitrix24Disk\SubscriberManager;
use Bitrix\Disk\Document\DocumentHandlersManager;
use Bitrix\Disk\Document\OnlyOffice;
use Bitrix\Disk\Internal\Repository\BitrixOrmDocumentRestrictionLogRepository;
use Bitrix\Disk\Internal\Repository\BitrixOrmDocumentSessionRepository;
use Bitrix\Disk\Internal\Repository\Interface\DocumentRestrictionLogRepositoryInterface;
use Bitrix\Disk\Internal\Repository\Interface\DocumentSessionRepositoryInterface;
use Bitrix\Disk\Internals\DeletedLogManager;
use Bitrix\Disk\Internals\DeletionNotifyManager;
use Bitrix\Disk\Internals\Runtime\StorageRuntimeCache;
use Bitrix\Disk\RecentlyUsedManager;
use Bitrix\Disk\Rest\RestManager;
use Bitrix\Disk\RightsManager;
use Bitrix\Disk\Search\IndexManager;
use Bitrix\Disk\Uf\UserFieldManager;
use Bitrix\Disk\UrlManager;
use Bitrix\Disk\TrackedObjectManager;

return [
	'controllers' => [
		'value' => [
			'namespaces' => [
				'\\Bitrix\\Disk\\Controller' => 'api',
			],
			'defaultNamespace' => '\\Bitrix\\Disk\\Controller',
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'disk.onlyofficeConfiguration' => [
				'className' => OnlyOffice\Configuration::class,
			],
			'disk.urlManager' => [
				'className' => UrlManager::class,
			],
			'disk.storageRuntimeCache' => [
				'className' => StorageRuntimeCache::class,
			],
			'disk.documentHandlersManager' => [
				'className' => DocumentHandlersManager::class,
				'constructorParams' => static function() {
					global $USER;

					return [
						'userId' => $USER,
					];
				},
			],
			'disk.rightsManager' => [
				'className' => RightsManager::class,
			],
			'disk.ufManager' => [
				'className' => UserFieldManager::class,
			],
			'disk.indexManager' => [
				'className' => IndexManager::class,
			],
			'disk.recentlyUsedManager' => [
				'className' => RecentlyUsedManager::class,
			],
			'disk.restManager' => [
				'className' => RestManager::class,
			],

			'disk.subscriberManager' => [
				'className' => SubscriberManager::class,
			],
			'disk.deletedLogManager' => [
				'className' => DeletedLogManager::class,
			],

			'disk.deletionNotifyManager' => [
				'className' => DeletionNotifyManager::class,
			],
			'disk.trackedObjectManager' => [
				'className' => TrackedObjectManager::class,
			],
			DocumentRestrictionLogRepositoryInterface::class => [
				'className' => BitrixOrmDocumentRestrictionLogRepository::class,
			],
			DocumentSessionRepositoryInterface::class => [
				'className' => BitrixOrmDocumentSessionRepository::class,
			],
		],
		'readonly' => true,
	],
	'b24documents' => [
		'value' => [
			'serverListEndpoint' => 'https://oo-proxy.bitrix.info/settings/config.json',
		],
		'readonly' => true,
	],
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
	'boards' => [
		'value' => [
			'client_token_header_lookup' => 'X-Permissions',
			'api_host' => 'https://flip-backend',
			'jwt_secret' => 'secret_token',
			'jwt_ttl' => 30,
			'app_url' => 'https://flip-backend/app',
			'save_delta_time' => 30,
			'save_probability_coef' => 0.1,
			'webhook_url' => '/bitrix/services/main/ajax.php?action=disk.integration.flipchart.webhook',
		],
		'readonly' => true,
	],
	'promo' => [
		'value' => [
			'cloud_tariff_groups' => [
				'extendable' => [
					'demo',
					'nfr',
					'std',
					'pro100',
					'ent250',
					'ent500',
				],
				'large_enterprise' => [
					'ent1000',
					'ent2000',
					'ent3000',
					'ent4000',
					'ent5000',
					'ent6000',
					'ent7000',
					'ent8000',
					'ent9000',
					'ent10000',
					'entholding1000',
					'entholding2000',
					'entholding3000',
					'entholding4000',
					'entholding5000',
					'entholding6000',
					'entholding7000',
					'entholding8000',
					'entholding9000',
					'entholding10000',
				],
			],
		],
		'readonly' => true,
	],
	'extendableTariffs' => [
		'value' => [
			'std',
			'pro100',
			'ent250',
			'ent500',
		],
		'readonly' => true,
	],
];