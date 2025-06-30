<?php

namespace Bitrix\BIConnector\Superset\Grid\Row\Assembler\Field\Dashboard;

use Bitrix\BIConnector\Superset\Grid\Settings\DashboardSettings;
use Bitrix\Main\Grid\Row\FieldAssembler;
use Bitrix\Main\Localization\Loc;

/**
 * @method DashboardSettings getSettings()
 */
class GroupFieldAssembler extends FieldAssembler
{
	protected function prepareColumn($value)
	{
		if (empty($value) || !is_array($value))
		{
			return '';
		}

		$hintMore = null;
		if (count($value) > 3)
		{
			$groupsToShow = array_slice($value, 0, 2);
			$groupsToHide = array_slice($value, 2);

			$shownPart = htmlspecialcharsbx(
				implode(', ', $groupsToShow)
				. ' ',
			);
			$hiddenPart = htmlspecialcharsbx(implode(', ', $groupsToHide));
			$hintMoreText = Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_GROUP_MORE', [
				'#COUNT#' => count($groupsToHide),
			]);
			$hintMore = <<<HTML
				<span
					data-hint="{$hiddenPart}" 
					data-hint-no-icon
					data-hint-interactivity
					data-hint-center
					class="biconnector-grid-scope-hint-more"
				>
					$hintMoreText
				</span>
				HTML;
		}
		else
		{
			$shownPart = htmlspecialcharsbx(implode(', ', $value));
		}

		return <<<HTML
			<span>
				{$shownPart}
				{$hintMore}
			</span>
		HTML;
	}
}
