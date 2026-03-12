<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

/** @var array $arResult */
/** @var CMain $APPLICATION */

use Bitrix\Main\Localization\Loc;

$APPLICATION->SetTitle(Loc::getMessage('REST_MARKETPLACE_SOLUTION_SMART_ROBOTS_TITLE'));

?>

<div class="rest-market-solution-section">
	<div class="rest-market-solution-main">
		<div class="rest-market-solution-main__banner rest-market-solution-main__banner--<?= $arResult['CURRENT_LANG'] === 'ru' ? 'ru' : 'other' ?>">
			<div class="rest-market-solution-main__banner-wrapper">
				<div class="rest-market-solution-main__banner-title">
					<?= Loc::getMessage("REST_MARKETPLACE_SOLUTION_SMART_ROBOTS_BANNER_TITLE") ?>
				</div>
				<div class="rest-market-solution-main__banner-description">
					<?=
					$arResult['IS_RENAMED_MARKET']
						? Loc::getMessage('REST_MARKETPLACE_SOLUTION_SMART_ROBOTS_BANNER_DESCRIPTION_MSGVER_1')
						: Loc::getMessage("REST_MARKETPLACE_SOLUTION_SMART_ROBOTS_BANNER_DESCRIPTION")
					?>
				</div>
				<div class="rest-market-solution-main__banner-action">
					<a href="/market/category/vertical_smart_scripts/"
					   class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps">
						<span class="ui-btn-text">
							<span class="ui-btn-text-inner">
								<?= Loc::getMessage("REST_MARKETPLACE_SOLUTION_SMART_ROBOTS_BANNER_ACTION") ?>
							</span>
						</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>