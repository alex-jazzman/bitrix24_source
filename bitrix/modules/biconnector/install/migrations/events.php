<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('perfmon', 'OnGetTableSchema', 'biconnector', 'OnGetTableSchema')
	->register(
		'humanresources',
		'OnNodeDeleted',
		\Bitrix\BIConnector\Integration\HumanResources\EventHandler::class,
		'onNodeDeleted',
	)
	->register('report', 'onAnalyticPageBatchCollect', '\Bitrix\BIConnector\Integration\Report\EventHandler', 'onAnalyticPageBatchCollect')
	->register('report', 'onAnalyticPageCollect', '\Bitrix\BIConnector\Integration\Report\EventHandler', 'onAnalyticPageCollect')
	->register(
		'bizproc',
		'SetupTemplateActivitySelectorProvider::onProvideSelectors',
		\Bitrix\BIConnector\Internal\Integration\Bizproc\EventHandler\SetupTemplateActivitySelectorProvider::class,
		'onProvideSelectors',
	)
	->register('rest', 'onRestApplicationConfigurationGetManifest', '\Bitrix\BiConnector\Configuration\Manifest', 'list')
	->register('rest', 'OnRestApplicationConfigurationEntity', '\Bitrix\BiConnector\Configuration\Action', 'getEntityList')
	->register('rest', 'onRestApplicationConfigurationImport', '\Bitrix\BiConnector\Configuration\Action', 'onImport')
	->register('rest', 'OnRestApplicationConfigurationExport', '\Bitrix\BiConnector\Configuration\Action', 'onExport')
	->register('rest', 'OnRestApplicationConfigurationFinish', '\Bitrix\BiConnector\Configuration\Action', 'onFinish')
	->register('rest', 'onBeforeApplicationUninstall', '\Bitrix\BiConnector\Configuration\Action', 'onBeforeRestApplicationDelete')
	->register('biconnector', 'onAfterSupersetStatusChange', '\Bitrix\BIConnector\Superset\MarketAccessManager', 'onAfterSupersetStatusChange')
	->register('biconnector', 'onAfterSupersetStatusChange', '\Bitrix\BIConnector\Integration\Superset\Recovery\StatusRecoveryListener', 'onAfterSupersetStatusChange')
	->register('biconnector', 'OnBIConnectorCreateServiceInstance', '\Bitrix\BIConnector\Services\GoogleDataStudio', 'createServiceInstance')
	->register('biconnector', 'OnBIConnectorCreateServiceInstance', '\Bitrix\BIConnector\Services\MicrosoftPowerBI', 'createServiceInstance')
	->register('biconnector', 'OnBIConnectorCreateServiceInstance', '\Bitrix\BIConnector\Services\YandexDataLens', 'createServiceInstance')
	->register('biconnector', 'OnBIConnectorCreateServiceInstance', '\Bitrix\BIConnector\Services\ApacheSuperset', 'createServiceInstance')
	->register('biconnector', 'OnBIConnectorValidateDashboardUrl', '\Bitrix\BIConnector\Services\GoogleDataStudio', 'validateDashboardUrl')
	->register('biconnector', 'OnBIConnectorValidateDashboardUrl', '\Bitrix\BIConnector\Services\MicrosoftPowerBI', 'validateDashboardUrl')
	->register('biconnector', 'OnBIConnectorValidateDashboardUrl', '\Bitrix\BIConnector\Services\YandexDataLens', 'validateDashboardUrl')

	// Datasources
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Bizproc\Task', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Bizproc\WorkflowState', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Bizproc\WorkflowTemplate', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Catalog\Store', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Catalog\StoreProduct', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Catalog\StoreDocument', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Catalog\StoreDocumentItem', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Activity', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Company', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\CompanyUserField', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Contact', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\ContactUserField', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Deal', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\DealProductRow', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\DealStageHistory', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\DealUserField', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Lead', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\LeadProductRow', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\LeadStatusHistory', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\LeadUserField', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\DynamicItems', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\Product', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\ProductProperty', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Crm\ProductPropertyValue', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\HumanResources\Structure', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\HumanResources\StructureRelation', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Imopenlines\Session', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Main\User', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\Task', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\TaskUserField', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\TaskStages', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\Flow', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\TaskElapsedTime', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Tasks\TaskEfficiency', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Sale\DocumentSaleOrder', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Sale\DocumentSaleOrderItem', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Socialnetwork\Group', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIConnectorDataSources', '\Bitrix\BIConnector\Integration\Voximplant\Call', 'onBIConnectorDataSources')
	->register('biconnector', 'OnBIBuilderDataSources', '\Bitrix\BIConnector\ExternalSource\Dataset\Base', 'onBIBuilderExternalDataSources')
	->register('biconnector', 'OnBIBuilderDataSources', '\Bitrix\BIConnector\Integration\Crm\Tracking\Dataset\SourceExpenses', 'onBIBuilderDataSources')
	->register('biconnector', 'OnBIBuilderDataSources', '\Bitrix\BIConnector\Integration\Crm\Tracking\Dataset\Source', 'onBIBuilderDataSources')

	->register('main', 'OnAfterSetOption_~controller_group_name', '\Bitrix\BIConnector\LimitManager', 'onBitrix24LicenseChange')
	->register('main', 'OnAfterSetOption_~controller_group_name', '\Bitrix\BIConnector\Integration\Superset\SupersetInitializer', 'onBitrix24LicenseChange')
	->register('main', 'OnBeforeUserUpdate', '\Bitrix\BIConnector\DictionaryManager', 'onBeforeUserUpdateHandler')
	->register('main', 'OnAfterUserUpdate', '\Bitrix\BIConnector\DictionaryManager', 'onAfterUserUpdateHandler')
	->register('main', 'OnAfterSetOption_server_name', '\Bitrix\BIConnector\Integration\Superset\SupersetInitializer', 'refreshSupersetDomainConnection')
	->register('main', 'OnAfterSetOption_~bi_constructor_expired_at', [\Bitrix\BIConnector\Superset\Selfhost\License\SelfHostedLicenseSync::class, 'onExpiryDateOptionSet'])
	->register('main', 'OnBeforeUserUpdate', '\Bitrix\BIConnector\Integration\Superset\Events\Main\User', 'onBeforeUserUpdate')
	->register('main', 'OnAfterUserUpdate', '\Bitrix\BIConnector\Integration\Superset\Events\Main\User', 'onAfterUserUpdate')
	->register('main', 'OnAfterUserUpdate', [\Bitrix\BIConnector\Superset\Dashboard\ShareUserEventHandler::class, 'onAfterUserUpdate'])
	->register('main', 'OnBuildGlobalMenu', '\Bitrix\BIConnector\Superset\Scope\MenuItem\MenuItemCreatorShop', 'buildCrmMenu')
	->register('pull', 'onGetDependentModule', '\Bitrix\BIConnector\Integration\Pull\PullManager', 'onGetDependentModule')
	->register('crm', 'onAfterAutomatedSolutionDelete', '\Bitrix\BIConnector\Superset\Scope\ScopeService', 'deleteAutomatedSolutionBinding')
	->register('crm', '\Bitrix\Crm\Model\Dynamic\Type::OnAfterAdd', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterSmartProcessAdd'])
	->register('crm', '\Bitrix\Crm\AutomatedSolution\Entity\AutomatedSolution::OnAfterAdd', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterAutomatedSolutionAdd'])
	->register('biconnector', '\Bitrix\BIConnector\ExternalSource\Internal\ExternalDataset::OnAfterAdd', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterExternalDatasetAdd'])
	->register('crm', '\Bitrix\Crm\Model\Dynamic\Type::OnDelete', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onSmartProcessDelete'])
	->register('crm', '\Bitrix\Crm\Model\Dynamic\Type::OnAfterDelete', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterSmartProcessDelete'])
	->register('crm', '\Bitrix\Crm\AutomatedSolution\Entity\AutomatedSolution::OnAfterDelete', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterAutomatedSolutionDelete'])
	->register('biconnector', '\Bitrix\BIConnector\ExternalSource\Internal\ExternalDataset::OnDelete', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onExternalDatasetDelete'])
	->register('biconnector', '\Bitrix\BIConnector\ExternalSource\Internal\ExternalDataset::OnAfterDelete', [\Bitrix\BIConnector\Access\Event\DynamicTableBindingHandler::class, 'onAfterExternalDatasetDelete'])
	->register('biconnector', 'onAfterAddDataset', '\Bitrix\BIConnector\ExternalSource\SupersetIntegration', 'onAfterAddDataset')
	->register('biconnector', 'onBeforeUpdateDataset', '\Bitrix\BIConnector\ExternalSource\Source\Csv', 'onBeforeUpdateDataset')
	->register('biconnector', 'onAfterUpdateDataset', '\Bitrix\BIConnector\ExternalSource\SupersetIntegration', 'onAfterUpdateDataset')
	->register('biconnector', 'onAfterDeleteDataset', '\Bitrix\BIConnector\ExternalSource\Source\Csv', 'onAfterDeleteDataset')
	->register('biconnector', 'onAfterDeleteDataset', '\Bitrix\BIConnector\ExternalSource\SupersetIntegration', 'onAfterDeleteDataset')
	->register('biconnector', 'onBeforeAddDataset', '\Bitrix\BIConnector\ExternalSource\Source\Csv', 'onBeforeAddDataset')
	->register('biconnector', 'onAfterCopyDashboard', [\Bitrix\BIConnector\Access\Event\DashboardRightsSetter::class, 'onAfterCopyDashboard'])
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\BIConnector\Rest\Connector', 'OnRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\BIConnector\Rest\Source', 'OnRestServiceBuildDescription')
	->register('rest', 'OnRestServiceBuildDescription', '\Bitrix\BIConnector\Rest\Dataset', 'OnRestServiceBuildDescription')

	// Permission cache reset (EVENT-01): everything that can change the permission set of somebody.
	->register('main', 'OnAfterUserUpdate', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onAfterUserUpdate'])
	->register('humanresources', 'OnMemberAdded', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onMemberChanged'])
	->register('humanresources', 'OnMemberUpdated', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onMemberChanged'])
	->register('humanresources', 'OnMemberDeleted', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onMemberChanged'])
	->register('main', 'OnAfterSetUserGroup', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onAfterSetUserGroup'])
	->register('biconnector', 'onAfterAddDataset', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onDatasetChanged'])
	->register('biconnector', 'onAfterUpdateDataset', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onDatasetChanged'])
	->register('biconnector', 'onAfterDeleteDataset', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onDatasetChanged'])
	// The tariff half of the axis: the flag calls its hooks for its own half only.
	->register('main', 'OnAfterSetOption_~controller_group_name', [\Bitrix\BIConnector\Access\Table\PermissionCacheResetEventHandler::class, 'onBitrix24LicenseChange'])
;

$mainVersion = \Bitrix\Main\ModuleManager::getVersion('main');
if (is_string($mainVersion) && version_compare($mainVersion, '26.700.0', '>='))
{
	$event->register(
		'rest',
		'OnRestServiceBuildDescription',
		'\Bitrix\BIConnector\Rest\SqlLab',
		'OnRestServiceBuildDescription',
	);
}
