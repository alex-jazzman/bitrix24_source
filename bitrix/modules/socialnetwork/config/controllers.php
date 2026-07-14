<?php

return [
	'value' => [
		'defaultNamespace' => '\\Bitrix\\Socialnetwork\\Controller',
		'namespaces' => [
			'\\Bitrix\\Socialnetwork\\Controller' => 'api',
			'\\Bitrix\\Socialnetwork\\Collab\\Controller' => 'collab',
			'\\Bitrix\\Socialnetwork\\V2\\Infrastructure\\Controller' => 'v2',
		],
		'restIntegration' => [
			'enabled' => true,
		],
	],
	'readonly' => true,
];
