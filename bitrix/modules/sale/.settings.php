<?php
return array(
	'controllers' => array(
		'value' => array(
			'defaultNamespace' => '\\Bitrix\\Sale\\Controller',
			'namespaces' => array(
				'\\Bitrix\\Sale\\Exchange\\Integration\\Controller' => 'integration',
			),
			'restIntegration' => [
				'enabled' => true,
			],
		),
		'readonly' => true,
	),
	'services' => [
		'value' => [
			'sale.basketReservationHistory' => [
				'className' => \Bitrix\Sale\Reservation\BasketReservationHistoryService::class,
			],
			'sale.basketReservation' => [
				'className' => \Bitrix\Sale\Reservation\BasketReservationService::class,
				// TODO: 'autowire' => true,
				'constructorParams' => static function()
				{
					return [
						new \Bitrix\Sale\Reservation\BasketReservationHistoryService(),
					];
				},
			],
			'sale.reservation.settings' => [
				'className' => \Bitrix\Sale\Reservation\Configuration\ReservationSettingsService::class,
			],
			'sale.paysystem.manager' => [
				'className' => \Bitrix\Sale\PaySystem\Manager::class
			],
			'sale.entityLabel' => [
				'className' => \Bitrix\Sale\Label\EntityLabelService::class,
			],
			'sale.basketItemCalculator' => [
				'className' => \Bitrix\Sale\Public\Service\BasketItemCalculator::class,
			],
			'sale.basketCalculator' => [
				'className' => \Bitrix\Sale\Public\Service\BasketCalculator::class,
			],
			'sale.orderCalculator' => [
				'className' => \Bitrix\Sale\Public\Service\OrderCalculator::class,
			],
			'sale.discountCalculator' => [
				'className' => \Bitrix\Sale\Public\Service\DiscountCalculator::class,
			],
			'sale.vatCalculator' => [
				'className' => \Bitrix\Sale\Public\Service\VatCalculator::class,
			],
			'sale.basketItemInputFactory' => [
				'className' => \Bitrix\Sale\Public\Factory\BasketItemInputFactory::class,
			],
		],
	],
	'ui.entity-selector' => [
		'value' => [
			'entities' => [
				[
					'entityId' => 'sale-user',
					'provider' => [
						'moduleId' => 'sale',
						'className' => \Bitrix\Sale\Integration\UI\EntitySelector\SaleUserProvider::class,
					],
				],
			],
		],
	],
);
