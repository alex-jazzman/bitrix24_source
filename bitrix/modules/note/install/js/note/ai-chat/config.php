<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Lazily loaded by the note.app shell on the first intent to open the panel, so it is absent from
// the shell's own `rel` on purpose. The intranet wrapper is loaded at runtime for the same reason
// and must never appear here — nothing from im, aiassistant or intranet belongs in this list.
// Everything below already sits in note.app's rel, so the lazy load adds no weight of its own.

return [
	'js' => './dist/ai-chat.bundle.js',
	'css' => './dist/ai-chat.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'note.sidebar',
		'note.ui.rail-geometry',
		'note.ui.theme-context',
		'ui.notification',
	],
	'skip_core' => false,
];
