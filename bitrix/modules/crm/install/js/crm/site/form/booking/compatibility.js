(function() {
	if (!webPacker || !window.BX || !BX.message)
	{
		return;
	}

	module.properties = module.properties || {};
	for(const code in module.properties)
	{
		BX.message[code] = module.properties[code];
	}

	const language = window.b24form?.common?.language;

	webPacker.getModules().forEach((mod) => {
		const messages = (typeof mod.getMessages === 'function')
			? mod.getMessages(language)
			: (mod.messages || {});
		for (const code in messages)
		{
			const mess = messages[code];
			if (typeof mess === 'undefined' || mess === '')
			{
				continue;
			}

			BX.message[code] = mess;
		}
	});
})();
