<?php

return [
	'extensions' => [
		'loc',
		'apptheme',
		'assets/icons',
		'tokens',
		'notify-manager',
		'debug/prism',
		'utils/object',
		'mail:compose-context',
		'alert',
		'require-lazy',
		'helpers/component',
		'mail:draft/connector',
		'mail:message/tools/connector',
		'mail:dialog',
	],
	'components' => [
		// the compose screen is opened by name: without it registered, WidgetOpener finds no
		// publicUrl for the component and falls back to a guessed path with a warning
		'mail:mail.message.send', //@keep
	],
];
