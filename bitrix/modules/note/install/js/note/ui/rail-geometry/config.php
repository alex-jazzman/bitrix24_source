<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// [ALG-02] Geometry of the right rail: a pure function and the widths it borrows from the document
// and from the rail's other residents. A leaf extension of its own because BOTH sides need it — the
// lazily loaded chat panel and the shell, which has to reserve the rail in flow from the first frame
// of opening, i.e. long before that panel exists. Keeping it here is what stops the constants from
// being copied into note.app.

return [
	'js' => './dist/rail-geometry.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
