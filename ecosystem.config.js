module.exports = {
	apps: [
		{
			watch: true,
			name: 'PDF-Service',
			script: 'node main.js',
			ignore_watch: [
				'node_modules',
				'dist',
				'temp'
			],
		},
	],
};
