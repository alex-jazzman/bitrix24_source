<?php

return [
	'extensions' => [
		'reload/listeners', // reload vars after reload script
		'im:chat/uploader', // chat uploader
		'im:chat/background', // chat background processes (message, reaction, read, .etc)
		'project/background', // project background processes (view, .etc)
		'disk:background', // task background processes (view, .etc)
		'push/notifications-register',
		'rest',
		'livefeed',
		'livefeed/publicationqueue',
		'comments/uploadqueue',
		'catalog:background/barcodescanner',
		'push/listener',
		'push/listeners', // @deprecated temporary back-compat bridge: keeps legacy consumers' require('push/listeners') working; remove after they migrate to push/listener
		'module',

		'background/notifications',
		'crm:background/crm-notifications', // @deprecated temporary back-compat bridge: static registration for legacy crmmobile (IIFE form); the lazy push/notifications-register handles the new form; remove after crmmobile migrates

		'tasks:background/cache-warmup', // warmup dashboard components and cache for faster render
		'tasks:task', // task background processes (view, .etc)
		'tasks:task/checklist/uploader', // task checklist uploader
		'tasks:task/uploader', // task uploader
		'tasks:task/background', // task background processes (view, .etc)
		'tasks:background/tasks-notifications',

		'crm:in-app-url/background',
		'im:in-app-url/background',
		'in-app-url/deeplink',
		"sign:background",
		"mail:background",

		'files/background-manager', // files background processes (upload, .etc)
		'ava-menu',

		'intranet:intranet-background',

		'bizproc:background/opener',

		'calendar:background',
		'app-rating-background-client',
		'whats-new/background',
		'timeman/analytics',
		'layout/ui/gratitude-list/subscriptions',
		'onboarding/background',
		'pull-listener',
		'pull-listener/aiassistant-client',

		'timeman:background',
		'stafftrack:check-in-v2/background',

		'bitrix-gpt-onboarding/background',
		'new-projects-promo/background',
	],
];
