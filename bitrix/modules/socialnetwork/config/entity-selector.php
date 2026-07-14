<?php

use Bitrix\Socialnetwork\Integration\UI\EntitySelector;

return [
	'value' => [
		'entities' => [
			[
				'entityId' => 'user',
				'provider' => [
					'moduleId' => 'socialnetwork',
					'className' => EntitySelector\UserProvider::class,
				],
			],
			[
				'entityId' => 'fired-user',
				'provider' => [
					'moduleId' => 'socialnetwork',
					'className' => EntitySelector\FiredUserProvider::class,
				],
			],
			[
				'entityId' => 'project-user',
				'substitutes' => 'user',
				'provider' => [
					'moduleId' => 'socialnetwork',
					'className' => EntitySelector\ProjectUserProvider::class,
				],
			],
			[
				'entityId' => 'project',
				'provider' => [
					'moduleId' => 'socialnetwork',
					'className' => EntitySelector\ProjectProvider::class,
				],
			],
			[
				'entityId' => 'meta-user',
				'provider' => [
					'moduleId' => 'socialnetwork',
					'className' => EntitySelector\MetaUserProvider::class,
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
];
