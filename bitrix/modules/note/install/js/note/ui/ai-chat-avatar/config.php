<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Drawing rules for the BitrixGPT avatar button and its one-shot intro glow, ported from
// aiassistant.marta. Deliberately a leaf extension with nothing from im/aiassistant/intranet in
// `rel`: aiassistant.marta itself drags in im.public, im.v2.lib.*, main.popup and ui.info-helper.
// Loaded conditionally by the note.editor template, so a disabled flag costs the page nothing.

// No `js` key on purpose: src/index.js only pulls the stylesheet in, so the build emits CSS alone
// and declaring a bundle would put a <script> on a file that does not exist.
return [
	'css' => './dist/ai-chat-avatar.bundle.css',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
