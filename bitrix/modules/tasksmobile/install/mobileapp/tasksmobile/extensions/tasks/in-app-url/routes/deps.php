<?php

return [
	'extensions' => [
		'feature-flag',
		'require-lazy',
		'tariff-plan-restriction',
	],
	'bundle' => [
		'./src/project-routes',
	],
	'components' => [
		'tasks:tasks.project.list',
		'tasks:tasks.project.list.v2',
		'tasks:tasks.flow.list',
	],
];
