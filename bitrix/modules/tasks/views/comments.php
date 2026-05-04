<?php

/**
 * @global CMain $APPLICATION
 */

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Tasks\Integration\Forum\Task\Comment;
use Bitrix\Tasks\V2\Public\Service\LinkService;
use Bitrix\UI\Toolbar;

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");

if (
	!Loader::includeModule('tasks')
	|| !Loader::includeModule('ui')
	|| !Loader::includeModule('forum')
)
{
	echo 'Module not found';
}

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$taskId = (int)$request->get('taskId');
if ($taskId <= 0)
{
	echo 'Task not found';
}

$extensionList = [
	'ui.sidepanel',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.tooltip',
	'ui.viewer',
	'ui.hint',
];

if (Loader::includeModule('disk'))
{
	Asset::getInstance()->addJs('/bitrix/components/bitrix/disk.uf.file/templates/.default/script.js');

	$extensionList = [
		...$extensionList,
		'ajax',
		'core',
		'disk_external_loader',
		'disk.document',
		'disk.viewer.document-item',
		'disk.viewer.board-item',
		'disk.viewer.actions',
		'loader',
	];
}

Extension::load($extensionList);

if ($request->get('IFRAME') === 'Y')
{
	Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/tasks/lib/V2/Infrastructure/Controller/LegacyComment.php');

	$manager = Toolbar\Manager::getInstance();
	$toolbar = $manager->getToolbarById(Toolbar\Facade\Toolbar::DEFAULT_ID) ?: $manager->createToolbar(Toolbar\Facade\Toolbar::DEFAULT_ID, []);

	$toolbar->deleteFavoriteStar();
	$toolbar->setTitle((string)Loc::getMessage('TASKS_IM_TASK_PANEL_PREVIOUS_COMMENTS'));

	$APPLICATION->includeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:forum.comments',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [
				'FORUM_ID' => Comment::getForumId(),
				'ENTITY_TYPE' => "TK",
				'ENTITY_ID' => $taskId,
				'ENTITY_XML_ID' => 'TASK_' . $taskId,
				'PUBLIC_MODE' => true,
				'SHOW_RATING' => 'N',
				'SHOW_POST_FORM' => 'N',
				'URL_TEMPLATES_PROFILE_VIEW' => "/company/personal/user/#user_id#/",
			],
			'IFRAME_MODE' => true,
			'USE_UI_TOOLBAR' => 'Y',
		]
	);
}
else
{
	$userId = (int)CurrentUser::get()->getId();

	$linkService = new LinkService();

	$commentsPath = $linkService->getForumComments($taskId);
	$listPath = $linkService->getListTask($userId);

	?>
	<script>
		BX.ready(function() {
			BX.SidePanel.Instance.open('<?= $commentsPath ?>', {
				events: {
					onCloseComplete: function() {
						location.href = '<?= $listPath ?>';
					},
				},
			});
		});
	</script>
	<?php

}

require $_SERVER["DOCUMENT_ROOT"] . '/bitrix/footer.php';
