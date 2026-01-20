<?

use Bitrix\ImOpenLines\V2\Queue\Queue;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$queues = [];

if (\Bitrix\Main\Loader::includeModule('imopenlines') && \Bitrix\Main\Loader::includeModule('im'))
{
	$queues = Queue::getQueues()->toRestFormat();
}

return [
	'css' => 'dist/messenger.bundle.css',
	'js' => 'dist/messenger.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.component.messenger',
	],
	'skip_core' => true,
	'settings' => [
		'queueConfig' => $queues,
	],
];