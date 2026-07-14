export const removeUdpFromSdp = (sdp: string): string => {
	const updatedSdp = [];

	sdp.split(/(\r\n|\r|\n)/).filter(RegExp.prototype.test.bind(/^([a-z])=(.*)/)).forEach((el) => {
		if (!el.startsWith('a=candidate') || el.includes('tcp'))
		{
			updatedSdp.push(el);
		}
	});

	return `${updatedSdp.join('\r\n')}\r\n`;
};
