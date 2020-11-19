// adapted from: https://css-tricks.com/autoprefixer/
module.exports = function (grunt) {
    grunt.initConfig({
        autoprefixer: {
            dist: {
                files: {
                    'public/active-blicket-comp/build/prefixed_bundle.css': 'public/active-blicket-comp/build/bundle.css',
                    'public/active-blicket-comp/prefixed_global.css': 'public/active-blicket-comp/global.css'
                }
            }
        },
        watch: {
            styles: {
                files: ['public/active-blicket-comp/build/bundle.css', 'public/active-blicket-comp/global.css'],
                tasks: ['autoprefixer']
            }
        }
    });
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['autoprefixer'])
};