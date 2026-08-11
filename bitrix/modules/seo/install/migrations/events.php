<?php
$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event->register('main', 'OnPanelCreate', 'CSeoEventHandlers', 'SeoOnPanelCreate');

if (COption::GetOptionString('main', 'vendor', '') == '1c_bitrix')
{
	$event
		->register('fileman', 'OnIncludeHTMLEditorScript', 'CSeoEventHandlers', 'OnIncludeHTMLEditorScript')
		->register('fileman', 'OnBeforeHTMLEditorScriptRuns', 'CSeoEventHandlers', 'OnBeforeHTMLEditorScriptRuns')
	;
}

$event
	->register('iblock', 'OnAfterIBlockSectionAdd', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'addSection')
	->register('iblock', 'OnAfterIBlockElementAdd', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'addElement')
	->register('iblock', 'OnAfterIBlockSectionDelete', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'deleteSection')
	->register('iblock', 'OnAfterIBlockElementDelete', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'deleteElement')
	->register('iblock', 'OnAfterIBlockSectionUpdate', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'updateSection')
	->register('iblock', 'OnAfterIBlockElementUpdate', \Bitrix\Seo\Sitemap\Source\Iblock::class, 'updateElement')
	->register('forum', 'onAfterTopicAdd', \Bitrix\Seo\Sitemap\Source\Forum::class, 'addTopic')
	->register('forum', 'onAfterTopicUpdate', \Bitrix\Seo\Sitemap\Source\Forum::class, 'updateTopic')
	->register('forum', 'onAfterTopicDelete', \Bitrix\Seo\Sitemap\Source\Forum::class, 'deleteTopic')
	->register('main', 'OnAdminIBlockElementEdit', '\Bitrix\Seo\AdvTabEngine', 'eventHandler')
	->register('main', 'OnBeforeProlog', '\Bitrix\Seo\AdvSession', 'checkSession')
	->register('sale', 'OnOrderSave', '\Bitrix\Seo\AdvSession', 'onOrderSave')
	->register('sale', 'OnBasketOrder', '\Bitrix\Seo\AdvSession', 'onBasketOrder')
	->register('sale', 'onSalePayOrder', '\Bitrix\Seo\AdvSession', 'onSalePayOrder')
	->register('sale', 'onSaleDeductOrder', '\Bitrix\Seo\AdvSession', 'onSaleDeductOrder')
	->register('sale', 'onSaleDeliveryOrder', '\Bitrix\Seo\AdvSession', 'onSaleDeliveryOrder')
	->register('sale', 'onSaleStatusOrder', '\Bitrix\Seo\AdvSession', 'onSaleStatusOrder')
	->register('conversion', 'OnSetDayContextAttributes', '\Bitrix\Seo\ConversionHandler', 'onSetDayContextAttributes')
	->register('conversion', 'OnGetAttributeTypes', '\Bitrix\Seo\ConversionHandler', 'onGetAttributeTypes')
	->register('catalog', 'OnProductUpdate', '\Bitrix\Seo\Adv\Auto', 'checkQuantity')
	->register('catalog', 'OnProductSetAvailableUpdate', '\Bitrix\Seo\Adv\Auto', 'checkQuantity')
	->register('bitrix24', 'onDomainChange', '\Bitrix\Seo\Service', 'changeRegisteredDomain')
;

// Uninstall drops only what it can name — unRegisterEventHandler() matches TO_CLASS exactly.
// Earlier installers wrote the sitemap handlers under the `Sitemap*` aliases (see compatibility.php)
// and under the leading-slash spelling of the current classes, so the block above never reaches
// those rows. Every spelling below comes from the history of install/index.php.
$event
	->unregister('iblock', 'OnAfterIBlockSectionDelete', '\Bitrix\Seo\Sitemap\Source\Iblock', 'deleteSection')
	->unregister('iblock', 'OnAfterIBlockElementDelete', '\Bitrix\Seo\Sitemap\Source\Iblock', 'deleteElement')
	->unregister('iblock', 'OnAfterIBlockSectionUpdate', '\Bitrix\Seo\Sitemap\Source\Iblock', 'updateSection')
	->unregister('iblock', 'OnAfterIBlockElementUpdate', '\Bitrix\Seo\Sitemap\Source\Iblock', 'updateElement')
	->unregister('forum', 'onAfterTopicAdd', '\Bitrix\Seo\Sitemap\Source\Forum', 'addTopic')
	->unregister('forum', 'onAfterTopicUpdate', '\Bitrix\Seo\Sitemap\Source\Forum', 'updateTopic')
	->unregister('forum', 'onAfterTopicDelete', '\Bitrix\Seo\Sitemap\Source\Forum', 'deleteTopic')
	->unregister('iblock', 'OnAfterIBlockSectionAdd', '\Bitrix\Seo\SitemapIblock', 'addSection')
	->unregister('iblock', 'OnAfterIBlockElementAdd', '\Bitrix\Seo\SitemapIblock', 'addElement')
	->unregister('iblock', 'OnAfterIBlockSectionDelete', '\Bitrix\Seo\SitemapIblock', 'deleteSection')
	->unregister('iblock', 'OnAfterIBlockElementDelete', '\Bitrix\Seo\SitemapIblock', 'deleteElement')
	->unregister('iblock', 'OnAfterIBlockSectionUpdate', '\Bitrix\Seo\SitemapIblock', 'updateSection')
	->unregister('iblock', 'OnAfterIBlockElementUpdate', '\Bitrix\Seo\SitemapIblock', 'updateElement')
	->unregister('iblock', 'OnBeforeIBlockSectionDelete', '\Bitrix\Seo\SitemapIblock', 'beforeDeleteSection')
	->unregister('iblock', 'OnBeforeIBlockElementDelete', '\Bitrix\Seo\SitemapIblock', 'beforeDeleteElement')
	->unregister('iblock', 'OnBeforeIBlockSectionUpdate', '\Bitrix\Seo\SitemapIblock', 'beforeUpdateSection')
	->unregister('iblock', 'OnBeforeIBlockElementUpdate', '\Bitrix\Seo\SitemapIblock', 'beforeUpdateElement')
	->unregister('forum', 'onAfterTopicAdd', '\Bitrix\Seo\SitemapForum', 'addTopic')
	->unregister('forum', 'onAfterTopicUpdate', '\Bitrix\Seo\SitemapForum', 'updateTopic')
	->unregister('forum', 'onAfterTopicDelete', '\Bitrix\Seo\SitemapForum', 'deleteTopic')
	->unregister('forum', 'onAfterMessageAdd', '\Bitrix\Seo\SitemapForum', 'addMessage')
;

// The fileman pair is registered only under the 1c_bitrix vendor, so drop it unconditionally:
// a portal that switched vendor after install would otherwise keep both handlers.
// The empty class and method reproduce the reach of the old installer, which removed these two
// events with a three-argument call — that matches rows stored without a handler class.
$event
	->unregister('fileman', 'OnIncludeHTMLEditorScript', 'CSeoEventHandlers', 'OnIncludeHTMLEditorScript')
	->unregister('fileman', 'OnBeforeHTMLEditorScriptRuns', 'CSeoEventHandlers', 'OnBeforeHTMLEditorScriptRuns')
	->unregister('fileman', 'OnIncludeHTMLEditorScript', '', '')
	->unregister('main', 'OnPanelCreate', '', '')
;
