<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();
$event = $migration->event();

$event
	->registerCompatible('main', 'OnUserLogout', '\Bitrix\Sale\DiscountCouponsManager', 'logout')
	->register('sale', 'OnSaleBasketItemRefreshData', '\Bitrix\Sale\Compatible\DiscountCompatibility', 'OnSaleBasketItemRefreshData')
	->registerCompatible('main', 'OnUserLogin', 'CSaleUser', 'OnUserLogin')
	->registerCompatible('main', 'OnUserLogout', 'CSaleUser', 'OnUserLogout')
	->registerCompatible('main', 'OnBeforeLangDelete', 'CSalePersonType', 'OnBeforeLangDelete')
	->registerCompatible('main', 'OnLanguageDelete', 'CSaleLocation', 'OnLangDelete')
	->registerCompatible('main', 'OnLanguageDelete', 'CSaleLocationGroup', 'OnLangDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleOrderUserProps', 'OnUserDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleUserAccount', 'OnUserDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleAuxiliary', 'OnUserDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleUser', 'OnUserDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleRecurring', 'OnUserDelete')
	->registerCompatible('main', 'OnUserDelete', 'CSaleUserCards', 'OnUserDelete')
	->registerCompatible('main', 'OnBeforeUserDelete', 'CSaleOrder', 'OnBeforeUserDelete')
	->registerCompatible('main', 'OnBeforeUserDelete', 'CSaleAffiliate', 'OnBeforeUserDelete')
	->registerCompatible('main', 'OnBeforeUserDelete', 'CSaleUserAccount', 'OnBeforeUserDelete')
	->registerCompatible('main', 'OnEventLogGetAuditTypes', 'CSaleYMHandler', 'OnEventLogGetAuditTypes')
	->registerCompatible('main', 'OnEventLogGetAuditTypes', 'CSalePaySystemAction', 'OnEventLogGetAuditTypes')
	->registerCompatible('main', 'OnUserConsentProviderList', '\Bitrix\Sale\UserConsent', 'onProviderList')
	->registerCompatible('main', 'OnUserConsentDataProviderList', '\Bitrix\Sale\UserConsent', 'onDataProviderList')
	->registerCompatible('currency', 'OnBeforeCurrencyDelete', 'CSaleOrder', 'OnBeforeCurrencyDelete')
	->registerCompatible('currency', 'OnBeforeCurrencyDelete', 'CSaleLang', 'OnBeforeCurrencyDelete')
	->registerCompatible('currency', 'OnModuleUnInstall', '', 'CurrencyModuleUnInstallSale')
	->registerCompatible('catalog', 'OnSaleOrderSumm', 'CSaleOrder', '__SaleOrderCount')
	->registerCompatible('mobileapp', 'OnBeforeAdminMobileMenuBuild', 'CSaleMobileOrderUtils', 'buildSaleAdminMobileMenu')
	->registerCompatible('sender', 'OnConnectorList', '\Bitrix\Sale\SenderEventHandler', 'onConnectorListBuyer')
	->registerCompatible('sender', 'OnTriggerList', '\Bitrix\Sale\Sender\EventHandler', 'onTriggerList')
	->registerCompatible('sender', 'OnPresetMailingList', '\Bitrix\Sale\Sender\EventHandler', 'onPresetMailingList')
	->registerCompatible('sender', 'OnPresetTemplateList', '\Bitrix\Sale\Sender\EventHandler', 'onPresetTemplateList')
	->registerCompatible('sender', 'OnConnectorList', 'Bitrix\Sale\Bigdata\TargetSaleMailConnector', 'onConnectorList')
	->registerCompatible('conversion', 'OnGetCounterTypes', '\Bitrix\Sale\Internals\ConversionHandlers', 'onGetCounterTypes')
	->registerCompatible('conversion', 'OnGetRateTypes', '\Bitrix\Sale\Internals\ConversionHandlers', 'onGetRateTypes')
	->registerCompatible('conversion', 'OnGenerateInitialData', '\Bitrix\Sale\Internals\ConversionHandlers', 'onGenerateInitialData')
	->registerCompatible('sale', 'OnBeforeBasketAdd', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBeforeBasketAdd')
	->registerCompatible('sale', 'OnBasketAdd', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBasketAdd')
	->registerCompatible('sale', 'OnBeforeBasketUpdate', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBeforeBasketUpdate')
	->registerCompatible('sale', 'OnBasketUpdate', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBasketUpdate')
	->registerCompatible('sale', 'OnBeforeBasketDelete', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBeforeBasketDelete')
	->registerCompatible('sale', 'OnBasketDelete', '\Bitrix\Sale\Internals\ConversionHandlers', 'onBasketDelete')
	->registerCompatible('sale', 'OnOrderAdd', '\Bitrix\Sale\Internals\ConversionHandlers', 'onOrderAdd')
	->registerCompatible('sale', 'OnSalePayOrder', '\Bitrix\Sale\Internals\ConversionHandlers', 'onSalePayOrder')
	->registerCompatible('sale', 'OnGetBusinessValueGroups', '\Bitrix\Sale\PaySystem\Manager', 'getBusValueGroups')
	->registerCompatible('sale', 'OnGetBusinessValueConsumers', '\Bitrix\Sale\PaySystem\Manager', 'getConsumersList')
	->registerCompatible('sale', 'OnGetBusinessValueGroups', '\Bitrix\Sale\Delivery\Services\Manager', 'onGetBusinessValueGroups')
	->registerCompatible('sale', 'OnGetBusinessValueConsumers', '\Bitrix\Sale\Delivery\Services\Manager', 'onGetBusinessValueConsumers')
	->registerCompatible('perfmon', 'OnGetTableSchema', 'sale', 'OnGetTableSchema')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Sale\PaySystem\RestService', 'onRestServiceBuildDescription')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Sale\Delivery\Rest\Handlers', 'onRestServiceBuildDescription')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Sale\Cashbox\Rest\RestService', 'onRestServiceBuildDescription')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Sale\Rest\RestManager', 'onRestServiceBuildDescription')
	->register('main', 'onNumberGeneratorsClassesCollect', '\Bitrix\Sale\Integration\Numerator\OrderIdNumberGenerator', 'onGeneratorClassesCollect')
	->register('main', 'onNumberGeneratorsClassesCollect', '\Bitrix\Sale\Integration\Numerator\OrderUserOrdersNumberGenerator', 'onGeneratorClassesCollect')
	->register('main', 'onBuildNumeratorTemplateWordsList', '\Bitrix\Sale\Integration\Numerator\AccountNumberCompatibilityManager', 'onBuildNumeratorTemplateWordsList')
	->register('main', '\Bitrix\Main\Numerator\Model\Numerator::OnAfterAdd', '\Bitrix\Sale\Integration\Numerator\AccountNumberCompatibilityManager', 'updateAccountNumberType')
	->register('main', '\Bitrix\Main\Numerator\Model\Numerator::OnAfterUpdate', '\Bitrix\Sale\Integration\Numerator\AccountNumberCompatibilityManager', 'updateAccountNumberType')
	->register('main', '\Bitrix\Main\Numerator\Model\Numerator::OnAfterDelete', '\Bitrix\Sale\Integration\Numerator\AccountNumberCompatibilityManager', 'resetAccountNumberType')
	->register('main', 'OnAfterUserLogin', '\Bitrix\Sale\Update\CrmEntityCreatorStepper', 'OnAfterUserLogin')
	->register('landing', '\Bitrix\Landing\Internals\Site::OnAfterAdd', '\Bitrix\Sale\TradingPlatform\Landing\Landing', 'onLandingSiteAdd')
	->register('landing', '\Bitrix\Landing\Internals\Site::OnAfterUpdate', '\Bitrix\Sale\TradingPlatform\Landing\Landing', 'onLandingSiteUpdate')
	->register('landing', '\Bitrix\Landing\Internals\Site::OnAfterDelete', '\Bitrix\Sale\TradingPlatform\Landing\Landing', 'onLandingSiteDelete')
	->register('landing', 'onBeforeSiteRecycle', '\Bitrix\Sale\TradingPlatform\Landing\Landing', 'onLandingBeforeSiteRecycle')
	->register('report', 'onAnalyticPageCollect', '\Bitrix\Sale\Integration\Report\EventHandler', 'onAnalyticPageCollect')
	->register('report', 'onAnalyticPageBatchCollect', '\Bitrix\Sale\Integration\Report\EventHandler', 'onAnalyticPageBatchCollect')
	->register('documentgenerator', 'onDocumentTransformationComplete', '\Bitrix\Sale\DocumentGenerator\CallbackRegistry', 'onDocumentGenerated')
	->register('rest', 'onRestAppDelete', '\Bitrix\Sale\PaySystem\RestService', 'onRestAppDelete')
	->register('rest', 'onRestAppDelete', '\Bitrix\Sale\Delivery\Rest\BaseService', 'onRestAppDelete')
	->register('rest', 'onRestAppDelete', '\Bitrix\Sale\Cashbox\Rest\RestService', 'onRestAppDelete')
	->register('main', 'OnSiteDelete', '\Bitrix\Sale\Internals\FacebookConversion', 'OnSiteDeleteHandler')
	->register('main', 'OnLangDelete', 'CSaleLang', 'OnLangDelete')
	->register('sale', 'OnPrintableCheckSend', '\Bitrix\Sale\Cashbox\Internals\Analytics\EventHandler', 'onPrintableCheckSend')
	->register('sale', 'OnSaleAfterPsServiceProcessRequest', '\Bitrix\Sale\PaySystem\Internals\Analytics\EventHandler', 'onSaleAfterPsServiceProcessRequest')
	->register('sale', 'OnSaleBasketItemSetField', \Bitrix\Sale\Reservation\Event\Handler\BasketItemUpdateProductReserveHandlers::class, 'OnSaleBasketItemSetField')
	->register('sale', 'OnAfterSaleBasketItemSetField', \Bitrix\Sale\Reservation\Event\Handler\BasketItemUpdateProductReserveHandlers::class, 'OnAfterSaleBasketItemSetField')
	->register('sale', 'onBeforeCashboxAdd', \Bitrix\Sale\Cashbox\EventsHandler\CashboxYooKassa::class, 'onBeforeCashboxAdd')
	->register('main', 'OnEventLogGetAuditTypes', \Bitrix\Sale\EventLogAuditTypeRepository::class, 'getAuditTypes')
	->register('sale', 'OnSaleBasketItemEntitySaved', '\Bitrix\Sale\Internals\Events', 'onSaleBasketItemEntitySaved')
	->register('sale', 'OnSaleBasketItemDeleted', '\Bitrix\Sale\Internals\Events', 'onSaleBasketItemDeleted')
;

$mode = $migration->context()->getDatabaseUpdateMode();

if ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleInstall)
{
	RegisterModuleDependences("main", "OnBeforeProlog", "main", "", "", 100, "/modules/sale/affiliate.php");

	RegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlGroup", "GetControlDescr", 100);
	RegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlBasketGroup", "GetControlDescr", 200);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionGiftCtrlGroup", "GetControlDescr", 200);
	RegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlBasketFields", "GetControlDescr", 300);
	RegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlOrderFields", "GetControlDescr", 1000);
	RegisterModuleDependences("sale", "onBuildDiscountConditionInterfaceControls", "sale", "CSaleCondCtrlPastOrder", "onBuildDiscountConditionInterfaceControls", 1000);
	RegisterModuleDependences("sale", "onBuildDiscountConditionInterfaceControls", "sale", "CSaleCondCumulativeCtrl", "onBuildDiscountConditionInterfaceControls", 1000);
	RegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlCommon", "GetControlDescr", 10000);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlGroup", "GetControlDescr", 100);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlDelivery", "GetControlDescr", 200);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlBasketGroup", "GetControlDescr", 300);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlSubGroup", "GetControlDescr", 1000);
	RegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCondCtrlBasketFields", "GetControlDescr", 1100);
	RegisterModuleDependences("sale", "onBuildDiscountActionInterfaceControls", "sale", "CSaleCumulativeAction", "onBuildDiscountActionInterfaceControls", 1000);

	RegisterModuleDependences("sale", "OnOrderDelete", "sale", "CSaleMobileOrderPull", "onOrderDelete", 100);
	RegisterModuleDependences("sale", "OnOrderAdd", "sale", "CSaleMobileOrderPull", "onOrderAdd", 100);
	RegisterModuleDependences("sale", "OnOrderUpdate", "sale", "CSaleMobileOrderPull", "onOrderUpdate", 100);

	RegisterModuleDependences("sale", "OnBasketOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleOrderAdd", 100);
	RegisterModuleDependences("sale", "OnSaleStatusOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleStatusOrderHandler", 100);
	RegisterModuleDependences("sale", "OnSaleDeliveryOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleDeliveryOrderHandler", 100);
	RegisterModuleDependences("sale", "OnSaleDeductOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleDeductOrderHandler", 100);
	RegisterModuleDependences("sale", "OnSaleCancelOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleCancelOrderHandler", 100);
	RegisterModuleDependences("sale", "OnSalePayOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSalePayOrderHandler", 100);
}
elseif ($mode === \Bitrix\Main\UpdateSystem\Migration\DatabaseUpdateMode::ModuleUninstall)
{
	UnRegisterModuleDependences("main", "OnBeforeProlog", "main", "", "", "/modules/sale/affiliate.php");

	UnRegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlBasketGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionGiftCtrlGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlBasketFields", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlOrderFields", "GetControlDescr");
	UnRegisterModuleDependences("sale", "onBuildDiscountConditionInterfaceControls", "sale", "CSaleCondCtrlPastOrder", "onBuildDiscountConditionInterfaceControls");
	UnRegisterModuleDependences("sale", "onBuildDiscountConditionInterfaceControls", "sale", "CSaleCondCumulativeCtrl", "onBuildDiscountConditionInterfaceControls");
	UnRegisterModuleDependences("sale", "OnCondSaleControlBuildList", "sale", "CSaleCondCtrlCommon", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlDelivery", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlBasketGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCtrlSubGroup", "GetControlDescr");
	UnRegisterModuleDependences("sale", "OnCondSaleActionsControlBuildList", "sale", "CSaleActionCondCtrlBasketFields", "GetControlDescr");
	UnRegisterModuleDependences("sale", "onBuildDiscountActionInterfaceControls", "sale", "CSaleCumulativeAction", "onBuildDiscountActionInterfaceControls");

	UnRegisterModuleDependences("sale", "OnOrderDelete", "sale", "CSaleMobileOrderPull", "onOrderDelete");
	UnRegisterModuleDependences("sale", "OnOrderAdd", "sale", "CSaleMobileOrderPull", "onOrderAdd");
	UnRegisterModuleDependences("sale", "OnOrderUpdate", "sale", "CSaleMobileOrderPull", "onOrderUpdate");

	UnRegisterModuleDependences("sale", "OnBasketOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleOrderAdd");
	UnRegisterModuleDependences("sale", "OnSaleStatusOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleStatusOrderHandler");
	UnRegisterModuleDependences("sale", "OnSaleDeliveryOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleDeliveryOrderHandler");
	UnRegisterModuleDependences("sale", "OnSaleDeductOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleDeductOrderHandler");
	UnRegisterModuleDependences("sale", "OnSaleCancelOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSaleCancelOrderHandler");
	UnRegisterModuleDependences("sale", "OnSalePayOrder", "sale", "\\Bitrix\\Sale\\Product2ProductTable", "onSalePayOrderHandler");
}
