(()=>{

	// Maps datetime format from php to java.
	// Reference for symbols on the left - https://www.php.net/manual/en/datetime.format.php
	// Reference for symbols on the right - https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
	const mapper = {
		'D':"E",
		'N': Application.getPlatform() === 'ios'? "c" : "u",
		'd': "dd",
		'j': "d",
		'M':'MMM',
		'F':"MMMM",
		'm':"MM",
		'n':"M",
		'i':"mm",
		'l':"EEEE",
		'H':"HH",
		'G':"H",
		'h':'hh',
		'g':'h',
		's': 'ss',
		'Y': 'y',
	}

	const convert = value => value.replace(/\b(\w+)\b/g, find => mapper[find] ? mapper[find] : find);
	const data = this.jnExtensionData.get('date');

	this.dateFormatter = {
		convert,
		formats: (() => data['formats'] || {})(),
		get: (timestamp, format, locale = null) => {
			if (data['markers'] && Application.getApiVersion() >= 46)
			{
				const markers = data['markers'];
				DateFormatter.amSymbol = markers.am;
				DateFormatter.pmSymbol = markers.pm;
			}

			return DateFormatter.getDateString(timestamp, convert(format), locale);
		},
		test: (timestamp) => {
			for (const format in this.dateFormatter.formats)
			{
				const phpFormat = this.dateFormatter.formats[format];
				const convertedFormat = convert(phpFormat);
				console.log(DateFormatter.getDateString(timestamp, convertedFormat) + ` ---- (${phpFormat} -> ${convertedFormat})`);
			}
		}
	}
})();

