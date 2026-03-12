<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Services\CopilotNameService;
use Bitrix\Main\Loader;

$copilotName = '';

if (Loader::includeModule('ai'))
{
	$copilotName = (new CopilotNameService())->getCopilotName();
}

return [
	'css' => 'dist/collection-item-ai.bundle.css',
	'js' => 'dist/collection-item-ai.bundle.js',
	'rel' => [
		'ui.design-tokens',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	]
];