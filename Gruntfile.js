"use strict";
var path = require("path");

module.exports = function (grunt) {
    var pkg = grunt.file.readJSON("package.json");
    grunt.initConfig({
        watch: {
            autoDeployUpdate: {
                files: [ "./src/**/*" ],
                tasks: [ "compress", "copy" ],
                options: {
                    debounceDelay: 250,
                    livereload: true
                }
            }
        },

        compress: {
            makeMpk: {
                options: {
                    archive: "./dist/" + pkg.name + ".mpk",
                    mode: "zip"
                },
                files: [ {
                    expand: true,
                    date: new Date(),
                    store: false,
                    cwd: "./src",
                    src: [ "**/*" ]
                } ]
            }
        },

        copy: {
            deployment: {
                files: [ {
                    dest: "./test/deployment/web/widgets",
                    cwd: "./src/", src: [ "**/*" ],
                    expand: true
                } ]
            },
            mpks: {
                files: [ {
                    dest: "./test/widgets",
                    cwd: "./dist/",
                    src: [ pkg.name + ".mpk" ],
                    expand: true
                } ]
            }
        },

        clean: {
            build: [
                path.join("./dist", pkg.name, "/*")
            ]
        },

        csslint: {
            strict: {
                options: { import: 2 },
                src: [ "src/" + pkg.name + "/widget/ui/*.css" ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-csslint");

    grunt.registerTask("default", [ "clean build", "watch" ]);

    grunt.registerTask("clean build",
        "Compiles all the assets and copies the files to the build directory.",
        [ "clean", "compress", "copy" ]
    );

    grunt.registerTask("build", [ "clean build" ]);
};
