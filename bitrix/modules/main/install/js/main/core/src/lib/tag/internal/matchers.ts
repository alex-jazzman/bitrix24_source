const matchers = {
	tag: /<[\d!/A-Za-z-](?:"[^"]*"|'[^']*'|[^"'>])*>|{{uid\d+}}/g,
	comment: /<!--(?!<!)[^>[].*?-->/g,
	tagName: /<\/?(\S+?)[\s/>]/,
	attributes: /\s([\w.:-]+)\s?\n?=\s?\n?"([^"]+)?"|\s([\w.:-]+)\s?\n?=\s?\n?'([^']+)?'|\s([\w.:-]+)/gs,
	placeholder: /{{uid\d+}}/g,
};

export default matchers;
