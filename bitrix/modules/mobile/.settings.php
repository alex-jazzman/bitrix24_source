<?php

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Mobile\\Controller',
			'restIntegration' => [
				'enabled' => true,
			],
		],
		'readonly' => true,
	],
	'feature-flags' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\Mobile\\Public\\Features',
			\Bitrix\Mobile\Feature\SupportFeature::class,
			\Bitrix\Mobile\Feature\WhatsNewFeature::class,
			\Bitrix\Mobile\Feature\OnboardingFeature::class,
			\Bitrix\Mobile\Feature\MenuFeature::class,
			\Bitrix\Mobile\Feature\MobileMarketFeature::class,
			\Bitrix\Mobile\Feature\SettingsV2Feature::class,
			\Bitrix\Mobile\Feature\SecuritySettingsFeature::class,
			\Bitrix\Mobile\Feature\AhaMomentFeature::class,
			\Bitrix\Mobile\Feature\MobileQualificationPortalDefaultPresetFeature::class,
			\Bitrix\Mobile\Feature\ImplementationSpecialistsFeature::class,
			\Bitrix\Mobile\Feature\PersonalAccountFeature::class,
			\Bitrix\Mobile\Feature\IntegratorFeature::class,
			\Bitrix\Mobile\Feature\PurchasesFeature::class,
			\Bitrix\Mobile\Feature\TariffMenuFeature::class,
			\Bitrix\Mobile\Feature\TariffMenuPurchaseCtaFeature::class,
			\Bitrix\Mobile\Feature\TariffMenuPurchaseCtaForceFeature::class,
			\Bitrix\Mobile\Feature\TariffMenuDemoModeFeature::class,
			\Bitrix\Mobile\Feature\UsersFloatingBannerFeature::class,
			\Bitrix\Mobile\Feature\BitrixAnswersFeature::class,
			\Bitrix\Mobile\Feature\BitrixAnswersSandboxFeature::class,
			\Bitrix\Mobile\Feature\MyCompanyFeature::class,
			\Bitrix\Mobile\Feature\QrLoginFeature::class,
		],
		'readonly' => true,
	],
	'messenger' => [
		'value' => [
			'queues' => [
				'mobile.menu_cache_invalidation' => [
					'handler' => \Bitrix\Mobile\Tab\Preset\Integration\Messenger\MenuCacheInvalidationReceiver::class,
					'limit' => 1,
					'total_processing_limit' => 1,
					'retry_strategy' => [
						'max_retries' => 3,
						'delay' => 5,
						'multiplier' => 2,
						'max_delay' => 60,
					],
				],
			],
		],
		'readonly' => true,
	],
];
