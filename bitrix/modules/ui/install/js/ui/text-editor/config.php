<?

use Bitrix\AI\Services\CopilotNameService;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}


$settings = [];

if (Loader::includeModule('ai') && class_exists(CopilotNameService::class))
{
	$settings['copilot'] = [
		'name' => (new CopilotNameService())->getCopilotName(),
	];
}

return [
	'css' => 'dist/text-editor.bundle.css',
	'js' => 'dist/text-editor.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.bbcode.parser',
		'ui.bbcode.model',
		'ui.smiley',
		'ui.code-parser',
		'ui.video-service',
		'ui.typography',
		'ui.icon-set.outline',
		'ui.icon-set.api.core',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.forms',
		'ui.lexical',
	],
	'settings' => $settings,
	'skip_core' => false,
];
