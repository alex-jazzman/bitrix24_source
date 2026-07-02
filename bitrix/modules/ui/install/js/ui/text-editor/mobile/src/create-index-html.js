const path = require('path');
const fs = require('fs/promises');
const { writeFile, mkdir } = require('node:fs/promises');

export function createIndexHtml()
{
	return {
		name: 'createIndexHtml',
		async buildStart()
		{
			await fs.rm(path.join(__dirname, '..', 'dist'), { recursive: true, force: true });
		},
		async closeBundle()
		{
			const outputPath = path.join(__dirname, '..', 'dist', 'index.html');
			let html = await getPageContent('http://localhost/dev/ui/text-editor/mobile.php');
			html = html.replaceAll(/\/bitrix\/js\/ui\/text-editor\/mobile\/dist\/([^?]+)\?\d+/g, '$1');

			try
			{
				await mkdir(path.dirname(outputPath), { recursive: true });
				await writeFile(outputPath, html, 'utf-8');
				console.log(`Created index.html at ${outputPath}`);
			}
			catch (error)
			{
				console.error('Error creating index.html:', error);
			}
		},
	};
}

async function getPageContent(url)
{
	try
	{
		const response = await fetch(url);

		if (!response.ok)
		{
			throw new Error(`HTTP ошибка: ${response.status}`);
		}

		const html = await response.text();

		return html;
	}
	catch (error)
	{
		console.error('Ошибка при получении страницы:', error.message);
		throw error;
	}
}
