<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event->register('ai', 'onTuningLoad', '\Bitrix\Landing\Connector\Ai', 'onTuningLoad');
$event->register('ai', 'onBeforeCompletions', '\Bitrix\Landing\Connector\Ai', 'onBeforeCompletions');
$event->register('ai', 'onQueueJobExecute', '\Bitrix\Landing\Copilot\EventHandler', 'onQueueJobExecute');
$event->register('ai', 'onQueueJobFail', '\Bitrix\Landing\Copilot\EventHandler', 'onQueueJobFail');

$event->register('bitrix24', 'onAfterPortalBlockedByLicenseScanner', '\Bitrix\Landing\Connector\Bitrix24', 'onAfterPortalBlockedByLicenseScanner');

$event->register('crm', 'onAfterCrmCompanyAdd', '\Bitrix\Landing\Connector\Crm', 'onAfterCompanyChange');
$event->register('crm', 'onAfterCrmCompanyUpdate', '\Bitrix\Landing\Connector\Crm', 'onAfterCompanyChange');

$event->register('iblock', 'onAfterIBlockSectionDelete', '\Bitrix\Landing\Connector\Iblock', 'onAfterIBlockSectionDelete');

$event->register('intranet', 'onBuildBindingMenu', '\Bitrix\Landing\Connector\Intranet', 'onBuildBindingMenu');
$event->register('intranet', 'onSettingsProvidersCollect', '\Bitrix\Landing\Vibe\Integration\Intranet\EventHandler', 'onSettingsProvidersCollect');

$event->register('landing', 'onBuildSourceList', '\Bitrix\Landing\Connector\Landing', 'onSourceBuildHandler');

$event->register('main', 'onBeforeSiteDelete', '\Bitrix\Landing\Site', 'onBeforeMainSiteDelete');
$event->register('main', 'onSiteDelete', '\Bitrix\Landing\Site', 'onMainSiteDelete');
$event->register('main', 'onUserConsentProviderList', '\Bitrix\Landing\Site\Cookies', 'onUserConsentProviderList');
$event->register('main', 'OnAfterFileDeleteDuplicate', '\Bitrix\Landing\Update\Block\DuplicateImages', 'onAfterFileDeleteDuplicate');

$event->register('mobile', 'onMobileMenuStructureBuilt', '\Bitrix\Landing\Connector\Mobile', 'onMobileMenuStructureBuilt');

$event->register('rest', 'onRestServiceBuildDescription', '\Bitrix\Landing\Publicaction', 'restBase');
$event->register('rest', 'onBeforeApplicationUninstall', '\Bitrix\Landing\Publicaction', 'beforeRestApplicationDelete');
$event->register('rest', 'onRestAppDelete', '\Bitrix\Landing\Publicaction', 'restApplicationDelete');
$event->register('rest', 'onRestApplicationConfigurationGetManifest', '\Bitrix\Landing\Transfer\AppConfiguration', 'getManifestList');
$event->register('rest', 'onRestApplicationConfigurationExport', '\Bitrix\Landing\Transfer\AppConfiguration', 'onEventExportController');
$event->register('rest', 'onRestApplicationConfigurationGetManifestSetting', '\Bitrix\Landing\Transfer\AppConfiguration', 'onInitManifest');
$event->register('rest', 'onRestApplicationConfigurationEntity', '\Bitrix\Landing\Transfer\AppConfiguration', 'getEntityList');
$event->register('rest', 'onRestApplicationConfigurationImport', '\Bitrix\Landing\Transfer\AppConfiguration', 'onEventImportController');
$event->register('rest', 'onRestApplicationConfigurationFinish', '\Bitrix\Landing\Transfer\AppConfiguration', 'onFinish');

$event->register('seo', 'onExtensionInstall', '\Bitrix\Landing\Hook\Page\PixelFb', 'changeBusinessPixel');

$event->register('socialnetwork', 'onFillSocNetFeaturesList', '\Bitrix\Landing\Connector\SocialNetwork', 'onFillSocNetFeaturesList');
$event->register('socialnetwork', 'onFillSocNetMenu', '\Bitrix\Landing\Connector\SocialNetwork', 'onFillSocNetMenu');
$event->register('socialnetwork', 'onSocNetGroupDelete', '\Bitrix\Landing\Connector\SocialNetwork', 'onSocNetGroupDelete');
$event->register('socialnetwork', 'onSocNetFeaturesUpdate', '\Bitrix\Landing\Connector\SocialNetwork', 'onSocNetFeaturesUpdate');
