<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFolder */
/** @var \Bitrix\Disk\Internals\BaseComponent $component */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Loc::loadMessages(__FILE__);

Extension::load([
	'ui.design-tokens',
	'ui.icon-set.outline',
]);

$crumbs = $arResult['BREADCRUMBS'];
array_unshift($crumbs, $arResult['BREADCRUMBS_ROOT']);

// MAX_BREADCRUMBS_TO_SHOW is not applied here: this template has no dropdown to reach collapsed crumbs.
$lastIndex = count($crumbs) - 1;

$navClass = 'disk-breadcrumbs-air';
if ($arParams['CLASS_NAME'] !== '')
{
	$navClass .= ' ' . $arParams['CLASS_NAME'];
}
?>
<nav
	class="<?= htmlspecialcharsbx($navClass) ?>"
	aria-label="<?= htmlspecialcharsbx(Loc::getMessage('DISK_BREADCRUMBS_AIR_NAV_LABEL')) ?>"
	data-testid="disk-breadcrumbs"
>
	<ol class="disk-breadcrumbs-air__list">
		<?php foreach ($crumbs as $index => $crumb): ?>
			<?php $isCurrent = ($index === $lastIndex); ?>
			<li class="disk-breadcrumbs-air__item">
				<a
					class="disk-breadcrumbs-air__link<?= $isCurrent ? ' --current' : '' ?>"
					href="<?= htmlspecialcharsbx($crumb['ENCODED_LINK']) ?>"
					data-testid="disk-breadcrumbs-item"
					<?= $isCurrent ? 'aria-current="page"' : '' ?>
				><?= htmlspecialcharsbx($crumb['NAME']) ?></a>
				<?php if (!$isCurrent): ?>
					<span
						class="disk-breadcrumbs-air__separator ui-icon-set --chevron-right-s"
						aria-hidden="true"
					></span>
				<?php endif; ?>
			</li>
		<?php endforeach; ?>
	</ol>
</nav>
