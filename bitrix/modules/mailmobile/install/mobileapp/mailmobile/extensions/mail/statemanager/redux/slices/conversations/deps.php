<?php

return [
	'extensions' => [
		'statemanager/redux/reducer-registry',
		'statemanager/redux/toolkit',
		'mail:statemanager/redux/slices/conversations/meta',
	],
	'bundle' => [
		'./src/state',
	],
];
