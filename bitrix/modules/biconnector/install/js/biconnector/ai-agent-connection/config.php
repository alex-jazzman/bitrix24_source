<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

use Bitrix\BIConnector\Internal\Integration\AiAssistant\Operation\AgentOperation;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;

// The catalogue is built while this extension is served, and the header of the report asks for the
// extension at the press of the action alone: the page of the report neither builds the catalogue nor
// carries it. The records come from the public provider, in its grouping and in its order.
$agentOperations = [];

if (Loader::includeModule('biconnector'))
{
	$agentOperationsProvider = ServiceLocator::getInstance()->get('biconnector.provider.agentOperations');

	foreach ($agentOperationsProvider->getAllOperations() as $toolSetCode => $toolSetOperations)
	{
		$agentOperations[$toolSetCode] = array_map(
			static fn(AgentOperation $operation): array => [
				'toolSetCode' => $operation->toolSetCode,
				'toolName' => $operation->toolName,
				'impact' => $operation->impact,
				'title' => $operation->title,
				'warning' => $operation->warning,
			],
			$toolSetOperations,
		);
	}
}

return [
    'js' => './dist/ai-agent-connection.bundle.js',
    'css' => './dist/ai-agent-connection.bundle.css',
    'rel' => [
		'biconnector.error-message',
		'main.core',
		'main.date',
		'ui.a11y',
		'ui.buttons',
		'ui.info-helper',
		'ui.system.alert',
		'ui.system.dialog',
		'ui.system.input',
		'ui.system.popover',
		'ui.system.skeleton',
		'ui.system.typography',
	],
    'skip_core' => false,
    'settings' => [
        'operations' => $agentOperations,
    ],
];
