<?php

use Bitrix\Bizproc\Integration\UI\EntitySelector\DocumentTypeProvider;
use Bitrix\Bizproc\Integration\UI\EntitySelector\TemplateProvider;
use Bitrix\Bizproc\Integration\UI\EntitySelector\ScriptTemplateProvider;
use Bitrix\Bizproc\Integration\UI\EntitySelector\AutomationTemplateProvider;
use Bitrix\Bizproc\Integration\UI\EntitySelector\DocumentProvider;
use Bitrix\Bizproc\Integration\UI\EntitySelector\SystemProvider;

return [
	'console' => [
		'value' => [
			'commands' => [
				\Bitrix\Bizproc\Cli\NodesExport::class,
			],
		],
		'readonly' => true,
	],
	'controllers' => [
		'value' => [
			'namespaces' => [
				'\\Bitrix\\Bizproc\\Controller' => 'api',
				'\\Bitrix\\Bizproc\\Infrastructure\\Controller' => 'v2',
			],
			'defaultNamespace' => '\\Bitrix\\Bizproc\\Controller',
			'restIntegration' => [
				'enabled' => false,
			],
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'bizproc.service.schedulerService' => [
				'className' => '\\CBPSchedulerService',
			],
			'bizproc.service.stateService' => [
				'className' => '\\CBPStateService',
			],
			/** @see autoload.php */
			//'bizproc.service.trackingService' => [
			//	'className' => '\\CBPTrackingService',
			//],
			'bizproc.service.taskService' => [
				'className' => '\\CBPTaskService',
			],
			'bizproc.service.historyService' => [
				'className' => '\\CBPHistoryService',
			],
			'bizproc.service.documentService' => [
				'className' => '\\CBPDocumentService',
			],
			'bizproc.service.analyticsService' => [
				'className' => '\\Bitrix\\Bizproc\\Service\\Analytics',
			],
			'bizproc.service.userService' => [
				'className' => '\\Bitrix\\Bizproc\\Service\\User',
			],
			'bizproc.service.aiDescriptionService' => [
				'className' => '\\Bitrix\\Bizproc\\Service\\AiDescription',
			],
			'bizproc.debugger.service.trackingService' => [
				'className' => '\\Bitrix\\Bizproc\\Debugger\\Services\\TrackingService',
			],
			'bizproc.debugger.service.analyticsService' => [
				'className' => '\\Bitrix\\Bizproc\\Debugger\\Services\\AnalyticsService',
			],
			'bizproc.workflow.state.repository.mapper' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\Mapper\\WorkflowStateMapper',
			],
			'bizproc.workflow.state.repository' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\WorkflowStateRepository\\WorkflowStateRepository',
				'constructorParams' => static function() {
					return [
						\Bitrix\Bizproc\Internal\Container::getWorkflowStatRepositoryMapper(),
					];
				},
			],
			'bizproc.runtime.activitysearcher.searcher' => [
				'className' => \Bitrix\Bizproc\Runtime\ActivitySearcher\Searcher::class,
			],
			'bizproc.container' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Container',
			],
			'bizproc.storage.type.repository' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\StorageTypeRepository\\StorageTypeRepository',
				'constructorParams' => static function() {
					return [
						\Bitrix\Bizproc\Internal\Container::getStorageTypeRepositoryMapper(),
					];
				},
			],
			'bizproc.storage.type.repository.mapper' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\Mapper\\StorageTypeMapper',
			],
			'bizproc.storage.item.repository.mapper' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\Mapper\\StorageItemMapper',
			],
			'bizproc.storage.field.repository.mapper' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\Mapper\\StorageFieldMapper',
			],
			'bizproc.storage.item.repository' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\StorageItemRepository\\SqlStorageItemRepository',
				'constructorParams' => static function() {
					return [
						\Bitrix\Bizproc\Internal\Container::getStorageItemRepositoryMapper(),
					];
				},
			],
			'bizproc.storage.field.repository' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\StorageFieldRepository\\StorageFieldRepository',
				'constructorParams' => static function() {
					return [
						\Bitrix\Bizproc\Internal\Container::getStorageFieldRepositoryMapper(),
					];
				},
			],
			'bizproc.workflow.template.repository' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Repository\\WorkflowTemplate\\WorkflowTemplateRepository',
			],
			'bizproc.service.activity.complex' => [
				'className' => '\\Bitrix\\Bizproc\\Internal\\Service\\Activity\\ComplexActivityService',
			],
			'bizproc.service.activity.nameGenerator' => [
				'className' => '\\Bitrix\\Bizproc\\Public\\Service\\Activity\\ActivityNameGeneratorService',
			],
			'bizproc.clear.stuck.workflow.command.handler' => [
				'className' => '\Bitrix\Bizproc\Public\Command\WorkflowState\ClearStuckWorkflowCommand\ClearStuckWorkflowCommandHandler',
				'constructorParams' => static function() {
					return [
						\Bitrix\Bizproc\Internal\Container::getWorkflowStateRepository(),
					];
				},
			],
		]
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'bizproc-template',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => TemplateProvider::class,
					],
				],
				[
					'entityId' => 'bizproc-script-template',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => ScriptTemplateProvider::class,
					],
				],
				[
					'entityId' => 'bizproc-automation-template',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => AutomationTemplateProvider::class,
					],
				],
				[
					'entityId' => 'bizproc-document',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => DocumentProvider::class,
					],
				],
				[
					'entityId' => 'bizproc-system',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => SystemProvider::class,
					],
				],
				[
					'entityId' => 'bizproc-document-type',
					'provider' => [
						'moduleId' => 'bizproc',
						'className' => DocumentTypeProvider::class,
					],
				],
			],
			'extensions' => ['bizproc.entity-selector'],
		],
		'readonly' => true,
	],
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
	'messenger' => [
		'value' => [
			'brokers' => [
				'workflow_db' => [
					'type' => \Bitrix\Main\Messenger\Internals\Broker\DbBroker::TYPE_CODE,
					'params' => [
						'table' => \Bitrix\Bizproc\Internal\Service\Scheduler\Messenger\Model\WorkflowStartMessageTable::class,
					]
				]
			],
			'queues' => [
				'start_workflow_queue' => [
					'broker' => 'workflow_db',
					'handler' => \Bitrix\Bizproc\Internal\Service\Scheduler\Messenger\Receiver\WorkflowStartReceiver::class,
				],
			],
		],
		'readonly' => true,
	],
];
