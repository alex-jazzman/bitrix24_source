<?php

use Bitrix\Booking\Internals\Integration\Ui\EntitySelector;

return [
	'controllers' => [
		'value' => [
			'namespaces' => [
				'\\Bitrix\\Booking\\Controller' => 'api',
				'\\Bitrix\\Booking\\Controller\\V1' => 'api_v1',
				'\\Bitrix\\Booking\\Rest\\V1\\Controller' => 'v1',
			],
			'defaultNamespace' => '\\Bitrix\\Booking\\Controller',
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
					'entityId' => 'resource',
					'provider' => [
						'moduleId' => 'booking',
						'className' => EntitySelector\ResourceProvider::class,
					],
				],
				[
					'entityId' => 'resource-type', // todo wtf EntitySelector\EntityId
					'provider' => [
						'moduleId' => 'booking',
						'className' => EntitySelector\ResourceTypeProvider::class,
					],
				],
			],
		],
	],
	'services' => [
		'value' => [
			'booking.container' => [
				'className' => \Bitrix\Booking\Internals\Container::class,
			],
			'booking.transaction.handler' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\TransactionHandler::class,
			],
			'booking.resource.type.access.controller' => [
				'className' => \Bitrix\Booking\Access\ResourceTypeAccessController::class,
				'constructorParams' => static function() {
					return [
						'userId' => 0,
					];
				},
			],
			'booking.resource.access.controller' => [
				'className' => \Bitrix\Booking\Access\ResourceAccessController::class,
				'constructorParams' => static function() {
					return [
						'userId' => 0,
					];
				},
			],
			'booking.booking.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingRepository::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getBookingRepositoryMapper(),
					];
				},
			],
			'booking.booking.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\BookingMapper::class,
				'constructorParams' => static function() {
					return [
						'resourceMapper' => \Bitrix\Booking\Internals\Container::getResourceRepositoryMapper(),
						'clientMapper' => \Bitrix\Booking\Internals\Container::getClientRepositoryMapper(),
						'externalDataItemMapper' => \Bitrix\Booking\Internals\Container::getExternalDataItemRepositoryMapper(),
					];
				},
			],
			'booking.client.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingClientRepository::class,
			],
			'booking.external.data.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingExternalDataRepository::class,
			],
			'booking.resource.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ResourceMapper::class,
			],
			'booking.resource.data.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ResourceDataMapper::class,
			],
			'booking.resource.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceRepository::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getResourceRepositoryMapper(),
						\Bitrix\Booking\Internals\Container::getResourceDataRepositoryMapper(),
					];
				},
			],
			'booking.resource.type.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceTypeRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => \Bitrix\Booking\Internals\Container::getResourceTypeRepositoryMapper(),
					];
				},
			],
			'booking.advertising.type.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\AdvertisingResourceTypeRepository::class,
			],
			'booking.journal.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\JournalRepository::class,
			],
			'booking.journal.service' => [
				'className' => \Bitrix\Booking\Internals\Service\Journal\JournalService::class,
			],
			'booking.resource.slot.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceSlotRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => new \Bitrix\Booking\Internals\Repository\ORM\Mapper\ResourceSlotMapper(),
					];
				},
			],
			'booking.booking.resource.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingResourceRepository::class,
			],
			'booking.resource.repository.type.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ResourceTypeMapper::class,
			],
			'booking.client.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ClientMapper::class,
			],
			'booking.external.data.item.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ExternalDataItemMapper::class,
			],
			'booking.favorites.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\FavoritesRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => new \Bitrix\Booking\Internals\Repository\ORM\Mapper\FavoritesMapper(),
					];
				},
			],
			'booking.counter.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\CounterRepository::class,
			],
			'booking.provider.manager' => [
				'className' => \Bitrix\Booking\Internals\Service\ProviderManager::class,
			],
			'booking.option.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\OptionRepository::class,
			],
			'booking.message.sender' => [
				'className' => \Bitrix\Booking\Internals\Service\Notifications\MessageSender::class,
			],
			'booking.wait.list.item.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\WaitListItemMapper::class,
				'constructorParams' => static function() {
					return [
						'clientMapper' => \Bitrix\Booking\Internals\Container::getClientRepositoryMapper(),
						'externalDataItemMapper' => \Bitrix\Booking\Internals\Container::getExternalDataItemRepositoryMapper(),
					];
				},
			],
			'booking.wait.list.item.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\WaitListItemRepository::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getWaitListItemRepositoryMapper(),
					];
				},
			],
			'booking.overbooking.overlap.policy' => [
				'className' => \Bitrix\Booking\Internals\Service\Overbooking\OverlapPolicy::class,
			],
			'booking.client.type.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ClientTypeRepository::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getClientTypeRepositoryMapper(),
					];
				},
			],
			'booking.client.type.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\ClientTypeMapper::class,
			],
			'booking.internals.booking.service' => [
				'className' => \Bitrix\Booking\Internals\Service\BookingService::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'resourceService' => \Bitrix\Booking\Internals\Container::getResourceService(),
						'clientService' => \Bitrix\Booking\Internals\Container::getClientService(),
						'externalDataService' => \Bitrix\Booking\Internals\Container::getExternalDataService(),
						'overbookingOverlapPolicy' => \Bitrix\Booking\Internals\Container::getOverBookingOverlapPolicy(),
					];
				},
			],
			'booking.internals.client.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ClientService::class,
				'constructorParams' => static function() {
					return [
						'bookingClientRepository' => \Bitrix\Booking\Internals\Container::getBookingClientRepository(),
					];
				},
			],
			'booking.internals.external.data.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ExternalDataService::class,
				'constructorParams' => static function() {
					return [
						'bookingClientRepository' => \Bitrix\Booking\Internals\Container::getBookingClientRepository(),
						'bookingExternalDataRepository' => \Bitrix\Booking\Internals\Container::getBookingExternalDataRepository(),
						'clientService' => \Bitrix\Booking\Internals\Container::getClientService(),
					];
				},
			],
			'booking.internals.resource.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ResourceService::class,
				'constructorParams' => static function() {
					return [
						'bookingResourceRepository' => \Bitrix\Booking\Internals\Container::getBookingResourceRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'resourceTypeRepository' => \Bitrix\Booking\Internals\Container::getResourceTypeRepository(),
						'resourceLinkedEntityRepository' => \Bitrix\Booking\Internals\Container::getResourceLinkedEntityRepository(),
					];
				},
			],
			'booking.internals.wait.list.item.service' => [
				'className' => \Bitrix\Booking\Internals\Service\WaitListItemService::class,
				'constructorParams' => static function() {
					return [
						'waitListItemRepository' => \Bitrix\Booking\Internals\Container::getWaitListItemRepository(),
						'clientService' => \Bitrix\Booking\Internals\Container::getClientService(),
						'externalDataService' => \Bitrix\Booking\Internals\Container::getExternalDataService(),
					];
				},
			],
			'booking.message.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingMessageRepository::class,
			],
			'booking.internals.overbooking.service' => [
				'className' => \Bitrix\Booking\Internals\Service\Overbooking\OverbookingService::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
					];
				},
			],
			'booking.internals.event_for_booking.service' => [
				'className' => \Bitrix\Booking\Internals\Service\EventForBookingService::class,
				'constructorParams' => static function() {
					return [
						'externalDataRepository' => \Bitrix\Booking\Internals\Container::getBookingExternalDataRepository(),
					];
				},
			],
			'booking.internals.delayed_task.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\DelayedTaskRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => new \Bitrix\Booking\Internals\Repository\ORM\Mapper\DelayedTaskMapper(),
					];
				},
			],
			'booking.internals.resource_linked_entity.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceLinkedEntityRepository::class,
			],
		],
	],
];
