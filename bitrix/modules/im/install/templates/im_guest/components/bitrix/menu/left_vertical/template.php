<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\UI\Counter\Counter;
use Bitrix\UI\Counter\CounterSize;

Loc::loadMessages(__FILE__);

if (empty($arResult['ITEMS']['show']))
{
	return;
}

$siteUrl = htmlspecialcharsbx(SITE_DIR);
?>

<nav aria-label="<?= Loc::getMessage('IM_GUEST_MENU_NAV_LABEL') ?>"
	 class="menu-items-block menu-items-view-mode"
	 id="menu-items-block"
>
	<div class="menu-items-header">
		<div class="menu-items-header__menu-swticher">
			<button type="button" class="menu-switcher">
				<span class="menu-switcher__icon"></span>
			</button>
		</div>
		<a href="<?= $siteUrl ?>" class="menu-items-header__logo">
			<span class="menu-items-header__logo-text">
				<?= Loc::getMessage('IM_GUEST_MENU_LOGO_TEXT') ?>
			</span>
			<span class="menu-items-header__logo-number">24</span>
		</a>
	</div>

	<div class="menu-items-body">
		<div class="menu-items-body-inner">
			<ul class="menu-items">
			<?php foreach ($arResult['ITEMS']['show'] as $item):
				$itemId = $item['PARAMS']['menu_item_id'];
				$counterId = $item['PARAMS']['counter_id'] ?? '';
				$counterValue = 0;
				if ($counterId !== '' && isset($arResult['COUNTERS'][$counterId]))
				{
					$counterValue = (int)$arResult['COUNTERS'][$counterId];
				}

				$itemClass = 'menu-item-block ' . str_replace('_', '-', $itemId);
				if ($counterValue > 0)
				{
					$itemClass .= ' menu-item-with-index';
				}

				$link = isset($item['LINK']) && is_string($item['LINK'])
					? $item['LINK']
					: ''
				;
			?>
				<li id="bx_left_menu_<?= $itemId ?>"
					class="<?= $itemClass ?>"
					data-id="<?= htmlspecialcharsbx($itemId) ?>"
					data-counter-id="<?= htmlspecialcharsbx($counterId) ?>"
					data-link="<?= htmlspecialcharsbx($link) ?>"
				>
					<a class="menu-item-link"
					   href="<?= htmlspecialcharsbx($link) ?>"
					>
						<span class="menu-item-icon-box">
							<span class="menu-item-icon"></span>
						</span>
						<span class="menu-item-link-text" data-role="item-text">
							<?= htmlspecialcharsbx($item['TEXT']) ?>
						</span>
						<?php if ($counterId !== ''):
							$counter = new Counter(
								useAirDesign: true,
								value: $counterValue,
								size: CounterSize::SMALL,
								id: 'menu-counter-' . mb_strtolower($counterId),
								hideIfZero: true,
							);
						?>
							<span class="menu-item-index-wrap">
								<?= $counter->render() ?>
							</span>
						<?php endif; ?>
					</a>
				</li>
			<?php endforeach; ?>
			</ul>
		</div>
	</div>
</nav>
