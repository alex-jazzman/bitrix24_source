<?php

return [
	'extensions' => [
		'alert',
		'loc',
		// BX.ajax appears only for whoever requires rest; the view commits and rolls back uploads with it
		'rest', // @keep
		'type',
		'tokens',
		'bottom-sheet',
		'utils/uuid',
		'utils/file',
		'utils/object',
		'utils/function',
		'uploader/client',
		'ui-system/layout/box',
		'ui-system/form/buttons/button',
		'ui-system/blocks/badges/counter',
		'ui-system/layout/dialog-footer',
		'ui-system/blocks/file/preview',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'layout/ui/loaders/spinner',
		'assets/icons',
		'disk:enum',
		'disk:opener/unified-link/rest',
	],
	'bundle' => [
		'./src/config',
		'./src/view',
		'./src/file-row',
		'./src/progress-bar',
		'./src/preview-overlay',
		'./src/video-preview',
	],
];
