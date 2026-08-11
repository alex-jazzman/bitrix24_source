<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 */

use Bitrix\BIConnector\Internal\Integration\AiAssistant\BitrixGptChat;
use Bitrix\Main;

Main\Loader::includeModule('intranet');

Main\UI\Extension::load([
	'intranet.sidepanel.air',
]);

$bitrixGptIsAvailable = Main\Loader::includeModule('biconnector') && BitrixGptChat::isAvailable();
$bitrixGptLayoutStyle = '';
if ($bitrixGptIsAvailable)
{
	$panelWidth = (int)\CUserOptions::GetOption('intranet', 'right_panel_width', 380);
	if ($panelWidth > 0)
	{
		$bitrixGptLayoutStyle = ' style="--air-right-panel-width: ' . $panelWidth . 'px"';
	}

	Main\UI\Extension::load(['biconnector.bitrixgpt-launcher']);
}

?>
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=<?= SITE_CHARSET ?>"/>
	<?php $APPLICATION->ShowHead(); ?>
	<title><?php $APPLICATION->ShowTitle() ?></title>
</head>
<body class="<?php $APPLICATION->ShowProperty("BodyClass"); ?>">
<?php if ($bitrixGptIsAvailable): ?>
<div class="dashboard-layout"<?= $bitrixGptLayoutStyle ?>>
	<div class="dashboard-layout__main">
<?php endif; ?>
