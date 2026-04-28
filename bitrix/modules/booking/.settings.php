<?php

use Bitrix\Booking\Internals\Integration\Ui\EntitySelector;
use Bitrix\Booking\Provider\TimeProvider;

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
						\Bitrix\Booking\Internals\Container::getBookingSkuService(),
					];
				},
			],
			'booking.booking.repository.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\BookingMapper::class,
				'constructorParams' => static function() {
					return [
						'resourceMapper' => \Bitrix\Booking\Internals\Container::getResourceRepositoryMapper(),
						'clientMapper' => \Bitrix\Booking\Internals\Container::getClientRepositoryMapper(),
						'skuMapper' => \Bitrix\Booking\Internals\Container::getBookingSkuMapper(),
						'externalDataItemMapper' => \Bitrix\Booking\Internals\Container::getExternalDataItemRepositoryMapper(),
					];
				},
			],
			'booking.client.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingClientRepository::class,
			],
			'booking.sku.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingSkuRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => \Bitrix\Booking\Internals\Container::getBookingSkuMapper(),
					];
				},
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
						\Bitrix\Booking\Internals\Container::getResourceSkuService(),
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
			'booking.sku.mapper' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\Mapper\BookingSkuMapper::class,
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
			'booking.option.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\OptionRepository::class,
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
						'skuService' => \Bitrix\Booking\Internals\Container::getBookingSkuService(),
						'externalDataService' => \Bitrix\Booking\Internals\Container::getExternalDataService(),
						'overbookingOverlapPolicy' => \Bitrix\Booking\Internals\Container::getOverBookingOverlapPolicy(),
						'dealForBookingService' => \Bitrix\Booking\Internals\Container::getDealForBookingService(),
					];
				},
			],
			'booking.internals.client.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ClientService::class,
				'constructorParams' => static function() {
					return [
						'bookingClientRepository' => \Bitrix\Booking\Internals\Container::getBookingClientRepository(),
						'dealClientSynchronizer' => \Bitrix\Booking\Internals\Container::getCrmDealClientSynchronizer(),
						'crmClientDataLoader' => \Bitrix\Booking\Internals\Container::getCrmClientDataLoader(),
						'clientAccessProvider' => \Bitrix\Booking\Internals\Container::getCrmClientAccessProvider(),
					];
				},
			],
			'booking.internals.sku.service' => [
				'className' => \Bitrix\Booking\Internals\Service\BookingSkuService::class,
				'constructorParams' => static function() {
					return [
						'skuRepository' => \Bitrix\Booking\Internals\Container::getBookingSkuRepository(),
						'skuDataLoader' => \Bitrix\Booking\Internals\Container::getSkuDataLoader(),
						'productRowDataLoader' => \Bitrix\Booking\Internals\Container::getProductRowDataLoader(),
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
						'dealClientSynchronizer' => \Bitrix\Booking\Internals\Container::getCrmDealClientSynchronizer(),
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
			'booking.internals.resource.avatar.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ResourceAvatarService::class,
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
			'booking.internals.delayed_task.service' => [
				'className' => \Bitrix\Booking\Internals\Service\DelayedTask\DelayedTaskService::class,
				'constructorParams' => static function() {
					return [
						'delayedTaskRepository' => \Bitrix\Booking\Internals\Container::getDelayedTaskRepository(),
					];
				},
			],
			'booking.internals.resource_linked_entity.repository' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceLinkedEntityRepository::class,
			],
			'booking.internals.service.yandex.resource.provider' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\ResourceProvider::class,
				'constructorParams' => static function() {
					return [
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				},
			],
			'booking.internals.service.yandex.service.provider' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\ServiceProvider::class,
				'constructorParams' => static function() {
					return [
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				},
			],
			'booking.internals.service.yandex.available.time.slots.provider' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\AvailableTimeSlotsProvider::class,
				'constructorParams' => static function() {
					return [
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
						'timeProvider' => new TimeProvider(),
					];
				},
			],
			'booking.internals.service.yandex.available.dates.provider' => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\AvailableDatesProvider::class,
				'constructorParams' => static function() {
					return [
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
						'timeProvider' => new TimeProvider(),
					];
				},
			],
			'booking.internals.service.yandex.delete.booking.service' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\DeleteBookingService::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
					];
				},
			],
			'booking.internals.service.yandex.create.booking.service' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\CreateBookingService::class,
				'constructorParams' => static function() {
					return [
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
						'contactSearcherService' => \Bitrix\Booking\Internals\Container::getCrmContactSearcherService(),
						'findResourceService' => \Bitrix\Booking\Internals\Container::getYandexFindResourceService(),
					];
				},
			],
			'booking.internals.service.yandex.update.booking.service' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\UpdateBookingService::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'findResourceService' => \Bitrix\Booking\Internals\Container::getYandexFindResourceService(),
					];
				},
			],
			'booking.internals.service.yandex.find.resource.service' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\FindResourceService::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\ContactSearcher\ContactSearcherService::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ContactSearcher\ContactSearcherService::class,
			],
			'booking.internals.integration.crm.deal.service' => [
				'className' => Bitrix\Booking\Internals\Integration\Crm\DealService::class,
				'constructorParams' => static function() {
					return [
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				},
			],
			'booking.internals.integration.catalog.service.sku.provider' => [
				'className' => \Bitrix\Booking\Internals\Integration\Catalog\ServiceSkuProvider::class,
			],
			'booking.internals.service.yandex.booking.provider' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\BookingProvider::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
					];
				},
			],
			'booking.internals.service.yandex.company.feed.provider' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\CompanyFeedProvider::class,
				'constructorParams' => static function() {
					return [
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
					];
				},
			],
			'booking.internals.service.yandex.company.repository' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\CompanyRepository::class,
			],
			'booking.internals.service.yandex.api.client' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\ApiClient::class,
				'constructorParams' => static function() {
					return [
						'availabilityService' => \Bitrix\Booking\Internals\Container::getYandexAvailabilityService(),
					];
				},
			],
			'booking.internals.service.yandex.account' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\Account::class,
				'constructorParams' => static function() {
					return [
						'apiClient' => \Bitrix\Booking\Internals\Container::getYandexApiClient(),
						'feedHashService' => \Bitrix\Booking\Internals\Container::getYandexCompanyFeedHashService(),
					];
				},
			],
			'booking.internals.service.yandex.company.feed.sender' => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\CompanyFeedSender::class,
				'constructorParams' => static function() {
					return [
						'apiClient' => \Bitrix\Booking\Internals\Container::getYandexApiClient(),
						'feedHashService' => \Bitrix\Booking\Internals\Container::getYandexCompanyFeedHashService(),
					];
				},
			],
			'booking.internals.integration.catalog.sku.data.loader' => [
				'className' => Bitrix\Booking\Internals\Integration\Catalog\SkuDataLoader::class,
				'constructorParams' => static function() {
					return [
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\DealDataProvider::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\DealDataProvider::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\ExternalDataItemExtractor::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ExternalDataItemExtractor::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\ClientDataProvider::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ClientDataProvider::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\DealClientSynchronizer::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\DealClientSynchronizer::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getDealDataProvider(),
						\Bitrix\Booking\Internals\Container::getCrmExternalDataItemExtractor(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\DataLoader\ClientDataLoader::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\DataLoader\ClientDataLoader::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getCrmClientDataProvider(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\ClientAccessProvider::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ClientAccessProvider::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\ClientDataRecentProvider::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ClientDataRecentProvider::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getCrmClientDataProvider(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\ClientTypeRepository::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\ClientTypeRepository::class,
			],
			\Bitrix\Booking\Internals\Service\Notifications\MessageSender\BookingDataExtractor::class => [
				'className' => \Bitrix\Booking\Internals\Service\Notifications\MessageSender\BookingDataExtractor::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\MessageSender::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\MessageSender::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getDealDataProvider(),
						\Bitrix\Booking\Internals\Container::getCrmExternalDataItemExtractor(),
						new \Bitrix\Booking\Provider\NotificationsLanguageProvider(),
						\Bitrix\Booking\Internals\Container::getBookingMessageRepository(),
						\Bitrix\Booking\Internals\Container::getBookingDataExtractor(),
						\Bitrix\Booking\Internals\Container::getLicenseChecker(),
					];
				},
			],
			'booking.internals.integration.crm.deal.data.loader' => [
				'className' => Bitrix\Booking\Internals\Integration\Crm\DataLoader\DealDataLoader::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getDealDataProvider(),
						\Bitrix\Booking\Internals\Container::getCrmExternalDataItemExtractor(),
					];
				},
			],
			'booking.internals.integration.intranet.booking.tool' => [
				'className' => \Bitrix\Booking\Internals\Integration\Intranet\BookingTool::class,
			],
			'booking.internals.repository.resource.sku' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceSkuRepository::class,
				'constructorParams' => static function() {
					return [
						'mapper' => new \Bitrix\Booking\Internals\Repository\ORM\Mapper\ResourceSkuMapper(),
					];
				}
			],
			'booking.internals.repository.resource.sku.yandex' => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceSkuYandexRepository::class,
			],
			'booking.internals.service.yandex.resource.sku.relations.service' => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\ResourceSkuRelationsService::class,
				'constructorParams' => static function() {
					return [
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'resourceSkuRepository' => \Bitrix\Booking\Internals\Container::getResourceSkuRepository(),
						'resourceSkuYandexRepository' => \Bitrix\Booking\Internals\Container::getResourceSkuYandexRepository(),
					];
				},
			],
			'booking.internals.service.resource.sku.service' => [
				'className' => \Bitrix\Booking\Internals\Service\ResourceSkuService::class,
				'constructorParams' => static function() {
					return [
						'resourceSkuRepository' => \Bitrix\Booking\Internals\Container::getResourceSkuRepository(),
						'resourceSkuYandexRepository' => \Bitrix\Booking\Internals\Container::getResourceSkuYandexRepository(),
						'skuDataLoader' => \Bitrix\Booking\Internals\Container::getSkuDataLoader(),
						'skuService' => \Bitrix\Booking\Internals\Container::getSkuService(),
					];
				},
			],
			'booking.internals.service.sku.service' => [
				'className' => \Bitrix\Booking\Internals\Service\SkuService::class,
				'constructorParams' => static function() {
					return [
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				},
			],
			'booking.internals.yandex.service.status' => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\StatusService::class,
				'constructorParams' => static function() {
					return [
						'account' => \Bitrix\Booking\Internals\Container::getYandexAccount(),
					];
				},
			],
			'booking.internals.service.timezone' => [
				'className' => \Bitrix\Booking\Internals\Service\Timezone::class,
			],
			\Bitrix\Booking\Provider\BookingProvider::class => [
				'className' => \Bitrix\Booking\Provider\BookingProvider::class,
			],
			\Bitrix\Booking\Internals\Repository\BookingRepositoryInterface::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingRepository::class,
			],
			\Bitrix\Booking\Internals\Repository\ResourceRepositoryInterface::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceRepository::class,
			],
			\Bitrix\Booking\Internals\Repository\ResourceTypeRepositoryInterface::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\ResourceTypeRepository::class,
			],
			\Bitrix\Booking\Internals\Repository\BookingClientRepositoryInterface::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingClientRepository::class,
			],
			\Bitrix\Booking\Internals\Repository\BookingMessageRepositoryInterface::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingMessageRepository::class,
			],
			\Bitrix\Booking\Internals\Service\Yandex\IntegrationService::class => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\IntegrationService::class,
				'constructorParams' => static function() {
					return [
						'resourceSkuRelationsService' => \Bitrix\Booking\Internals\Container::getYandexResourceSkuRelationsService(),
						'companyRepository' => \Bitrix\Booking\Internals\Container::getYandexCompanyRepository(),
						'account' => \Bitrix\Booking\Internals\Container::getYandexAccount(),
						'companyFeedProvider' => \Bitrix\Booking\Internals\Container::getYandexCompanyFeedProvider(),
						'statusService' => \Bitrix\Booking\Internals\Container::getYandexStatusService(),
						'availabilityService' => \Bitrix\Booking\Internals\Container::getYandexAvailabilityService(),
					];
				},
			],
			\Bitrix\Booking\Internals\Service\Yandex\AvailabilityService::class => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\AvailabilityService::class,
			],
			\Bitrix\Booking\Internals\Service\Timezone::class => [
				'className' => \Bitrix\Booking\Internals\Service\Timezone::class,
			],
			\Bitrix\Booking\Internals\Service\Yandex\CompanyRepository::class => [
				'className' => Bitrix\Booking\Internals\Service\Yandex\CompanyRepository::class,
			],
			\Bitrix\Booking\Internals\Service\Integration\IntegrationManager::class => [
				'className' => \Bitrix\Booking\Internals\Service\Integration\IntegrationManager::class,
			],
			'booking.internals.service.gis.integration.service' => [
				'className' => \Bitrix\Booking\Internals\Service\Gis\IntegrationService::class,
			],
			\Bitrix\Booking\Internals\Service\Yandex\CompanyFeedHashService::class => [
				'className' => \Bitrix\Booking\Internals\Service\Yandex\CompanyFeedHashService::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\DataLoader\ProductRowDataLoader::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\DataLoader\ProductRowDataLoader::class,
			],
			\Bitrix\Booking\Internals\Service\DealForBookingService::class => [
				'className' => \Bitrix\Booking\Internals\Service\DealForBookingService::class,
				'constructorParams' => static function()
				{
					return [
						'dealService' => \Bitrix\Booking\Internals\Container::getCrmDealService(),
						'bookingSkuRepository' => \Bitrix\Booking\Internals\Container::getBookingSkuRepository(),
						'bookingExternalDataRepository' => \Bitrix\Booking\Internals\Container::getBookingExternalDataRepository(),
					];
				}
			],
			\Bitrix\Booking\Internals\Repository\ORM\BookingPaymentRepository::class => [
				'className' => \Bitrix\Booking\Internals\Repository\ORM\BookingPaymentRepository::class,
			],
			\Bitrix\Booking\Internals\Service\Notifications\WhatsAppEmergencyService::class => [
				'className' => \Bitrix\Booking\Internals\Service\Notifications\WhatsAppEmergencyService::class,
				'constructorParams' => static function()
				{
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'optionRepository' => \Bitrix\Booking\Internals\Container::getOptionRepository(),
					];
				}
			],
			\Bitrix\Booking\Internals\Service\CrmForm\CrmFormService::class => [
				'className' => \Bitrix\Booking\Internals\Service\CrmForm\CrmFormService::class,
				'constructorParams' => static function()
				{
					return [
						'resourceRepository' => \Bitrix\Booking\Internals\Container::getResourceRepository(),
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
						'resourceAutoSelectionService' => \Bitrix\Booking\Internals\Container::getCrmFormResourceAutoSelectionService(),
						'serviceSkuProvider' => \Bitrix\Booking\Internals\Container::getCatalogServiceSkuProvider(),
					];
				}
			],
			\Bitrix\Booking\Internals\Service\CrmForm\ResourceAutoSelectionService::class => [
				'className' => \Bitrix\Booking\Internals\Service\CrmForm\ResourceAutoSelectionService::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\WebForm\BookingBuilder::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\WebForm\BookingBuilder::class,
			],
			\Bitrix\Booking\Internals\Integration\Crm\WebForm\EventHandler::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\WebForm\EventHandler::class,
				'constructorParams' => static function() {
					return [
						'builder' => \Bitrix\Booking\Internals\Container::getWebFormBookingBuilder(),
					];
				},
			],
			\Bitrix\Booking\Internals\Integration\Crm\MyCompanyProvider::class => [
				'className' => \Bitrix\Booking\Internals\Integration\Crm\MyCompanyProvider::class,
			],
			\Bitrix\Booking\Internals\Service\LicenseChecker::class => [
				'className' => \Bitrix\Booking\Internals\Service\LicenseChecker::class,
			],
			\Bitrix\Booking\Internals\Service\Notifications\MessageSender\MessageSenderPicker::class => [
				'className' => \Bitrix\Booking\Internals\Service\Notifications\MessageSender\MessageSenderPicker::class,
				'constructorParams' => static function() {
					return [
						'bookingRepository' => \Bitrix\Booking\Internals\Container::getBookingRepository(),
					];
				},
			],
			\Bitrix\Booking\Internals\Service\Notifications\MessageSender\DummyBaseMessageSender::class => [
				'className' => \Bitrix\Booking\Internals\Service\Notifications\MessageSender\DummyBaseMessageSender::class,
				'constructorParams' => static function() {
					return [
						\Bitrix\Booking\Internals\Container::getBookingMessageRepository(),
						\Bitrix\Booking\Internals\Container::getBookingDataExtractor(),
					];
				},
			],
		],
	],
];
