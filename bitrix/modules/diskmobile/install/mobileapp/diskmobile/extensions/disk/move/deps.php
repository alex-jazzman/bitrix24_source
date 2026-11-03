<?php

return [
	'extensions' => [
		'loc',
		'selector/widget/entity/tree-selectors/directory-selector',

		'statemanager/redux/store',
		'disk:statemanager/redux/slices/files/selector',
		'disk:statemanager/redux/slices/files/thunk',
		'disk:statemanager/redux/slices/files',
		'disk:statemanager/redux/slices/storages',

		'toast',
		'type',
		'require-lazy',
		'disk:opener/folder',
		'disk:rights',
		'disk:storage/personal',
	],
];