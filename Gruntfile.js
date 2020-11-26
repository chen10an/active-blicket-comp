// adapted from: https://css-tricks.com/autoprefixer/
module.exports = function (grunt) {
    grunt.initConfig({
        autoprefixer: {
            dist: {
                files: {
                    'public/build/prefixed_bundle.css': 'public/build/bundle.css',
                    'public/prefixed_global.css': 'public/global.css'
                }
            }
        },
        watch: {
            styles: {
                files: ['public/build/bundle.css', 'public/global.css'],
                tasks: ['autoprefixer']
            }
        }
    });
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['autoprefixer'])
};