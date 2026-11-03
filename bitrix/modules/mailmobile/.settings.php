<?php

return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\MailMobile\\Infrastructure\\Controller',
			'namespaces' => [
				'\\Bitrix\\MailMobile\\Infrastructure\\Controller' => 'api',
			],
			'restIntegration' => [
				'enabled' => false,
			],
		],
		'readonly' => true,
	],
	'feature-flags' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\MailMobile\\Public\\Features',
			Bitrix\MailMobile\Public\Features\DeviceContactsFeature::class,
			Bitrix\MailMobile\Public\Features\FavoritesFeature::class,
			Bitrix\MailMobile\Public\Features\LargeAttachmentFeature::class,
			Bitrix\MailMobile\Public\Features\MailTemplatesFeature::class,
			Bitrix\MailMobile\Public\Features\SignaturesFeature::class,
			Bitrix\MailMobile\Public\Features\UserLabelsFeature::class,
		],
		'readonly' => true,
	],
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
];
