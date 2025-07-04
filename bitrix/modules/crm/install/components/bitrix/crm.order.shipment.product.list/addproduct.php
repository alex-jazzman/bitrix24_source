<?php

use Bitrix\Crm\Order;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

$siteID = isset($_REQUEST['site'])? mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site']), 0, 2) : '';
if ($siteID !== '')
{
	define('SITE_ID', $siteID);
}

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!Loader::includeModule('crm') || !CCrmSecurityHelper::IsAuthorized() || !check_bitrix_sessid())
{
	die('Module CRM is not installed');
}

global $APPLICATION;
$APPLICATION->RestartBuffer();

if(!isset($_REQUEST['shipmentId']))
{
	die('shipmentId is not defined');
}

$shipment = null;
if ((int)$_REQUEST['shipmentId'] > 0)
{
	$shipment = Order\Manager::getShipmentObject((int)$_REQUEST['shipmentId']);
}
elseif ((int)$_REQUEST['orderId'] > 0)
{
	$order = Order\Order::load((int)$_REQUEST['orderId']);
	$shipments = $order->getShipmentCollection();
	$shipment = $shipments->createItem();
}

if (!$shipment)
{
	die('Can\'t obtain shipment object');
}

Loc::loadMessages(__FILE__);
$APPLICATION->SetTitle(Loc::getMessage("CRM_ORDER_SPL_TITLE"));

$basketIds = (isset($_REQUEST['BID']) && is_array($_REQUEST['BID']) ? $_REQUEST['BID'] : []);

/** @var Order\ShipmentItemCollection $shipmentItemCollection */
$shipmentItemCollection = $shipment->getShipmentItemCollection();
$systemShipment = $shipment->getCollection()->getSystemShipment();

/** @var Order\ShipmentItem $shipmentItem */
foreach ($shipmentItemCollection as $shipmentItem)
{
	if (!in_array($shipmentItem->getBasketId(), $basketIds))
	{
		$basketItem = $shipmentItem->delete();
	}
}

?><!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?=LANGUAGE_ID ?>" lang="<?=LANGUAGE_ID ?>">
<head>
	<script>
		// Prevent loading page without header and footer
		if(window === window.top)
		{
			window.location = "<?=CUtil::JSEscape($APPLICATION->GetCurPageParam('', array('IFRAME'))); ?>";
		}
	</script>
	<?php
	$APPLICATION->ShowHead();
	?>
</head>
<body
	class="crm-iframe-popup crm-detail-page template-<?= SITE_TEMPLATE_ID ?> crm-iframe-popup-no-scroll crm-order-payment-voucher-wrapper <?php $APPLICATION->ShowProperty('BodyClass'); ?>"
	style="padding: 0 15px"
	onload="window.top.BX.onCustomEvent(window.top, 'crmEntityIframeLoad');"
	onunload="window.top.BX.onCustomEvent(window.top, 'crmEntityIframeUnload');"
	>

<div class="crm-iframe-header">
	<div class="pagetitle-wrap">
		<div class="pagetitle-inner-container">
			<div class="pagetitle">
				<span id="pagetitle" class="pagetitle-item"><?php
					$APPLICATION->ShowTitle();
				?></span>
			</div>
		</div>
	</div>
</div>
<div class="crm-iframe-workarea" id="crm-content-outer">
	<div class="crm-iframe-sidebar"><?php
		$APPLICATION->ShowViewContent('sidebar');
	?></div>
	<div class="crm-iframe-content"><?php

$componentData = isset($_REQUEST['PARAMS']) && is_array($_REQUEST['PARAMS']) ? $_REQUEST['PARAMS'] : [];
$componentParams = isset($componentData['params']) && is_array($componentData['params']) ? $componentData['params'] : [];

//Security check
$userPermissions = CCrmPerms::GetCurrentUserPermissions();
$filter =
	isset($componentParams['INTERNAL_FILTER']) && is_array($componentParams['INTERNAL_FILTER'])
		? $componentParams['INTERNAL_FILTER']
		: []
;

//
//For custom reload with params
$ajaxLoaderParams = [
	'url' => $APPLICATION->GetCurPageParam(),
	'method' => 'POST',
	'dataType' => 'ajax',
	'data' => [
		'PARAMS' => $componentData,
	],
];

//Force AJAX mode
$componentParams['AJAX_MODE'] = 'Y';
$componentParams['AJAX_OPTION_JUMP'] = 'N';
$componentParams['AJAX_OPTION_HISTORY'] = 'N';
$componentParams['AJAX_LOADER'] = $ajaxLoaderParams;

//Enable sanitaizing
$componentParams['IS_EXTERNAL_CONTEXT'] = 'Y';
$componentParams['SHIPMENT'] = $systemShipment;

$APPLICATION->IncludeComponent(
	'bitrix:crm.order.shipment.product.list',
	'addproduct',
	$componentParams,
	false,
	[
		'HIDE_ICONS' => 'Y',
		'ACTIVE_COMPONENT' => 'Y',
	]
);

	?></div>
</div>
</body>
</html><?php
require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
