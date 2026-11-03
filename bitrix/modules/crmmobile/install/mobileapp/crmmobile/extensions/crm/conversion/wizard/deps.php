<?php

return [
	'extensions' => [
		'loc',
		'utils/object',
		'notify-manager',

		'crm:type',
		'crm:state-storage',
		'crm:entity-actions',
		'crm:selector/entity/element',
		'crm:conversion/utils',
		'crm:conversion/wizard/steps',
	],
	'bundle' => [
		'./src/selector-events',
		'./selector',
	],
];
