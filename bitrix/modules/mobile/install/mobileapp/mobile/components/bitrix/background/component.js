(() => {
	const require = (ext) => jn.require(ext);
	const { AvaMenu } = require('ava-menu');
	AvaMenu.init();

	try
	{
		const { IntranetBackground } = require('intranet/background');
		IntranetBackground?.init();
	}
	catch (e)
	{
		console.warn(e);
	}
})();
