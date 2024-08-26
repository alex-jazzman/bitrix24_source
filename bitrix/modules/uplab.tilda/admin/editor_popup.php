<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Context;
use Uplab\Tilda\Common;
use Bitrix\Main\Localization\Loc;

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php");

// Получаем список проектов
Loader::includeModule("uplab.tilda");
$arProjects = Common::getAssocProjectsList();

if (!$arProjects) {
	echo GetMessage("uplab.tilda_NO_PROJECTS") . " <a href=\"" . SITE_DIR . "/bitrix/admin/settings.php?lang=" . LANGUAGE_ID . "&mid=uplab.tilda\">" . GetMessage("uplab.tilda_NO_KEYS") . "</a>";
	return false;
}

// Рисуем форму
?>
	<form id="page_select_form">
		<table class="bxcompprop-content-table">
			<tr class="bxcompprop-prop-tr">
				<td class="bxcompprop-cont-table-title" colspan="2"><?= Loc::getMessage("uplab.tilda_PAGE_SELECT"); ?></td>
			</tr>
			<tr class="bxcompprop-prop-tr">
				<td class="bxcompprop-cont-table-l"><label class="bxcompprop-label" for="projects_select"><?= Loc::getMessage("uplab.tilda_SELECT_PROJECT"); ?></label></td>
				<td class="bxcompprop-cont-table-r">
					<select size="1" name="PROJECT" id="projects_select">
						<? foreach ($arProjects as $key => $value) { ?>
							<option value="<?= $key ?>"><?= $value ?></option>
						<? } ?>
					</select>
				</td>
			</tr>
			<tr class="bxcompprop-prop-tr">
				<td class="bxcompprop-cont-table-l"><label class="bxcompprop-label" for=""><?= Loc::getMessage("uplab.tilda_SELECT_PAGE"); ?></label></td>
				<td class="bxcompprop-cont-table-r">
					<? $j = 0; ?>
					<? foreach ($arProjects as $key => $value) { ?>
						<? $j++; ?>
						<? $arPages = Common::getAssocPagesList($key); ?>

						<select size="1" name="PAGE_<?= $key ?>" id="page_select_<?= $key ?>" class="js-project-page" style="max-width: 453px; <?= ($j == 1) ? "" : "display: none;" ?>">
							<? foreach ($arPages as $id => $name) { ?>
								<option value="<?= $id ?>"><?= $name ?></option>
							<? } ?>
						</select>

					<? } ?>
				</td>
			</tr>

			<tr class="bxcompprop-prop-tr">
				<td class="bxcompprop-cont-table-l">
					<label class="bxcompprop-label" for="">
						<?= Loc::getMessage("uplab.tilda_NO_TEMPLATE"); ?>
					</label>
				</td>
				<td class="bxcompprop-cont-table-r">
					<input type="checkbox" name="STOP_CACHE" id="template_checkbox" class="adm-designed-checkbox">
					<label class="adm-designed-checkbox-label" for="template_checkbox" title=""></label>
				</td>
			</tr>

			<tr class="bxcompprop-prop-tr">
				<td class="bxcompprop-cont-table-l">
					<label class="bxcompprop-label" for="">
						<?= Loc::getMessage("uplab.tilda_NO_JQ"); ?>
					</label>
				</td>
				<td class="bxcompprop-cont-table-r">
					<input type="checkbox" name="no_jq" id="no_jq_checkbox" class="adm-designed-checkbox">
					<label class="adm-designed-checkbox-label" for="no_jq_checkbox" title=""></label>
				</td>
			</tr>

			<tr>
				<td colspan="2" class="bxcompprop-last-empty-cell" style="height: 119px;"></td>
			</tr>
		</table>
	</form>

	<script type="text/javascript">
        // Рисуем кнопки Сохранить и Закрыть
        BX.WindowManager.Get().SetButtons([BX.CDialog.prototype.btnSave, BX.CDialog.prototype.btnCancel]);

        // Показываем только селект со страницы выбранного проекта
        $(function () {
            $("select[name=PROJECT]").on("change", function () {
                var $this = $(this);
                var project = $this.val();

                $(".js-project-page")
                    .hide()
                    .filter('[name="PAGE_' + project + '"]')
                    .show();
            });
        });
	</script>
<?
// Если данные выбраны и получены закрываем окно и подставляем тэг
$request = Context::getCurrent()->getRequest();
if ($request->get("PROJECT") && $request->get("STOP_CACHE")) {
	$project = $request->get("PROJECT");
	$page = $request->get("PAGE_" . $request->get("PROJECT"));
	$show_template = $request->get("STOP_CACHE");
	$no_jq = $request->get("no_jq");

	$tagStr = "UPLABTILDA PROJECT={$project} PAGE={$page}";

	if ($show_template == "Y") {
		$tagStr .= " HIDEPAGETEMPLATE=Y";
	}

	if ($no_jq == "Y") {
		$tagStr .= " NOJQ=Y";
	}

	?>
	<script>
        // Закрываем окно
        BX.WindowManager.Get().AllowClose();
        BX.WindowManager.Get().Close();

        // Вставляем строку в визуальный редактор
        window.tildaTag('[' + '<?= $tagStr ?>' + ']');
	</script>
	<?
}
?>

<? require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_after.php");
