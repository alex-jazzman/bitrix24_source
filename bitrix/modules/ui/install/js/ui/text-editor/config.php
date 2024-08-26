<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$smileys = [];
$gallery = \CSmile::getByGalleryId(\CSmile::TYPE_SMILE);
foreach ($gallery as $smile)
{
	$typings = explode(' ', $smile['TYPING']);
	foreach ($typings as $typing)
	{
		$smileys[] = [
			'name' => $smile['NAME'],
			'image' => \CSmile::PATH_TO_SMILE . $smile['SET_ID'] . '/' . $smile['IMAGE'],
			'typing' => $typing,
			'width' => (int)$smile['IMAGE_WIDTH'],
			'height' => (int)$smile['IMAGE_HEIGHT'],
		];
	}
}

return [
	'css' => 'dist/text-editor.bundle.css',
	'js' => 'dist/text-editor.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.bbcode.parser',
		'ui.bbcode.model',
		'ui.icon-set.main',
		'ui.icon-set.editor',
		'ui.icon-set.actions',
		'ui.design-tokens',
		'ui.forms',
		'ui.lexical',
	],
	'settings' => [
		'smileys' => $smileys,
	],
	'skip_core' => false,
];
