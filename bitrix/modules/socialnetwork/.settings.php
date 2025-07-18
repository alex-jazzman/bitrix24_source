<?php

use Bitrix\Socialnetwork\Integration\UI\EntitySelector;

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Socialnetwork\\Controller',
			'namespaces' => [
				'\\Bitrix\\Socialnetwork\\Controller' => 'api',
				'\\Bitrix\\Socialnetwork\\Collab\\Controller' => 'collab',
			],
			'restIntegration' => [
				'enabled' => true
			],
		],
		'readonly' => true,
	],
	'ui.selector' => [
		'value' => [
			'socialnetwork.selector'
		],
		'readonly' => true,
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'user',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\UserProvider::class
					],
				],
				[
					'entityId' => 'fired-user',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\FiredUserProvider::class
					],
				],
				[
					'entityId' => 'project-user',
					'substitutes' => 'user',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\ProjectUserProvider::class
					],
				],
				[
					'entityId' => 'project',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\ProjectProvider::class
					],
				],
				[
					'entityId' => 'meta-user',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\MetaUserProvider::class
					],
				],
				[
					'entityId' => 'project-tag',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\ProjectTagProvider::class,
					],
				],
				[
					'entityId' => 'project-roles',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\ProjectRolesProvider::class,
					],
				],
				[
					'entityId' => 'project-access-codes',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\ProjectAccessCodesProvider::class,
					],
				],
				[
					'entityId' => 'site-groups',
					'provider' => [
						'moduleId' => 'socialnetwork',
						'className' => EntitySelector\SiteGroupsProvider::class,
					],
				],
			],
			'extensions' => ['socialnetwork.entity-selector'],
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'socialnetwork.collab.member.facade' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\Member\CollabMemberFacade::class,
			],
			'socialnetwork.group.member.service' => [
				'className' => \Bitrix\Socialnetwork\Control\Member\GroupMemberService::class,
			],
			'socialnetwork.group.service' => [
				'className' => \Bitrix\Socialnetwork\Control\GroupService::class,
			],
			'socialnetwork.collab.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\CollabService::class,
			],
			'socialnetwork.collab.option.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\Option\OptionService::class,
			],
			'socialnetwork.collab.activity.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\Activity\LastActivityService::class
			],
			'socialnetwork.collab.log.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\Log\LogEntryService::class
			],
			'socialnetwork.collab.invitation.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Control\Invite\InvitationService::class,
			],
			'socialnetwork.onboarding.job.repository' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Internals\Repository\JobRepository::class,
			],
			'socialnetwork.onboarding.job.cache' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Internals\Repository\Cache\JobCache::class,
			],
			'socialnetwork.onboarding.batch.job.executor' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Execution\Executor\BatchJobExecutor::class,
			],
			'socialnetwork.onboarding.queue.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Service\QueueService::class,
			],
			'socialnetwork.onboarding.queue.provider' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Provider\QueueProvider::class,
			],
			'socialnetwork.onboarding.promotion.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Onboarding\Integration\Im\Promotion\PromotionService::class,
			],
			'socialnetwork.collab.converter.service' => [
				'className' => \Bitrix\Socialnetwork\Collab\Converter\ConverterService::class,
			],
		],
	],
];
