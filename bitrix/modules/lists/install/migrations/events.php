<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

// Handler class names are stored verbatim in b_module_to_module.TO_CLASS, so the mixed notation below
// (leading-backslash strings vs ::class) reproduces the historical spelling. Unifying it would break
// unregistration on portals installed by earlier versions.
$event
	->registerCompatible('iblock', 'OnAfterIBlockUpdate', 'CLists', 'OnAfterIBlockUpdate')
	->registerCompatible('iblock', 'OnIBlockDelete', 'CLists', 'OnIBlockDelete')
	->registerCompatible('iblock', 'OnAfterIBlockDelete', 'CLists', 'OnAfterIBlockDelete')
	->registerCompatible('iblock', 'CIBlockDocument_OnGetDocumentAdminPage', 'CList', 'OnGetDocumentAdminPage')
	->registerCompatible('intranet', 'OnSharepointCreateProperty', 'CLists', 'OnSharepointCreateProperty')
	->registerCompatible('intranet', 'OnSharepointCheckAccess', 'CLists', 'OnSharepointCheckAccess')
	->registerCompatible('perfmon', 'OnGetTableSchema', 'lists', 'OnGetTableSchema')
	->registerCompatible('search', 'OnSearchGetURL', 'CList', 'OnSearchGetURL', 50)
	->registerCompatible('socialnetwork', 'OnFillSocNetLogEvents', 'CListsLiveFeed', 'onFillSocNetLogEvents')
	->registerCompatible('socialnetwork', 'OnFillSocNetAllowedSubscribeEntityTypes', 'CListsLiveFeed', 'onFillSocNetAllowedSubscribeEntityTypes')
	->registerCompatible('socialnetwork', 'BeforeIndexSocNet', 'CListsLiveFeed', 'BeforeIndexSocNet')
	->registerCompatible('socialnetwork', 'OnAfterSonetLogEntryAddComment', 'CListsLiveFeed', 'OnAfterSonetLogEntryAddComment')
	->registerCompatible('socialnetwork', 'OnForumCommentIMNotify', 'CListsLiveFeed', 'OnForumCommentIMNotify')
	->registerCompatible('socialnetwork', 'OnSendMentionGetEntityFields', 'CListsLiveFeed', 'OnSendMentionGetEntityFields')
	->registerCompatible('socialnetwork', 'OnSocNetGroupDelete', 'CListsLiveFeed', 'OnSocNetGroupDelete')
	->registerCompatible('rest', 'onRestServiceBuildDescription', '\Bitrix\Lists\Rest\RestService', 'onRestServiceBuildDescription')
	->registerCompatible('iblock', 'OnAfterIBlockElementDelete', 'CLists', 'OnAfterIBlockElementDelete')
	->registerCompatible('iblock', 'OnAfterIBlockPropertyAdd', 'CLists', 'OnAfterIBlockPropertyAdd')
	->registerCompatible('iblock', 'OnAfterIBlockPropertyUpdate', 'CLists', 'OnAfterIBlockPropertyUpdate')
	->registerCompatible('iblock', 'OnAfterIBlockPropertyDelete', 'CLists', 'OnAfterIBlockPropertyDelete')
	->registerCompatible('iblock', 'OnBeforeIBlockElementAdd', 'CLists', 'OnBeforeIBlockElementAdd')
	->registerCompatible('iblock', 'OnBeforeIBlockElementUpdate', 'CLists', 'OnBeforeIBlockElementUpdate')
	->registerCompatible('main', 'OnGetRatingContentOwner', '\Bitrix\Lists\Integration\Main\RatingVote', 'onGetRatingContentOwner')
	->registerCompatible('im', 'OnGetNotifySchema', \Bitrix\Lists\Integration\Im\NotifySchema::class, 'onGetNotifySchema')
	->register('socialnetwork', 'onLogIndexGetContent', '\Bitrix\Lists\Integration\Socialnetwork\Log', 'onIndexGetContent')
	->register('bizproc', 'onGetDocumentType', \Bitrix\Lists\Internal\Integration\Bizproc\EventHandlers\OnGetDocumentTypes\GetDocumentTypes::class, 'onGetDocumentType')
;
