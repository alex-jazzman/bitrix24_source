<?php

use Bitrix\BIConnector\Internal\Integration\AiAssistant\ToolSet\BiDashboardsToolSet;
use Bitrix\BIConnector\Integration\UI\EntitySelector\ExternalConnectionProvider;
use Bitrix\BIConnector\Integration\UI\EntitySelector\ExternalTableProvider;
use Bitrix\BIConnector\Integration\UI\EntitySelector\SupersetDashboardProvider;
use Bitrix\BIConnector\Integration\UI\EntitySelector\SupersetDashboardTagProvider;
use Bitrix\BIConnector\Integration\UI\EntitySelector\SupersetGroupProvider;
use Bitrix\BIConnector\Integration\UI\EntitySelector\SupersetScopeProvider;
use Bitrix\Biconnector\Internal\Integration\Im\DashboardDiscussionChatAccessSyncService;
use Bitrix\Biconnector\Internal\Integration\Im\DashboardDiscussionChatService;
use Bitrix\Biconnector\Public\Provider\DashboardDetailInfoProvider;
use Bitrix\Biconnector\Public\Services\AhaMoment\AhaMomentSpotlightResolver;
use Bitrix\Biconnector\Internal\Services\DashboardInfo\FileCleanupService;
use Bitrix\BIConnector\Internal\Repository\Mapper\SupersetDashboardShareMapper;
use Bitrix\BIConnector\Internal\Repository\SupersetDashboardShareRepository;
use Bitrix\BIConnector\Internal\Services\Share\SharePasswordService;
use Bitrix\BIConnector\Public\Provider\ShareProvider;
use Bitrix\Main\Config\Option;

$biDashboardsToolSets = Option::get('biconnector', 'bitrixgpt_bi_constructor', 'N') === 'Y'
	? [BiDashboardsToolSet::class]
	: [];

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\BIConnector\\Controller',
			'restIntegration' => [
				'enabled' => true,
			],
		],
		'readonly' => true,
	],
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'biconnector.service.dashboardInfo.fileCleanup' => [
				'className' => FileCleanupService::class,
			],
			'biconnector.service.dashboardDiscussionChat' => [
				'className' => DashboardDiscussionChatService::class,
			],
			'biconnector.service.dashboardDiscussionChatAccessSync' => [
				'className' => DashboardDiscussionChatAccessSyncService::class,
			],
			'biconnector.service.ahaMomentSpotlightResolver' => [
				'className' => AhaMomentSpotlightResolver::class,
			],
			'biconnector.provider.dashboardDetailInfo' => [
				'className' => DashboardDetailInfoProvider::class,
			],
			'biconnector.repository.share.mapper' => [
				'className' => SupersetDashboardShareMapper::class,
			],
			'biconnector.repository.share' => [
				'className' => SupersetDashboardShareRepository::class,
				'constructorParams' => static fn() => [
					'mapper' => \Bitrix\Main\DI\ServiceLocator::getInstance()->get('biconnector.repository.share.mapper'),
				],
			],
			'biconnector.service.sharePassword' => [
				'className' => SharePasswordService::class,
				'constructorParams' => static fn() => [
					'repository' => \Bitrix\Main\DI\ServiceLocator::getInstance()->get('biconnector.repository.share'),
				],
			],
			'biconnector.provider.share' => [
				'className' => ShareProvider::class,
				'constructorParams' => static fn() => [
					'repository' => \Bitrix\Main\DI\ServiceLocator::getInstance()->get('biconnector.repository.share'),
				],
			],
		],
		'readonly' => true,
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'biconnector-superset-dashboard',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => SupersetDashboardProvider::class,
					],
				],
				[
					'entityId' => 'biconnector-superset-dashboard-tag',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => SupersetDashboardTagProvider::class,
					],
				],
				[
					'entityId' => 'biconnector-superset-scope',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => SupersetScopeProvider::class,
					],
				],
				[
					'entityId' => 'biconnector-external-connection',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => ExternalConnectionProvider::class,
					],
				],
				[
					'entityId' => 'biconnector-external-table',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => ExternalTableProvider::class,
					],
				],
				[
					'entityId' => 'biconnector-superset-group',
					'provider' => [
						'moduleId' => 'biconnector',
						'className' => SupersetGroupProvider::class,
					],
				],
			],
			'extensions' => ['biconnector.entity-selector'],
		],
		'readonly' => true,
	],
	'aiassistant.marta' => [
		'value' => [
			'toolSets' => $biDashboardsToolSets,
		],
		'readonly' => true,
	],
];
