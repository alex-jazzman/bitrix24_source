export class YandexCabinetIdExtractor
{
	static cabinetLinkPattern = /^(https:\/\/)?yandex\.[^/]+\/sprav\/(\d+)\/p\/edit\/.*/;

	static extractFromCabinetLink(cabinetLink: string): string
	{
		const match = cabinetLink.match(this.cabinetLinkPattern);

		return match ? match[2] : '';
	}
}
