<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

$APPLICATION->SetTitle(Loc::getMessage('VOTE_ATTACHED_RESULT_COMPONENT_TITLE'));
\Bitrix\Main\UI\Extension::load([
	'ui.common',
	'vote.attached-result',
]);

$downloadButton = \Bitrix\UI\Buttons\Button::create()
   ->setTag(\Bitrix\UI\Buttons\Tag::LINK)
   ->setLink($arResult['VOTE']['attach']['downloadUrl'] ?? '')
   ->setText(Loc::getMessage('VOTE_ATTACHED_RESULT_EXPORT'))
   ->setColor(\Bitrix\UI\Buttons\Color::PRIMARY)
;

$containerId = 'vote-attach-result-container';
?>
<div id="<?= htmlspecialcharsbx($containerId) ?>">...</div>
<script>
	const voteData = <?= \Bitrix\Main\Web\Json::encode($arResult['VOTE'] ?? null) ?>;
	const container = document.getElementById('<?= CUtil::JSescape($containerId )?>');
	const ext = (new BX.Vote.VoteAttachedResult({
		votedPageSize: <?= (int)($arResult['VOTED_PAGE_SIZE'] ?? 10) ?>,
	}));
	ext.renderTo(voteData, container);
</script>

<?php
$APPLICATION->IncludeComponent('bitrix:ui.button.panel', '', [
	'ALIGN' => 'left',
	'BUTTONS' => [
		[
			'TYPE' => 'custom',
			'LAYOUT' => $downloadButton->render(),
		],
	]
]);
?>