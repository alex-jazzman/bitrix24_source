<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Static assets only: bundled images shared by PHP (SystemUser),
// CSS (editor callout) and Vue components (document-list-item).
// No JS/CSS bundle is built; the extension is a stable container
// for absolute asset URLs under /bitrix/js/note/ui/assets/images/.

return [
	'rel' => [],
	'skip_core' => true,
];
