<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */

use Bitrix\Main\UI\Extension;
use Bitrix\Socialnetwork\Helper\Feature;
use Bitrix\Socialnetwork\Helper\Path;
use Bitrix\Socialnetwork\V2\Public\Provider\ProjectProvider;
use Bitrix\UI\Toolbar\Facade\Toolbar;

$groupId = (int)($arResult['VARIABLES']['group_id'] ?? 0);

$projectProvider = new ProjectProvider();
if (!$projectProvider->isProject($groupId))
{
	return false;
}

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$isFrame = $request->get('IFRAME') === 'Y';
if ($isFrame && ($allowProjectNavigationInFrame ?? false) !== true)
{
	return false;
}

$isRestricted = !Feature::isFeatureEnabled(Feature::PROJECTS_GROUPS, $groupId)
	&& !Feature::canTurnOnTrial(Feature::PROJECTS_GROUPS)
;

if ($isFrame)
{
	if (!$isRestricted)
	{
		Extension::load('im.public');
	}

	?>
	<script>
		top.BX.ready(function() {
			const navigateToProject = () => {
				<?php if ($isRestricted): ?>
				top.BX.UI.FeaturePromotersRegistry
					.getPromoter({ featureId: 'socialnetwork_projects_groups' })
					.show()
				;
				<?php else: ?>
				top.BX.Messenger.v2.Lib.Messenger.openCollab('sg<?= $groupId ?>');
				<?php endif ?>
			};
			const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider && slider.close(true, navigateToProject))
			{
				return;
			}

			navigateToProject();
		});
	</script>
	<?php

	return true;
}

if (!$isFrame)
{
	$APPLICATION->SetTitle('');
	$APPLICATION->SetPageProperty('BodyClass', 'no-all-paddings no-background');
	Toolbar::deleteFavoriteStar();

	if ($isRestricted)
	{
		?>
		<script>
			BX.ready(function() {
				BX.UI.FeaturePromotersRegistry.getPromoter({ featureId: 'socialnetwork_projects_groups' }).show();
			});
		</script>
		<?php

		return true;
	}

	Extension::load('im.public');

	$pathToList = Path::get('workgroups_page');

	?>
	<script>
		BX.ready(function() {
			BX.Event.EventEmitter.subscribeOnce('onChatSliderClose', () => {
				location.href = '<?=CUtil::JSEscape($pathToList)?>';
			});
			BX.Messenger.v2.Lib.Messenger.openCollab('sg<?= $groupId?>');
		});
	</script>
	<?php

	return true;
}

return false;
