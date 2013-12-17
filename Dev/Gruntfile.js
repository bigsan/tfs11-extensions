module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			files: {
				src: 'Bigsan.TFSExtensions.EnhancedTaskBoard/Bigsan.TFSExtensions.EnhancedTaskBoard.js',
				dest: 'Bigsan.TFSExtensions.EnhancedTaskBoard/Bigsan.TFSExtensions.EnhancedTaskBoard.min.js'
			}
		},
		watch: {
			js: {
				files: 'Bigsan.TFSExtensions.EnhancedTaskBoard/Bigsan.TFSExtensions.EnhancedTaskBoard.js',
				tasks: [
					'uglify'
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['uglify']);
};