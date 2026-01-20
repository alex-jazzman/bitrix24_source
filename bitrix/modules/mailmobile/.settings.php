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
	'ui.uploader' => [
		'value' => [
			'allowUseControllers' => true,
		],
		'readonly' => true,
	],
];
