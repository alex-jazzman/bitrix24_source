<?php
return [
	'rest' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Main\\Infrastructure\\Rest\\Controller',
			'namespaces' => [
				'\\Bitrix\\Main\\Rest\\V3\\Controller',
			],
		]
	],
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Main\\Controller',
			'namespaces' => [
				'\\Bitrix\\Main\\Controller' => 'api',
			],
			'restIntegration' => [
				'enabled' => true,
				'hideModuleScope' => true,
				'scopes' => [
					'userfieldconfig',
					'mailsender',
				],
			],
		],
		'readonly' => true,
	],
	'console' => [
		'value' => [
			'commands' => [
				// orm
				\Bitrix\Main\Cli\Command\Orm\AnnotateCommand::class,

				// make
				\Bitrix\Main\Cli\Command\Make\ComponentCommand::class,
				\Bitrix\Main\Cli\Command\Make\ControllerCommand::class,
				\Bitrix\Main\Cli\Command\Make\TabletCommand::class,
				\Bitrix\Main\Cli\Command\Make\EntityCommand::class,
				\Bitrix\Main\Cli\Command\Make\ModuleCommand::class,
				\Bitrix\Main\Cli\Command\Make\RequestCommand::class,
				\Bitrix\Main\Cli\Command\Make\ServiceCommand::class,
				\Bitrix\Main\Cli\Command\Make\EventCommand::class,
				\Bitrix\Main\Cli\Command\Make\EventHandlerCommand::class,
				\Bitrix\Main\Cli\Command\Make\MessageCommand::class,
				\Bitrix\Main\Cli\Command\Make\MessageHandlerCommand::class,
				\Bitrix\Main\Cli\Command\Make\AgentCommand::class,

				// dev
				\Bitrix\Main\Cli\Command\Dev\LocatorCodesCommand::class,
				\Bitrix\Main\Cli\Command\Dev\ModuleSkeletonCommand::class,

				// main
				\Bitrix\Main\Cli\Command\Main\Option\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Option\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Option\DeleteCommand::class,
				\Bitrix\Main\Cli\Command\Main\Option\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Cache\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Cache\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Session\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Session\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Crypto\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Crypto\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Smtp\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Smtp\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\ExceptionHandling\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\ExceptionHandling\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Routing\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Settings\Routing\SetCommand::class,
				\Bitrix\Main\Cli\Command\Main\Cache\ClearCommand::class,
				\Bitrix\Main\Cli\Command\Main\Cache\ManagedClearCommand::class,
				\Bitrix\Main\Cli\Command\Main\Cache\TaggedClearCommand::class,
				\Bitrix\Main\Cli\Command\Main\Module\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Site\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Language\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Agent\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Agent\GetCommand::class,
				\Bitrix\Main\Cli\Command\Main\EventHandler\ListCommand::class,
				\Bitrix\Main\Cli\Command\Main\Feature\EnableCommand::class,
				\Bitrix\Main\Cli\Command\Main\Feature\DisableCommand::class,
				\Bitrix\Main\Cli\Command\Main\Feature\ResetCommand::class,
				\Bitrix\Main\Cli\Command\Main\SqlCommand::class,
				\Bitrix\Main\Cli\Command\Main\PhpEvalCommand::class,

				// update
				\Bitrix\Main\Cli\Command\Update\ModulesCommand::class,
				\Bitrix\Main\Cli\Command\Update\LanguagesCommand::class,
				\Bitrix\Main\Cli\Command\Update\VersionsCommand::class,

				// other
				\Bitrix\Main\Cli\Command\Messenger\ConsumeMessagesCommand::class,
			],
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'main.validation.service' => [
				'className' => \Bitrix\Main\Validation\ValidationService::class,
			],
			\Bitrix\Main\Data\Storage\StorageInterface::class => [
				'className' => \Bitrix\Main\Data\Storage\ConnectionBasedPersistentStorage::class,
			],
			\Bitrix\Main\Data\Storage\PersistentStorageInterface::class => [
				'className' => \Bitrix\Main\Data\Storage\ConnectionBasedPersistentStorage::class,
			],
			\Bitrix\Main\Application::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance(),
			],
			\Bitrix\Main\Routing\Router::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getRouter(),
			],
			\Bitrix\Main\Data\ConnectionPool::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getConnectionPool(),
			],
			\Bitrix\Main\DB\Connection::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getConnection(),
			],
			\Bitrix\Main\Data\Cache::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getCache(),
			],
			\Bitrix\Main\Data\ManagedCache::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getManagedCache(),
			],
			\Bitrix\Main\Data\TaggedCache::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getTaggedCache(),
			],
			\Bitrix\Main\Data\LocalStorage\SessionLocalStorageManager::class => [
				'constructor' => static fn() => \Bitrix\Main\Application::getInstance()->getSessionLocalStorageManager(),
			],
			\Bitrix\Main\EventManager::class => [
				'constructor' => static fn() => \Bitrix\Main\EventManager::getInstance(),
			],
			\CUserTypeManager::class => [
				'constructor' => static fn() => $GLOBALS['USER_FIELD_MANAGER'],
			],
			\CUserFieldEnum::class => [
				'className' => \CUserFieldEnum::class,
			],
			\Bitrix\Main\Config\Feature\FeatureManager::class => [
				'className' => \Bitrix\Main\Config\Feature\FeatureManager::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Main\DI\ServiceLocator::getInstance()->get(\Bitrix\Main\Config\Feature\Factory::class),
						(new \Bitrix\Main\Diag\LoggerFactory())->createById('main.config.feature'),
					];
				},
			]
		],
	],
];
