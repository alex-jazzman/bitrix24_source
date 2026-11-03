<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load(['ui.design-tokens']);

/**
 * @var array $arParams
 * @global CMain $APPLICATION
 */
$url = $arParams['URL'];
$pageNum = isset($arParams['PAGE_NUM']) ? $arParams['PAGE_NUM'] : 1;
$enableNextPage = isset($arParams['ENABLE_NEXT_PAGE']) ? $arParams['ENABLE_NEXT_PAGE'] : false;
$enableLastPage = array_key_exists('ENABLE_LAST_PAGE', $arParams) ? $arParams['ENABLE_LAST_PAGE'] : true;

$hasPageLinks = $pageNum > 1 || $enableNextPage;
$titleId = 'tasks-page-navigation-title-'.$this->randString();
$titleIdAttr = $hasPageLinks ? ' id="'.$titleId.'"' : '';
$openingTag = $hasPageLinks
	? '<nav class="modern-page-navigation" aria-labelledby="'.$titleId.'" data-testid="tasks-pagination">'
	: '<div class="modern-page-navigation" data-testid="tasks-pagination">';
$closingTag = $hasPageLinks ? '</nav>' : '</div>';

$pageUrl = static function($page) use ($url)
{
	return htmlspecialcharsbx(\Bitrix\Tasks\Util\Url::AddUrlParams($url, array('page' => $page)));
};

$ariaLabelAttr = static function($phraseId, $replace = null)
{
	$label = (string)GetMessage($phraseId, $replace);
	return $label === '' ? '' : ' aria-label="'.htmlspecialcharsbx($label).'"';
};
?><?=$openingTag?>
	<span class="modern-page-title"<?=$titleIdAttr?>><?=GetMessage("TASKS_PAGE_NAVIGATION_PAGES")?></span><?

	if($pageNum > 1):
		$firstNavPage = ($pageNum <= 11 ? 1 : ($pageNum - 10));
		if($firstNavPage !== 1):
			?><a class="modern-page-previous" href="<?=$pageUrl(1)?>"<?=$ariaLabelAttr("TASKS_PAGE_NAVIGATION_FIRST_PAGE")?> data-testid="tasks-pagination-first"><?=GetMessage("TASKS_PAGE_NAVIGATION_FIRST")?></a><?
		endif;
		?><a class="modern-page-previous" href="<?=$pageUrl($pageNum - 1)?>"<?=$ariaLabelAttr("TASKS_PAGE_NAVIGATION_PREV_PAGE")?> data-testid="tasks-pagination-prev"><?=GetMessage("TASKS_PAGE_NAVIGATION_PREV")?></a><?
		for($i = $firstNavPage; $i < $pageNum; $i++):
			$pageLabelAttr = $ariaLabelAttr("TASKS_PAGE_NAVIGATION_PAGE_NUMBER", array('#NUMBER#' => $i));
			if($i === $firstNavPage):
				?><a class="modern-page-first" href="<?=$pageUrl($i)?>"<?=$pageLabelAttr?> data-testid="tasks-pagination-page"><?=$i?></a><?
			else:
				?><a href="<?=$pageUrl($i)?>"<?=$pageLabelAttr?> data-testid="tasks-pagination-page"><?=$i?></a><?
			endif;
		endfor;
	endif;

	$currentPageClass = $pageNum === 1 ? "modern-page-first modern-page-current" : "modern-page-current";

	if($hasPageLinks):
		?><a class="<?=$currentPageClass?>" href="<?=$pageUrl($pageNum)?>" aria-current="page"<?=$ariaLabelAttr("TASKS_PAGE_NAVIGATION_PAGE_NUMBER", array('#NUMBER#' => $pageNum))?> data-testid="tasks-pagination-current"><?=$pageNum?></a><?
	else:
		?><span class="<?=$currentPageClass?>" data-testid="tasks-pagination-current"><?=$pageNum?></span><?
	endif;

	if($enableNextPage):
		?><a class="modern-page-next" href="<?=$pageUrl($pageNum + 1)?>"<?=$ariaLabelAttr("TASKS_PAGE_NAVIGATION_NEXT_PAGE")?> data-testid="tasks-pagination-next"><?=GetMessage("TASKS_PAGE_NAVIGATION_NEXT")?></a><?
		if($enableLastPage):
		?><a class="modern-page-last" href="<?=$pageUrl(-1)?>"<?=$ariaLabelAttr("TASKS_PAGE_NAVIGATION_LAST_PAGE")?> data-testid="tasks-pagination-last"><?=GetMessage("TASKS_PAGE_NAVIGATION_LAST")?></a><?
		endif;
	endif;

?><?=$closingTag?><?
