<?php

return [
	'extensions' => [
		'reload/listeners', // reload vars after reload script
		'im:chat/uploader', // chat uploader
		'im:chat/background', // chat background processes (message, reaction, read, .etc)
		'project/background', // project background processes (view, .etc)
		'disk/background', // task background processes (view, .etc)
		'rest',
		'livefeed',
		'livefeed/publicationqueue',
		'comments/uploadqueue',
		'catalog:background/barcodescanner',
		'push/listener',

		'tasks:background/cache-warmup', // warmup dashboard components and cache for faster render
		'tasks:task', // task background processes (view, .etc)
		'tasks:task/checklist/uploader', // task checklist uploader
		'tasks:task/uploader', // task uploader
		'tasks:task/background', // task background processes (view, .etc)

		'crm:in-app-url/background',
		"sign:background",
		'crm:background/timeline-notifications',

		'files/background-manager', // files background processes (upload, .etc)
		'ava-menu',
	],
];
