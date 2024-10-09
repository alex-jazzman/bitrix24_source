import {Backend} from 'landing.backend';

export default async function fetchData(blockId: number, params: {} = {})
{
	let data = await Backend.getInstance()
		.action('RepoWidget::fetchData', {
			blockId,
			params,
		})
		.catch(err => {
			console.error("Fetch error", err);
		});

	try
	{
		data = JSON.parse(data);
		if (data['error'])
		{
			console.error("Fetch data error: data failed", data['error']);
			data = {};
		}
	}
	catch(e) {
		console.error("Fetch data error: json parse error");
		data = {};
	}

	return data;
}
