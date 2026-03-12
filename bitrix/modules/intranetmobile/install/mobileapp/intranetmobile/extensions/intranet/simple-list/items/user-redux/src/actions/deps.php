<?php

return [
	'extensions' => [
		'alert',
		'loc',
		'module',
		'require-lazy',
		'rest/run-action-executor',
		'selector/widget/entity/intranet/department',
		'statemanager/redux/store',
		'toast',
		'tokens',
		'intranet:enum',
		'intranet:statemanager/redux/slices/employees/selector',
		'intranet:statemanager/redux/slices/employees/thunk',
	],
	'bundle' => [
		'./src/utils',
	],
];
