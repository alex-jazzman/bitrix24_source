<?php

return [
	'extensions' => [
		'device/connection',
		'statemanager/redux/toolkit',
		'statemanager/redux/reducer-registry',
		'mail:statemanager/redux/slices/messages/meta',
		'mail:statemanager/redux/slices/messages/thunk',
		'mail:statemanager/redux/slices/messages/extra-reducer',
		'mail:statemanager/redux/slices/messages/model/message',
		'mail:statemanager/redux/slices/folders/selector',
	],
];