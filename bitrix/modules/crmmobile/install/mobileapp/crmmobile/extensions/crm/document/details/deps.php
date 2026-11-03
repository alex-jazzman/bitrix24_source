<?php

return [
	'extensions' => [
		'ui-system/typography/text',
		'alert',
		'animation',
		'animation/components/fade-view',
		'apptheme',
		'layout/ui/context-menu',
		'layout/ui/loaders/bitrix-cloud',
		'loc',
		'utils/color',
		'utils/date',
		'utils/date/formats',
		'utils/url',
		'crm:document/context-menu',
		'crm:document/edit',
		'crm:document/qr-code',
		'crm:document/share-dialog',
		'crm:document/shared-utils',
		'crm:error',
	],
	'bundle' => [
		'./src/download-link',
		'./src/loading-screen',
		'./src/error-panel',
		'./src/bottom-toolbar',
		'./src/pdf-view',
	],
];
