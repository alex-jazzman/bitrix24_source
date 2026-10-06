<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->register('landing', 'onAfterDemoCreate', '\Bitrix\SalesCenter\Integration\LandingManager', 'onAfterDemoCreate')
	->register('landing', '\Bitrix\Landing\Internals\Landing::OnAfterDelete', '\Bitrix\SalesCenter\Integration\LandingManager', 'onDeleteLanding')
	->register('landing', 'onBuildTemplatePreviewUrl', '\Bitrix\SalesCenter\Integration\LandingManager', 'onBuildTemplatePreviewUrl')
	->register('landing', 'onHookExec', '\Bitrix\SalesCenter\Integration\LandingManager', 'onHookExec')
	->register('landing', 'onLandingPublication', '\Bitrix\SalesCenter\Integration\LandingManager', 'onLandingPublication')
	->register('landing', 'onLandingAfterUnPublication', '\Bitrix\SalesCenter\Integration\LandingManager', 'onLandingAfterUnPublication')
	->register('landing', 'onBeforeSiteRecycle', '\Bitrix\SalesCenter\Integration\LandingManager', 'onBeforeSiteRecycle')
	->register('landing', 'onBeforeLandingRecycle', '\Bitrix\SalesCenter\Integration\LandingManager', 'onBeforeLandingRecycle')
	->register('landing', 'onLandingStartPublication', '\Bitrix\SalesCenter\Integration\LandingManager', 'onLandingStartPublication')
	->register('sale', 'OnSaleOrderSaved', '\Bitrix\SalesCenter\Integration\SaleManager', 'OnSaleOrderSaved')
	->register('sale', 'OnSalePsServiceProcessRequestBeforePaid', '\Bitrix\SalesCenter\Integration\SaleManager', 'onSalePsServiceProcessRequestBeforePaid')
	->register('sale', 'OnPrintableCheckSend', '\Bitrix\SalesCenter\Integration\SaleManager', 'OnPrintableCheckSend')
	->register('sale', 'OnCheckPrintError', '\Bitrix\SalesCenter\Integration\SaleManager', 'OnCheckPrintError')
	->register('pull', 'OnGetDependentModule', '\Bitrix\SalesCenter\Driver', 'onGetDependentModule', 1000)
	->register('sale', 'OnPaymentPaid', '\Bitrix\SalesCenter\Integration\SaleManager', 'onPaymentPaid')
	->register('messageservice', 'OnMessageSuccessfullySent', '\Bitrix\SalesCenter\Integration\CrmManager', 'onSendPaymentBySms', 50)
	->register('notifications', 'onMessageSuccessfullyEnqueued', '\Bitrix\SalesCenter\Integration\CrmManager', 'onSendPaymentByControlCenter', 200)
	->register('messageservice', 'OnMessageSuccessfullySent', '\Bitrix\SalesCenter\Integration\CrmManager', 'onSendCompilation', 200)
	->register('sale', 'OnSaleAfterPsServiceProcessRequest', '\Bitrix\SalesCenter\Integration\SaleManager', 'onPaySystemServiceProcessRequest')
;
