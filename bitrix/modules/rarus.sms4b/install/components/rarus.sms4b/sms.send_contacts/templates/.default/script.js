$(document).ready(function(){
	//проверка после сабмита
	$("form[name=send_contacts]").submit(function(){
		if($("input[name=contact_number]").attr("value") == your_number || $("input[name=contact_number]").val().length==0)
		{
			alert(enter_number);
			return false;
		}
		else
		{
			validationResult = validateNumber($("input[name=contact_number]").val());
			if(validationResult.length!=0)
			{
				alert(validationResult);
				return false;
			}				
			else
			{
				$("#demo_form").hide();
				$("#demo_loader").show();
				$.post(
					"/bitrix/components/rarus.sms4b/sms.send_contacts/ajax.php", 
					$(this).serialize(),
					function(data) {
						$("#demo_loader").hide();
						$("input[name=demo_number]").val('');						
						$("#demo_result").html(data[0].message);
						
						if(data[0].is_error)
							$("#demo_result").addClass("error");
						else
							$("#demo_result").addClass("success");
						$("#demo_result").show();
						
						setTimeout("demoFormShow()",5000);							
					},
					'json'
				); 
				return false;
			}
		}
	});
	
	$('#demo_form .content').mCustomScrollbar({
		scrollEasing:"easeOutQuint",
		autoDraggerLength:false
	});
	
});

function validateNumber(number)
{
    var pattern = /^(8|7|\+7)9\d{9}$/m;
	returnVal = '';
	number = number.replace(/\D+/ig, '');
	if(!pattern.test(number))
		returnVal = incorrect_number;
		
		return returnVal;
		//returnVal = ' Неверный формат номера. Пожалуйста, введите номер телефона в формате 8хххххххххх, 7хххххххххх или +7хххххххххх';	
				
}

function demoFormShow()
{
	$("#demo_result").hide();
	$('#demo_form').show();
}

function checkPhone(phone) 
{
	var pattern = /^\d+$/m;
	if(phone.charAt(0) == "+")
		phone = phone.substr(1);
	if(phone == "")
		return true;
	if ( !pattern.test(phone) )
		return false;
	else
		return true;
}