const fs = require('fs');
const path = require('path');
module.exports = {
	input: 'src/worker.js',
	output: '../dist/pdfjs.worker.bundle.js',
	browserslist: true,
	plugins: {
		custom: [
			{
				name: 'copy-lib',
				renderChunk() {
					const libCode = fs.readFileSync(
						path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'),
						'utf8',
					);

					return {
						code: libCode,
					};
				},
			},
		],
	},
};
