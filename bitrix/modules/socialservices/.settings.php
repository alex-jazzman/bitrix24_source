<?php
return [
	'controllers' => [
		'value' => [
			'defaultNamespace' => '\\Bitrix\\SocialServices\\Controller',
		],
		'readonly' => true,
	],
	'services' => [
		'value' => [
			'socialservices.oauth.loggerfactory' => [
				'className' => \Bitrix\Socialservices\OAuth\LoggerFactory::class,
			],
		],
		'readonly' => true,
	],
];
