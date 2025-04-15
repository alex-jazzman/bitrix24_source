<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');
/**
 * @var \CMain $APPLICATION
 */
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Baas;

$APPLICATION->setTitle(Loc::getMessage('BAAS_TITLE'));

if (Main\Loader::includeModule('baas') !== true)
{
	throw new Main\SystemException('Module baas is not installed');
}

$baas = Baas\Baas::getInstance();
$request = Main\Application::getInstance()->getContext()->getRequest();
$packageCode = $request->get('packageCode');
$client = new Baas\Config\Client();
\Bitrix\Main\UI\Extension::load([
	'ui.dialogs.messagebox',
	'ui.notification',
]);

if (!$baas->isAvailable())
{
	ShowError(Loc::getMessage('BAAS_IS_NOT_AVAILABLE'));
}
else
{
	$sTableID = 'b_baas_purchased_packages';
	$lAdmin = new CAdminUiList($sTableID);
	$package = Baas\Service\PackageService::getInstance()->getByCode($packageCode);
	$purchaseInfo = $package->getPurchaseInfo();
	$serviceManager = Baas\Baas::getInstance()->getServiceManager();
	if ($purchaseInfo->getCount() > 0)
	{
		foreach ($purchaseInfo->getPurchases() as $purchase)
		{
			/** @var Baas\Model\Dto\PurchasedPackage $purchasedPackage */
			foreach ($purchase->getPurchasedPackages() as $purchasedPackage)
			{
				$balance = [];
				/** @var Baas\Model\Dto\PurchasedServiceInPackage $purchasedService */
				foreach ($purchasedPackage->getPurchasedServices() as $purchasedService)
				{
					$serviceCode = $serviceManager->getByCode($purchasedService->getServiceCode())?->getTitle() ?? $purchasedService->getServiceCode();
					$balance[] = Loc::getMessage('BAAS_PACKAGE_HEADER_BALANCE_ROW', [
						'#serviceCode#' => $serviceCode,
						'#currentValue#' => $purchasedService->getCurrentValue(),
						'#initialValue#' => $purchasedService->getInitialValue(),
					]);
				}
				$row = $lAdmin->addRow($purchasedPackage->getCode(), [
					'START_DATE' => $purchasedPackage->getStartDate(),
					'EXPIRE_DATE' => $purchasedPackage->getExpirationDate(),
					'BALANCE' => '',
				], '');

				$row->AddViewField(
					'BALANCE',
					implode('<br />', $balance)
				);

				$row->setConfig([
					'editable' => false,
				]);
			}
		}
	}

	$lAdmin->bShowActions = false;
	$lAdmin->addHeaders([
		['id' => 'START_DATE', 'content' => Loc::getMessage('BAAS_PACKAGE_HEADER_START_DATE'), 'default' => false],
		['id' => 'EXPIRE_DATE', 'content' => Loc::getMessage('BAAS_PACKAGE_HEADER_EXPIRE_DATE'), 'default' => true],
		['id' => 'BALANCE', 'content' => Loc::getMessage('BAAS_PACKAGE_HEADER_BALANCE'), 'default' => true],
	]);
	// $lAdmin->AddAdminContextMenu([
	// 	[
	// 		'TEXT' => 'Refresh client',
	// 		'ONCLICK' => 'BX.refreshClient(this);',
	// 		'ICON' => 'btn_new'
	// 	],
	// ], false, false);
	$lAdmin->CheckListMode();
	$lAdmin->DisplayList([
		'SHOW_COUNT_HTML' => false,
		'ACTION_PANEL' => false,
		'USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP' => false,
		'SHOW_TOTAL_COUNTER' => false,
	]);
}


?><script>
	const showNotification = (response) => {
		BX.UI.Notification.Center.notify({
			content: JSON.stringify(response.data),
			category: 'baas',
			autoHideDelay: 5000,
		});
	};

	const showResponse = (title, answer, response) => {
		const {status, body} = response.data.httpResponse;

		BX.UI.Dialogs.MessageBox.show({
			title: title || `Response with a status: ${status}`,
			message: answer || `<p>${body}</p>`,
			modal: true,
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
			maxWidth: 1000
		});
	};

	document
		.querySelector('input[type=button][name="refresh-portal"]')
		.addEventListener('click', async (event) => {
			BX.ajax.runAction('baas.Host.refresh', {data: {}})
				.then((response) => { showNotification(response); })
				.catch((response) => { showResponse(response); });
		})
	;
	const node = document.querySelector('input[type=button][name="show-widget"]');
	const cb = function() {
		BX.loadExt('baas.store').then(function(exports) {
			BX.Baas.Store.Widget.getInstance().bind(node, exports.Analytics.CONTEXT_LICENSE_WIDGET).show();
		});
	};
	BX.bind(node, 'click', cb);
	function openPurchaseUrl(purchaseUrl)
	{
		if (purchaseUrl.indexOf('http') === 0)
		{
			window.open(purchaseUrl);
		}
		else
		{
			BX.SidePanel.Instance.open(
				purchaseUrl,
				{
					width: 1250,
					cacheable: false,
				},
			);
		}
	}
</script><?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
