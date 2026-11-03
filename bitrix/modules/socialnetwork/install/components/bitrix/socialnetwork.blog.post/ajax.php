<?php

use Bitrix\Main\Web\Uri;
use Bitrix\Main\Loader;
use Bitrix\Blog\Item\Post;
use Bitrix\Blog\Item\Permissions;
use Bitrix\Socialnetwork\Livefeed\BlogPost;
use Bitrix\Socialnetwork\ComponentHelper;

define("PUBLIC_AJAX_MODE", true);
define("NO_KEEP_STATISTIC", "Y");
define("NO_AGENT_STATISTIC","Y");
define("NO_AGENT_CHECK", true);
define("DisableEventsCheck", true);

$siteId = (isset($_POST["siteId"]) && is_string($_POST["siteId"])) ? trim($_POST["siteId"]): "";
$siteId = mb_substr(preg_replace("/[^a-z0-9_]/i", "", $siteId), 0, 2);

$action = (isset($_POST["action"]) && is_string($_POST["action"])) ? trim($_POST["action"]): "";
$postId = (isset($_POST["postId"]) ? intval($_POST["postId"]) : false);
$isPublicPage = (isset($_POST["public"]) && $_POST["public"] == 'Y');
$isMobile = (isset($_POST["mobile"]) && $_POST["mobile"] == 'Y');
$isGroupReadOnly = (isset($_POST["group_readonly"]) && $_POST["group_readonly"] == 'Y');
$pathToPost = ($_POST["pathToPost"] ?? '');
$voteId = (isset($_POST["voteId"]) ? intval($_POST["voteId"]) : false);

define("SITE_ID", $siteId);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

/** @global CUser $USER */
/** @global CMain $APPLICATION */

header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

if (!in_array($action, array("get_data")))
{
	echo CUtil::phpToJsObject(Array('ERROR' => 'INCORRECT_ACTION'));
	die();
}

if (
	!Loader::includeModule('socialnetwork')
	|| !Loader::includeModule('blog')
)
{
	echo CUtil::phpToJsObject(Array('ERROR' => 'MODULE_NOT_INSTALLED'));
	die();
}

if (intval($postId) <= 0)
{
	echo CUtil::phpToJsObject(Array('ERROR' => 'EMPTY POST ID'));
	die();
}

if (!check_bitrix_sessid())
{
	echo CUtil::phpToJsObject(Array('ERROR' => 'SESSION_ERROR'));
	die();
}

$userId = $USER->getID();

$postItem = Post::getById($postId);
if (!$postItem)
{
	echo CUtil::phpToJsObject(Array('ERROR' => 'POST NOT FOUND'));
	die();
}
$post = $postItem->getFields();

if ($action == 'get_data')
{
	$logFavoritesUserId = $logId = false;
	$blogPostLivefeedProvider = new BlogPost;

	$filter = array(
		"EVENT_ID" => $blogPostLivefeedProvider->getEventId(),
		"SOURCE_ID" => $postId,
	);

	if (
		Loader::includeModule('extranet')
		&& CExtranet::isExtranetSite($siteId)
	)
	{
		$filter["SITE_ID"] = $siteId;
	}
	elseif (!$isPublicPage)
	{
		$filter["SITE_ID"] = array($siteId, false);
	}

	$res = CSocNetLog::getList(
		array(),
		$filter,
		false,
		false,
		array("ID", "FAVORITES_USER_ID")
	);

	if ($logEntry = $res->fetch())
	{
		$logId = $logEntry["ID"];
		$logFavoritesUserId = $logEntry["FAVORITES_USER_ID"];
	}

	if($post["AUTHOR_ID"] == $userId)
	{
		$perms = Bitrix\Blog\Item\Permissions::FULL;
	}
	else
	{
		if (!$logId)
		{
			$perms = Permissions::DENY;
		}
		elseif (
			CSocNetUser::isCurrentUserModuleAdmin($siteId, !$isMobile)
			|| $APPLICATION->getGroupRight("blog") >= "W"
		)
		{
			$perms = Permissions::FULL;
		}
		else
		{
			$permsResult = $postItem->getSonetPerms(array(
				"PUBLIC" => $isPublicPage,
				"CHECK_FULL_PERMS" => true,
				"LOG_ID" => $logId
			));
			$perms = $permsResult['PERM'];
			$isGroupReadOnly = (
				$permsResult['PERM'] <= Permissions::READ
				&& $permsResult['READ_BY_OSG']
			);
		}
	}

	$isShareForbidden = ComponentHelper::getBlogPostLimitedViewStatus(array(
		'logId' => intval($logId),
		'postId' => intval($postId),
		'authorId' => $post["AUTHOR_ID"]
	));

	$postUrl = CComponentEngine::makePathFromTemplate(
		$pathToPost,
		array(
			"post_id" => $post["ID"],
			"user_id" => $post["AUTHOR_ID"]
		)
	);

	$voteExportUrl = '';

	if ($voteId)
	{
		$voteExportUrl = (string)(new Uri($postUrl))->addParams(["exportVoting" => $voteId]);
	}

	header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);
	echo CUtil::phpToJSObject(array(
		'perms' => $perms,
		'isGroupReadOnly' => ($isGroupReadOnly ? 'Y' : 'N'),
		'isShareForbidden' => ($isShareForbidden ? 'Y' : 'N'),
		'logId' => intval($logId),
		'logFavoritesUserId' => intval($logFavoritesUserId),
		'authorId' => intval($post["AUTHOR_ID"]),
		'urlToPost' => $postUrl,
		'urlToVoteExport' => $voteExportUrl
	));
	die();
}

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
