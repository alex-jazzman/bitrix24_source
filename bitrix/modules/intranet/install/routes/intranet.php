<?php

use Bitrix\Disk\Controller\UnifiedLinkController;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Routing\Controllers\PublicPageController;
use Bitrix\Main\Routing\RoutingConfigurator;
use Bitrix\Main\SiteTable;

return static function (RoutingConfigurator $routes) {

	// stssync
	$routes
		->prefix('stssync')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) {
			$routes->any('contacts/{any}', new PublicPageController('/bitrix/services/stssync/contacts/index.php'));
			$routes->any('calendar/{any}', new PublicPageController('/bitrix/services/stssync/calendar/index.php'));
			$routes->any('tasks/{any}', new PublicPageController('/bitrix/services/stssync/tasks/index.php'));
			$routes->any('contacts_crm/{any}', new PublicPageController('/bitrix/services/stssync/contacts_crm/index.php'));
			$routes->any('contacts_extranet/{any}', new PublicPageController('/bitrix/services/stssync/contacts_extranet/index.php'));
			$routes->any('contacts_extranet_emp/{any}', new PublicPageController('/bitrix/services/stssync/contacts_extranet_emp/index.php'));
			$routes->any('tasks_extranet/{any}', new PublicPageController('/bitrix/services/stssync/tasks_extranet/index.php'));
			$routes->any('calendar_extranet/{any}', new PublicPageController('/bitrix/services/stssync/calendar_extranet/index.php'));
		},
		)
	;

	// services
	$routes->any('/bitrix/services/ymarket/{any}', new PublicPageController('/bitrix/services/ymarket/index.php'))
		->where('any', '.*')
	;

	$routes->any('/.well-known/{any}', new PublicPageController('/bitrix/groupdav.php'))
		->where('any', '.*')
	;
	$routes->any('/.well-known', new PublicPageController('/bitrix/groupdav.php'));
	$routes->any('/_analytics/', fn() => '42');

	$isCloud = ModuleManager::isModuleInstalled('bitrix24');
	$siteDir = '/';

	if (!$isCloud)
	{
		$request = Application::getInstance()->getContext()->getRequest();
		$site = SiteTable::getByDomain($request->getHttpHost(), $request->getRequestedPageDirectory());
		$wizardId = Option::get('main', '~wizard_id', false, $site['LID'] ?? null);

		if ($wizardId === 'portal')
		{
			$siteDir = $site['DIR'] ?? '/';
		}
		else
		{
			return;
		}
	}

	$sitePrefix = ltrim($siteDir, '/');

	// pub
	$routes->prefix($sitePrefix . 'pub')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('annuals/{shortCode}/{any}', new PublicPageController($siteDir . 'pub/annual_summary.php'))->name('AnnualSummaryShort');
			$routes->any('annual_summary/{signedId}/{signedType}/{any}', new PublicPageController($siteDir . 'pub/annual_summary.php'))->name('AnnualSummary');
			$routes->any('pay/{account_number}/{hash}/{any}', new PublicPageController($siteDir . 'pub/payment.php'))
				->where('account_number', '[0-9a-zA-Z_-]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('pay/{account_number}/{hash}/{any}', new PublicPageController($siteDir . 'pub/payment.php'))
				->where('account_number', '[\w\W]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('pay/{account_number}/{hash}/{any}', new PublicPageController($siteDir . 'pub/payment.php'))
				->where('account_number', '[0-9]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('document/{id}/{hash}/{any}', new PublicPageController($siteDir . 'pub/document.php'))
				->where('id', '[0-9a-zA-Z_-]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('{hash}/{action}', new PublicPageController($siteDir . 'pub/index.php'))
				->where('hash', '[0-9a-f]{32}')
				->where('action', '.*')
			;
			$routes->any('form/{form_code}/{sec}/{any}', new PublicPageController($siteDir . 'pub/form.php'))
				->where('form_code', '[0-9a-z_]+?')
				->where('sec', '[0-9a-z]+?')
			;
			$routes->any('calendar-event/{event_id}/{hash}', new PublicPageController($siteDir . 'pub/calendar_event.php'))
				->where('event_id', '[0-9]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('calendar-event/{event_id}/{hash}/{any}', new PublicPageController($siteDir . 'pub/calendar_event.php'))
				->where('event_id', '[0-9]+')
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('calendar-sharing/{hash}', new PublicPageController($siteDir . 'pub/calendar_sharing.php'))
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('calendar-sharing/{hash}/{any}', new PublicPageController($siteDir . 'pub/calendar_sharing.php'))
				->where('hash', '[0-9a-zA-Z]+')
			;
			$routes->any('payment-slip/{signed_payment_id}/{any}', new PublicPageController($siteDir . 'pub/payment_slip.php'))
				->where('signed_payment_id', '[\w\W]+')
			;
			$routes->any('booking/confirmation/{hash}/{any}', new PublicPageController($siteDir . 'pub/booking/confirmation.php'))
				->where('hash', '[0-9a-z\.]+')
			;
			$routes->any('site/{any}', new PublicPageController($siteDir . 'pub/site/index.php'));
			$routes->any('{any}', new PublicPageController($siteDir . 'pub/payment.php'));
		})
	;

	// docs
	$routes->prefix($sitePrefix . 'docs')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('pub/{hash}/{action}', new PublicPageController($siteDir . 'docs/pub/index.php'))
				->where('hash', '[0-9a-f]{32}')
				->where('action', '.*')
			;
			$routes->any('pub/{any}', new PublicPageController($siteDir . 'docs/pub/extlinks.php'));
			$routes->any('sale/{any}', new PublicPageController($siteDir . 'docs/sale/index.php'));
			$routes->any('shared/{any}', new PublicPageController($siteDir . 'docs/shared/index.php'));
			$routes->any('manage/{any}', new PublicPageController($siteDir . 'docs/manage/index.php'));
			$routes->any('{any}', new PublicPageController($siteDir . 'docs/index.php'));
		})
	;

	// disk
	$routes->prefix($sitePrefix . 'disk/boards')
		->where('fileId', '[0-9]+')
		->where('attachedObjectId', '[0-9]+')
		->group(function (RoutingConfigurator $routes) {
			$routes->any('{fileId}/openDocument', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openDocument']);
			$routes->any('{attachedObjectId}/openAttachedDocument', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openAttachedDocument']);
			$routes->any('{fileId}/open', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openDocument']);
			$routes->any('{attachedObjectId}/openAttached', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openAttachedDocument']);
			$routes->any('{fileId}/openDocument/', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openDocument']);
			$routes->any('{attachedObjectId}/openAttachedDocument/', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openAttachedDocument']);
			$routes->any('{fileId}/open/', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openDocument']);
			$routes->any('{attachedObjectId}/openAttached/', [\Bitrix\Disk\Controller\Integration\Flipchart::class, 'openAttachedDocument']);
		})
	;
	$routes->any($siteDir . 'disk/{action}/{fileId}/{any}', new PublicPageController('/bitrix/services/disk/index.php'))
		->where('any', '.*')
		->where('action', '[0-9a-zA-Z]+')
		->where('fileId', '[0-9]+')
	;
	$routes->any($siteDir . 'mobile/disk/{objectId}/download', new PublicPageController($siteDir . 'mobile/disk/index.php'))
		->where('objectId', '[0-9]+')
		->default('download', '1')
	;
	$routes->any($siteDir . 'mobile/disk/{objectId}/download/', new PublicPageController($siteDir . 'mobile/disk/index.php'))
		->where('objectId', '[0-9]+')
		->default('download', '1')
	;
	$routes->prefix($sitePrefix . 'disk/file')
		->where('uniqueCode', '[0-9a-zA-Z]{20}')
		->group(function (RoutingConfigurator $routes) {
			$routes->get('{uniqueCode}', [UnifiedLinkController::class, 'view']);
			$routes->get('{uniqueCode}/edit', [UnifiedLinkController::class, 'edit']);
			$routes->get('{uniqueCode}/', [UnifiedLinkController::class, 'view']);
			$routes->get('{uniqueCode}/edit/', [UnifiedLinkController::class, 'edit']);
		})
	;

	// crm
	$routes
		->prefix($sitePrefix . 'crm')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('type/{any}', new PublicPageController($siteDir . 'crm/type/index.php'));
			$routes->any('terminal/{any}', new PublicPageController($siteDir . 'terminal/index.php'));
			$routes->any('reports/report/{any}', new PublicPageController($siteDir . 'crm/reports/report/index.php'));
			$routes->any('activity/{any}', new PublicPageController($siteDir . 'crm/activity/index.php'));
			$routes->any('company/{any}', new PublicPageController($siteDir . 'crm/company/index.php'));
			$routes->any('webform/{any}', new PublicPageController($siteDir . 'crm/webform/index.php'));
			$routes->any('invoice/{any}', new PublicPageController($siteDir . 'crm/invoice/index.php'));
			$routes->any('product/{any}', new PublicPageController($siteDir . 'crm/product/index.php'));
			$routes->any('contact/{any}', new PublicPageController($siteDir . 'crm/contact/index.php'));
			$routes->any('button/{any}', new PublicPageController($siteDir . 'crm/button/index.php'));
			$routes->any('quote/{any}', new PublicPageController($siteDir . 'crm/quote/index.php'));
			$routes->any('lead/{any}', new PublicPageController($siteDir . 'crm/lead/index.php'));
			$routes->any('deal/{any}', new PublicPageController($siteDir . 'crm/deal/index.php'));
			$routes->any('tracking/{any}', new PublicPageController($siteDir . 'crm/tracking/index.php'));
			$routes->any('ml/{any}', new PublicPageController($siteDir . 'crm/ml/index.php'));
			$routes->any('catalog/{any}', new PublicPageController($siteDir . 'crm/catalog/index.php'));

			// configs
			$routes->prefix('configs')->group(function (RoutingConfigurator $routes) use ($siteDir) {
				$routes->any('deal_category/{any}', new PublicPageController($siteDir . 'crm/configs/deal_category/index.php'));
				$routes->any('productprops/{any}', new PublicPageController($siteDir . 'crm/configs/productprops/index.php'));
				$routes->any('mailtemplate/{any}', new PublicPageController($siteDir . 'crm/configs/mailtemplate/index.php'));
				$routes->any('locations/{any}', new PublicPageController($siteDir . 'crm/configs/locations/index.php'));
				$routes->any('mycompany/{any}', new PublicPageController($siteDir . 'crm/configs/mycompany/index.php'));
				$routes->any('currency/{any}', new PublicPageController($siteDir . 'crm/configs/currency/index.php'));
				$routes->any('measure/{any}', new PublicPageController($siteDir . 'crm/configs/measure/index.php'));
				$routes->any('volume/{any}', new PublicPageController($siteDir . 'crm/configs/volume/index.php'));
				$routes->any('exch1c/{any}', new PublicPageController($siteDir . 'crm/configs/exch1c/index.php'));
				$routes->any('fields/{any}', new PublicPageController($siteDir . 'crm/configs/fields/index.php'));
				$routes->any('preset/{any}', new PublicPageController($siteDir . 'crm/configs/preset/index.php'));
				$routes->any('perms/{any}', new PublicPageController($siteDir . 'crm/configs/perms/index.php'));
				$routes->any('tax/{any}', new PublicPageController($siteDir . 'crm/configs/tax/index.php'));
				$routes->any('ps/{any}', new PublicPageController($siteDir . 'crm/configs/ps/index.php'));
				$routes->any('automation/{any}', new PublicPageController($siteDir . 'crm/configs/automation/index.php'));
				$routes->any('bp/{any}', new PublicPageController($siteDir . 'crm/configs/bp/index.php'));
				$routes->any('exclusion/{any}', new PublicPageController($siteDir . 'crm/configs/exclusion/index.php'));
				$routes->any('document_numerators/{any}', new PublicPageController($siteDir . 'crm/configs/document_numerators/index.php'));
				$routes->any('communication_channel_routes/{any}', new PublicPageController($siteDir . 'crm/configs/communication_channel_routes/index.php'));
			});
			$routes->any('{any}', new PublicPageController($siteDir . 'crm/index.php'));
		})
	;

	// automation
	$routes
		->any($siteDir . 'automation/type/{any}', new PublicPageController($siteDir . 'automation/type/index.php'))
		->where('any', '.*')
	;

	// bizproc
	$routes
		->prefix($sitePrefix . 'bizproc')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->get('ai/agents/{any}', new PublicPageController($siteDir . 'bizproc/ai/agents/index.php'));
			$routes->any('processes/{any}', new PublicPageController($siteDir . 'bizproc/processes/index.php'));
		})
	;

	// marketplace + market
	$routes
		->prefix($sitePrefix . 'marketplace')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('configuration/{any}', new PublicPageController($siteDir . 'marketplace/configuration/index.php'));
			$routes->any('hook/{any}', new PublicPageController($siteDir . 'marketplace/hook/index.php'));
			$routes->any('app/{any}', new PublicPageController($siteDir . 'marketplace/app/index.php'));
			$routes->any('view/quick/{any}', new PublicPageController($siteDir . 'marketplace/view/quick/index.php'));
			$routes->any('view/{APP}/{any}', new PublicPageController($siteDir . 'marketplace/view/index.php'))
				->where('APP', '[a-zA-Z0-9\\.\\_]+')
			;
			$routes->any('{any}', new PublicPageController($siteDir . 'marketplace/index.php'));
		})
	;
	$routes->any($siteDir . 'market/{any}', new PublicPageController($siteDir . 'market/index.php'))
		->where('any', '.*')
	;

	// timeman
	$routes
		->prefix($sitePrefix . 'timeman')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('meeting/{any}', new PublicPageController($siteDir . 'timeman/meeting/index.php'));
			$routes->any('schedules/{any}', new PublicPageController($siteDir . 'timeman/schedules.php'));
			$routes->any('settings/{any}', new PublicPageController($siteDir . 'timeman/settings.php'));
			$routes->any('worktime/{any}', new PublicPageController($siteDir . 'timeman/worktime.php'));
			$routes->any('login-history/{user}/{any}', new PublicPageController($siteDir . 'timeman/login-history/index.php'))
				->where('user', '[0-9]+')
			;
		})
	;

	// shop
	$routes
		->prefix($sitePrefix . 'shop')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('settings/permissions/{any}', new PublicPageController($siteDir . 'shop/settings/permissions/index.php'));
			$routes->any('documents/{any}', new PublicPageController($siteDir . 'shop/documents/index.php'));
			$routes->any('documents-catalog/{any}', new PublicPageController($siteDir . 'shop/documents-catalog/index.php'));
			$routes->any('documents-stores/{any}', new PublicPageController($siteDir . 'shop/documents-stores/index.php'));
			$routes->any('terminal/{any}', new PublicPageController($siteDir . 'terminal/index.php'));
			$routes->any('orderform/{any}', new PublicPageController($siteDir . 'shop/orderform/index.php'));
			$routes->any('buyer_group/{any}', new PublicPageController($siteDir . 'shop/buyer_group/index.php'));
			$routes->any('buyer/{any}', new PublicPageController($siteDir . 'shop/buyer/index.php'));
			$routes->any('import/instagram/{any}', new PublicPageController($siteDir . 'shop/import/instagram/index.php'));
			$routes->any('settings/', new PublicPageController($siteDir . 'shop/settings/index.php'));
			$routes->any('settings/{any}', new PublicPageController($siteDir . 'shop/settings/index.php'));
			$routes->any('stores/{any}', new PublicPageController($siteDir . 'shop/stores/index.php'));
			$routes->any('orders/{any}', new PublicPageController($siteDir . 'shop/orders/index.php'));
			$routes->any('catalog/{any}', new PublicPageController($siteDir . 'shop/catalog/index.php'));
		})
	;

	// stores
	$routes->any($siteDir . 'stores/{any}', new PublicPageController($siteDir . 'stores/index.php'))
		->where('any', '.*')
	;

	// marketing
	$routes
		->prefix($sitePrefix . 'marketing')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('toloka/{any}', new PublicPageController($siteDir . 'marketing/toloka.php'));
			$routes->any('master-yandex/{any}', new PublicPageController($siteDir . 'marketing/master-yandex.php'));
			$routes->any('letter/{any}', new PublicPageController($siteDir . 'marketing/letter.php'));
			$routes->any('ads/{any}', new PublicPageController($siteDir . 'marketing/ads.php'));
			$routes->any('segment/{any}', new PublicPageController($siteDir . 'marketing/segment.php'));
			$routes->any('template/{any}', new PublicPageController($siteDir . 'marketing/template.php'));
			$routes->any('blacklist/{any}', new PublicPageController($siteDir . 'marketing/blacklist.php'));
			$routes->any('contact/{any}', new PublicPageController($siteDir . 'marketing/contact.php'));
			$routes->any('rc/{any}', new PublicPageController($siteDir . 'marketing/rc.php'));
			$routes->any('config/role/{any}', new PublicPageController($siteDir . 'marketing/config/role.php'));
		},
		)
	;

	// im
	$routes->any($siteDir . 'video/{alias}/{extra}',
		new PublicPageController($siteDir . 'conference/videoconf.php'))
		->where('alias', '[\.\-0-9a-zA-Z]+')
		->where('extra', '.*')
		->default('videoconf', 1)
	;
	$routes->any($siteDir . 'video/{alias}',
		new PublicPageController($siteDir . 'conference/videoconf.php'))
		->where('alias', '[\.\-0-9a-zA-Z]+')
		->default('extra', '')
		->default('videoconf', 1)
	;
	$routes->any($siteDir . 'online/{alias}/{extra}',
		new PublicPageController($siteDir . 'desktop_app/router.php'))
		->where('alias', '[\.\-0-9a-zA-Z]+')
		->where('extra', '.*')
	;
	$routes->any($siteDir . 'online/{alias}',
		new PublicPageController($siteDir . 'desktop_app/router.php'))
		->where('alias', '[\.\-0-9a-zA-Z]+')
		->default('extra', '')
	;
	$routes->any($siteDir . 'online/{any}', new PublicPageController($siteDir . 'desktop_app/router.php'))
		->where('any', '.*')
	;
	$routes
		->any($siteDir . 'call/detail/{callId}', new PublicPageController($siteDir . 'call/index.php'))
		->where('callId', '[0-9]+')
	;
	$routes
		->any($siteDir . 'call/detail/{callId}/', new PublicPageController($siteDir . 'call/index.php'))
		->where('callId', '[0-9]+')
	;
	$routes->any($siteDir . 'conference/{any}', new PublicPageController($siteDir . 'conference/index.php'))
		->where('any', '.*')
	;

	// desktop
	$routes->any($siteDir . 'desktop/menu{any}', new PublicPageController($siteDir . 'desktop_menu/index.php'))
		->where('any', '.*')
	;

	// company
	$routes
		->prefix($sitePrefix . 'company')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('personal/mail/{any}', new PublicPageController($siteDir . 'mail/index.php'));
			$routes->any('personal/{any}', new PublicPageController($siteDir . 'company/personal.php'));
			$routes->any('gallery/{any}', new PublicPageController($siteDir . 'company/gallery/index.php'));
			$routes->any('lists/{any}', new PublicPageController($siteDir . 'company/lists/index.php'));
		})
	;

	// about
	$routes->any($siteDir . 'about/gallery/{any}', new PublicPageController($siteDir . 'about/gallery/index.php'))
		->where('any', '.*')
	;

	// services
	$routes
		->prefix($sitePrefix . 'services')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('lists/{any}', new PublicPageController($siteDir . 'services/lists/index.php'));
			$routes->any('faq/{any}', new PublicPageController($siteDir . 'services/faq/index.php'));
			$routes->any('idea/{any}', new PublicPageController($siteDir . 'services/idea/index.php'));
		})
	;

	// workgroups
	$routes->any($siteDir . 'workgroups/{any}', new PublicPageController($siteDir . 'workgroups/index.php'))
		->where('any', '.*')
	;

	// rest
	$routes->any($siteDir . 'rest/{any}', new PublicPageController('/bitrix/services/rest/index.php'))
		->where('any', '.*')
	;
	$routes->any($siteDir . 'devops/{any}', new PublicPageController($siteDir . 'devops/index.php'))
		->where('any', '.*')
	;

	// onec
	$routes->any($siteDir . 'onec/{any}', new PublicPageController($siteDir . 'onec/index.php'))
		->where('any', '.*')
	;

	// settings
	$routes->any($siteDir . 'settings/configs/userconsent/', new PublicPageController($siteDir . 'settings/configs/userconsent.php'));
	$routes->any($siteDir . 'settings/configs/userconsent/{any}', new PublicPageController($siteDir . 'settings/configs/userconsent.php'))
		->where('any', '.*')
	;

	// sites
	$routes->any($siteDir . 'sites/{any}', new PublicPageController($siteDir . 'sites/index.php'))
		->where('any', '.*')
	;

	// mobile
	$routes->any($siteDir . 'm/docs/{any}', new PublicPageController($siteDir . 'm/docs/index.php'))
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/webdav{any}', new PublicPageController($siteDir . 'mobile/webdav/index.php'))
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/mobile_component/{componentName}/{any}', new PublicPageController('/bitrix/services/mobile/jscomponent.php'))
		->where('componentName', '.*')
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/mobile_component/{componentName}', new PublicPageController('/bitrix/services/mobile/jscomponent.php'))
		->where('componentName', '.*')
	;
	$routes->any($siteDir . 'mobile/web_mobile_component/{componentName}/{any}', new PublicPageController('/bitrix/services/mobile/webcomponent.php'))
		->where('componentName', '.*')
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/web_mobile_component/{componentName}', new PublicPageController('/bitrix/services/mobile/webcomponent.php'))
		->where('componentName', '.*')
	;
	$routes->any($siteDir . 'mobile/jn/{componentName}/{any}', new PublicPageController('/bitrix/services/mobile/jscomponent.php'))
		->where('componentName', '.*')
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/jn/{componentName}', new PublicPageController('/bitrix/services/mobile/jscomponent.php'))
		->where('componentName', '.*')
	;
	$routes->any($siteDir . 'mobileapp/jn/{componentName}/{any}', new PublicPageController('/bitrix/services/mobileapp/jn.php'))
		->where('componentName', '.*')
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobileapp/jn/{componentName}', new PublicPageController('/bitrix/services/mobileapp/jn.php'))
		->where('componentName', '.*')
	;
	$routes->any($siteDir . 'mobile/knowledge/group/{any}', new PublicPageController($siteDir . 'mobile/knowledge/group/index.php'))
		->where('any', '.*')
	;
	$routes->any($siteDir . 'mobile/knowledge/{any}', new PublicPageController($siteDir . 'mobile/knowledge/index.php'))
		->where('any', '.*')
	;

	// mail
	$routes->any($siteDir . 'mail/{any}', new PublicPageController($siteDir . 'mail/index.php'))
		->where('any', '.*')
	;

	// knowledge
	$routes
		->prefix($sitePrefix . 'knowledge')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('group/{any}', new PublicPageController($siteDir . 'knowledge/group/index.php'));
			$routes->any('{any}', new PublicPageController($siteDir . 'knowledge/index.php'));
		})
	;
	$routes
		->prefix($sitePrefix . 'kb')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('group/{any}', new PublicPageController($siteDir . 'kb/group/index.php'));
			$routes->any('{any}', new PublicPageController($siteDir . 'kb/index.php'));
		})
	;

	// rpa
	$routes->any($siteDir . 'rpa/', new PublicPageController($siteDir . 'rpa/index.php'));
	$routes->any($siteDir . 'rpa/{any}', new PublicPageController($siteDir . 'rpa/index.php'))
		->where('any', '.*')
	;

	// calendar
	$routes
		->prefix($sitePrefix . 'calendar')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('rooms/{any}', new PublicPageController($siteDir . 'calendar/rooms.php'));
			$routes->any('open/{any}', new PublicPageController($siteDir . 'calendar/open_events.php'));
		})
	;

	// terminal
	$routes->any($siteDir . 'terminal/{any}', new PublicPageController($siteDir . 'terminal/index.php'))
		->where('any', '.*')
	;

	// bi
	$routes
		->prefix($sitePrefix . 'bi')
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('dashboard/detail/{dashboardId}/', new PublicPageController($siteDir . 'bi/dashboard/detail/index.php'))
				->where('dashboardId', '[0-9]+')
			;
			$routes->any('dashboard/{any}', new PublicPageController($siteDir . 'bi/dashboard/index.php'));
			$routes->any('table/{any}', new PublicPageController($siteDir . 'bi/table/index.php'));
			$routes->any('source/{any}', new PublicPageController($siteDir . 'bi/source/index.php'));
			$routes->any('statistics/{any}', new PublicPageController($siteDir . 'bi/statistics/index.php'));
			$routes->any('unused_elements/{any}', new PublicPageController($siteDir . 'bi/unused_elements/index.php'));
			$routes->any('settings/permissions/{any}', new PublicPageController($siteDir . 'bi/settings/permissions/index.php'));
		})
	;

	// page
	$routes->any($siteDir . 'page/{any}', new PublicPageController($siteDir . 'page/index.php'))
		->where('any', '.*')
	;

	// sign
	$routes
		->prefix($sitePrefix . 'sign')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('link/member/{memberId}', new PublicPageController($siteDir . 'sign/link.php'))
				->where('memberId', '[0-9]+')
			;
			$routes->any('link/member/{memberId}/', new PublicPageController($siteDir . 'sign/link.php'))
				->where('memberId', '[0-9]+')
			;
			$routes->any('{any}', new PublicPageController($siteDir . 'sign/index.php'))
				->where('any', '.*')
			;
		})
	;

	// agent contract
	$routes->any($siteDir . 'agent_contract/{any}', new PublicPageController($siteDir . 'agent_contract/index.php'))
		->where('any', '.*')
	;

	// spaces
	$routes->any($siteDir . 'spaces/{any}', new PublicPageController($siteDir . 'spaces/index.php'))
		->where('any', '.*')
	;

	// hr
	$routes->any($siteDir . 'hr/{any}', new PublicPageController($siteDir . 'hr/index.php'))
		->where('any', '.*')
	;

	// vibe
	$routes->any($siteDir . 'welcome/', new PublicPageController($siteDir . 'welcome/index.php'));
	$routes->any($siteDir . 'welcome/edit/{moduleId}/{embedId}/', new PublicPageController($siteDir . 'welcome/edit/index.php'))
		->where('moduleId', '[0-9a-zA-Z]+')
		->where('embedId', '[0-9a-zA-Z_]+')
	;
	$routes->any($siteDir . 'welcome/new/{moduleId}/{embedId}/', new PublicPageController($siteDir . 'welcome/new/index.php'))
		->where('moduleId', '[0-9a-zA-Z]+')
		->where('embedId', '[0-9a-zA-Z_]+')
	;
	$routes->any($siteDir . 'welcome/settings/{moduleId}/{embedId}/', new PublicPageController($siteDir . 'welcome/settings/index.php'))
		->where('moduleId', '[0-9a-zA-Z]+')
		->where('embedId', '[0-9a-zA-Z_]+')
	;
	$routes->any(
		$siteDir . 'welcome/settings/{moduleId}/{embedId}/{type}/',
		new PublicPageController($siteDir . 'welcome/settings/index.php')
	)
		->where('moduleId', '[0-9a-zA-Z]+')
		->where('embedId', '[0-9a-zA-Z_]+')
		->where('type', 'page|page_design|site|site_design')
	;

	// note
	$routes
		->prefix($sitePrefix . 'note')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('document/{documentId}', new PublicPageController($siteDir . 'note/document/index.php'))
				->where('documentId', '[0-9]+')
			;
			$routes->any('document/{documentId}/', new PublicPageController($siteDir . 'note/document/index.php'))
				->where('documentId', '[0-9]+')
			;
			$routes->any('settings/permissions/{any}', new PublicPageController($siteDir . 'note/settings/permissions/index.php'))
				->where('any', '.*')
			;
			$routes->any('{any}', new PublicPageController($siteDir . 'note/index.php'))
				->where('any', '.*')
			;
		})
	;

	// booking
	$routes->any($siteDir . 'booking/detail/{id}', new PublicPageController($siteDir . 'booking/detail.php'))
		->where('id', '[0-9]+')
	;
	$routes->any($siteDir . 'booking/detail/{id}/', new PublicPageController($siteDir . 'booking/detail.php'))
		->where('id', '[0-9]+')
	;
	$routes->any($siteDir . 'booking/{any}', new PublicPageController($siteDir . 'booking/index.php'))
		->where('any', '.*')
	;

	// vote result
	$routes->any($siteDir . 'vote-result/{signedAttachId}', new PublicPageController( $siteDir . 'vote-result/index.php'))
		->where('signedAttachId', '[0-9a-z\.]+')
	;
	$routes->any($siteDir . 'vote-result/{signedAttachId}/', new PublicPageController( $siteDir . 'vote-result/index.php'))
		->where('signedAttachId', '[0-9a-z\.]+')
	;

	// task comments
	$routes->any($siteDir . 'task/comments/{taskId}', new PublicPageController($siteDir . 'tasks/comments.php'))
		->where('taskId', '[0-9]+')
	;
	$routes->any($siteDir . 'task/comments/{taskId}/', new PublicPageController($siteDir . 'tasks/comments.php'))
		->where('taskId', '[0-9]+')
	;

	// bot
	$routes->any($siteDir . 'gotobot/{bot}', new PublicPageController($siteDir . 'gotobot/index.php'))
		->where('bot', '.*')
	;
};
