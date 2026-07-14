<?php

return [
	'extensions' => [
		'require-lazy',
		'loc',
		'tokens',
		'layout/ui/info-helper',
		'settings/disabled-tools',
		'calendar:enums',
		'calendar:data-managers/settings-manager',
	],
	'components' => [
		'calendar:calendar.event.list',
		'calendar:calendar.event-view-form',
		'calendar:calendar.event-edit-form',
	],
];
