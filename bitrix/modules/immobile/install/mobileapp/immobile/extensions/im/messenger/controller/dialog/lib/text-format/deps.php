<?php

return [
	'extensions' => [
		'type',
		'alert',
		'utils/url',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/config',
		'./src/manager',
		'./src/registry',
		'./src/bb-code/context',
		'./src/bb-code/detector',
		'./src/bb-code/formatter',
		'./src/bb-code/mention-stripper',
		'./src/bb-code/normalizer',
		'./src/bb-code/utils',
		'./src/bb-code/wrapper',
		'./src/action/abstract/base',
		'./src/action/abstract/simple-bbcode',
		'./src/action/bold',
		'./src/action/code',
		'./src/action/italic',
		'./src/action/link',
		'./src/action/strikethrough',
		'./src/action/underline',
		'./src/menu/format',
	],
];
