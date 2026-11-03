BX.ready(function()
{
	$('#bx-soa-order-form').on('keydown', 'input[type="text"]', function(event)
	{
		if (event.keyCode === 13)
		{
			event.target.dispatchEvent(new Event('change', { bubbles: true }));
			event.preventDefault();
		}
	});
});
