<?php

return [
	'extensions'=> [
		'pull/client/events',
		'call:calls/controller',
		'call:calls/layout',
		'call:calls/logger',
		'call:calls/menu',
		'call:calls/plain',
		'call:calls/plain-jwt',
		'call:calls/users',
		'call:calls/voximplant',
		'call:calls/bitrix',
		'call:calls/bitrix-dev',
		'call:calls/bitrix-jwt',
		'call:calls/settings-manager',
		'call:calls/stuck-call-finish-tracker',
	],
	'bundle' => [
		'./src/is-room-closed-error',
	],
	'components' => []
];