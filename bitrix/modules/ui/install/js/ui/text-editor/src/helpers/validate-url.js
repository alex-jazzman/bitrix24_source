export function validateUrl(url: string, allowDomainRelativeUrl: boolean = true): boolean
{
	if (allowDomainRelativeUrl)
	{
		return /^(http:|https:|mailto:|tel:|sms:|\/)/i.test(url);
	}

	return /^(http:|https:|mailto:|tel:|sms:)/i.test(url);
}

export const URL_REGEX = (
	/^((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])$/
);

export const EMAIL_REGEX = (
	/^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/
);
