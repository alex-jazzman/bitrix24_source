export function validateUrl(url: string, allowDomainRelativeUrl: boolean = true): boolean
{
	if (allowDomainRelativeUrl)
	{
		return /^(http:|https:|mailto:|tel:|sms:|\/)/i.test(url);
	}

	return /^(http:|https:|mailto:|tel:|sms:)/i.test(url);
}

export const URL_REGEX = /^((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])$/;
