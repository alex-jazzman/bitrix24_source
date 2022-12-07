<?
if (!check_bitrix_sessid())
	return;

IncludeModuleLangFile(__FILE__);
$moduleId = 'sotbit.restapi';
?>
<style>
	@font-face{
		font-family: 'Open Sans';
		src: url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans.eot');
		src: url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans.eot?iefix') format('eot'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans.woff') format('woff'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans.ttf') format('truetype'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans.svg#webfont') format('svg');
		font-weight: normal;
		font-style: normal;
	}
	@font-face{
		font-family: 'Open Sans';
		src: url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans-Bold.eot');
		src: url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans-Bold.eot?iefix') format('eot'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans-Bold.woff') format('woff'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans-Bold.ttf') format('truetype'),
		url('/bitrix/themes/.default/<?=$moduleId?>/fonts/OpenSans/OpenSans-Bold.svg#webfont') format('svg');
		font-weight: bold;
		font-style: normal;
	}

	.data-collection-wrapper
	{
		display:flex;
		justify-content:space-between;
	}

	.data-collection-left
	{
		width:550px;
	}
	.data-collection-right
	{
		border:1px solid #535b6b;
		border-radius:3px;
		width:410px;
		margin-left:40px;
		padding-bottom:20px;
		background: #FFFFFF;
	}

	.data-collection-left__top-text
	{
		font-family:'Open Sans';
		font-size:13px;
		color:#7f848f;
		margin-bottom:30px;
	}
	.data-collection-wrapper .wizard-input-title
	{
		font-family:'Open Sans';
		font-size:14px;
		color:#535b6b;
	}

	.data-collection-left__bottom-text
	{
		font-family:'Open Sans';
		font-size:13px;
		color:#7f848f;
	}

	.data-collection-wrapper .wizard-field
	{
		width:calc(100% - 30px);
	}


	.data-collection-left__bottom-text a
	{
		color:#000;
		margin-top:20px;
		margin-bottom: 20px;
	}

	.data-collection-right__avatar
	{
		text-align:center;
		margin-top:18px;
		margin-bottom:18px;
	}

	.data-collection-right__personal-manager
	{
		text-align:center;
		font-family:'Open Sans';
		font-size:13px;
		color:#7f848f;
		margin-bottom:5px;
	}

	.data-collection-right__personal-manager-name
	{
		text-align:center;
		color:#040000;
		font-family:'Open Sans';
		font-weight:bold;
		font-size:16px;
		margin-bottom:30px;
		background: #ffffff;
	}

	.data-collection-right__plusses li
	{
		font-family:'Open Sans';
		font-size:13px;
		color:#535b6b;
		margin-bottom:15px;
		padding-left:25px;
		background-image:url('/bitrix/themes/.default/<?=$moduleId?>/images/plus.png');
		background-repeat: no-repeat;
		list-style:none;
		background-position:0 4px;
	}
	.wizard-field {
		background: #ffffff!important;
		border: 1px solid #c6c9ce!important;
		-webkit-box-shadow: inset 0 1px 3px rgba(0,0,1,.18)!important;
		box-shadow: inset 0 1px 3px rgba(0,0,1,.18)!important;
		border-radius: 3px!important;
		font-family: 'Open Sans', Helvetica, Arial, sans-serif!important;
		font-size: 16px!important;
		font-weight: bold!important;
		height: 41px!important;
		outline: none!important;
		padding: 0 15px!important;
		width: 558px!important;
	}
	.wizard-input-form-block
	{
		margin-bottom:30px;
	}
	.error-message
	{
		color:red;
	}
</style>
<script>
	function showError(container, errorMessage) {
		var msgElem = document.createElement('span');
		msgElem.className = "error-message";
		msgElem.innerHTML = errorMessage;
		container.appendChild(msgElem);
	}

	function resetError(container) {
		if (container.lastChild.className == "error-message") {
			container.removeChild(container.lastChild);
		}
	}

	function validate(form) {
		var elems = form.elements;
		var error = false;
		resetError(elems.Name.parentNode);
		if (!elems.Name.value) {
			error = true;
			showError(elems.Name.parentNode, ' <?=GetMessage("error_name")?>');
		}
		resetError(elems.Email.parentNode);
		if (!elems.Email.value) {
			error = true;
			showError(elems.Email.parentNode, ' <?=GetMessage("error_email")?>');
		}
		if(elems.Email.value)
		{
			var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
			var email = elems.Email.value;
			if(reg.test(email) == false)
			{
				error = true;
				showError(elems.Email.parentNode, ' <?=GetMessage("error_email_wrong")?>');
			}
		}

		resetError(elems.Phone.parentNode);
		if (!elems.Phone.value) {
			error = true;
			showError(elems.Phone.parentNode, ' <?=GetMessage("error_phone")?>');
		}
		if(elems.Phone.value)
		{
			var reg = /^[0-9()+-\s]+$/;
			var phone = elems.Phone.value;
			if(reg.test(phone) == false)
			{
				error = true;
				showError(elems.Phone.parentNode, ' <?=GetMessage("error_phone_wrong")?>');
			}
		}
		if(error == false)
		{
			form.submit();
		}
	}
</script>
<form action="<?echo $APPLICATION->GetCurPage(); ?>">
	<?echo bitrix_sessid_post(); ?>
	<input type="hidden" name="lang" value="<?echo LANG ?>">
	<input type="hidden" name="step" value="1">
	<input type="hidden" name="id" value="<?=$moduleId?>">
	<input type="hidden" name="install" value="Y">
	<div class="data-collection-wrapper">
		<div class="data-collection-left">
			<div class="data-collection-left__top-text"><?=GetMessage("wiz_datacollection_top_text")?></div>
			<div class="wizard-input-form-block">
				<label for="dataCollectionName" class="wizard-input-title"><?=GetMessage("wiz_datacollection_name")?></label><br>
				<input type="text" name="Name" value="" class="wizard-field" id="dataCollectionName">
			</div>
			
			<div class="wizard-input-form-block">
				<label for="dataCollectionEmail" class="wizard-input-title"><?=GetMessage("wiz_datacollection_email")?></label><br>
				<input type="email" name="Email" value="" class="wizard-field" id="dataCollectionEmail">
			</div>
			
			<div class="wizard-input-form-block">
				<label for="dataCollectionPhone" class="wizard-input-title"><?=GetMessage("wiz_datacollection_phone")?></label><br>
				<input type="tel" name="Phone" value="" class="wizard-field" id="dataCollectionPhone" pattern="^[0-9
				()+\s]+$">
			</div>
			<div class="data-collection-left__bottom-text"><?=GetMessage("wiz_datacollection_bottom_text")?></div>
		</div>
		<div class="data-collection-right">
			<div class="data-collection-right__avatar">
				<img class="data-collection-right__avatar-img" src="/bitrix/themes/.default/<?=$moduleId?>/images/manager.png">
			</div>
			<div class="data-collection-right__personal-manager"><?=GetMessage("wiz_datacollection_personal_manager")?></div>
			<div class="data-collection-right__personal-manager-name"><?=GetMessage("wiz_datacollection_personal_manager_name")?></div>
			<ul class="data-collection-right__plusses">
				<li><?=GetMessage("wiz_datacollection_plus1")?></li>
				<li><?=GetMessage("wiz_datacollection_plus2")?></li>
				<li><?=GetMessage("wiz_datacollection_plus3")?></li>
			</ul>
		</div>
	</div>
	<input type="button" name="" onclick="validate(this.form)" value="<?echo GetMessage("APPLY"); ?>">
<form>