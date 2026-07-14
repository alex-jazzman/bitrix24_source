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
if (!$isFrame)
{
	$APPLICATION->SetTitle('');
	$APPLICATION->SetPageProperty('BodyClass', 'no-all-paddings no-background');
	Toolbar::deleteFavoriteStar();

	$isRestricted = !Feature::isFeatureEnabled(Feature::PROJECTS_GROUPS) && !Feature::canTurnOnTrial(Feature::PROJECTS_GROUPS);

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

	$pathToList = Path::get('workgroups_page')

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
