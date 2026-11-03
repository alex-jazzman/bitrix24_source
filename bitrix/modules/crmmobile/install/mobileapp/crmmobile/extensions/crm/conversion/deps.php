<?php

return [
	'extensions' => [
		'analytics',
		'loc',
		'in-app-url',
		'utils/array',
		'utils/random',
		'utils/object',
		'in-app-url/url',
		'event-emitter',
		'debug/prism',
		'notify-manager',
		'toast',
		'layout/ui/context-menu',
		'layout/ui/wizard/backdrop',

		'crm:loc',
		'crm:type',
		'crm:entity-actions',
		'crm:entity-detail/opener',
		'crm:conversion/utils',
		'crm:conversion/wizard',
		'crm:conversion/menu',
		'crm:selector/entity/element',
		'crm:crm-mode',
	],
	'bundle' => [
		'./client-creation',
		'./menu',
	],
];
