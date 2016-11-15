/*
 * grunt-browserstack-performance
 * https://github.com/appsngen/grunt-browserstack-performance-test.git
 *
 * Copyright (c) 2014 AppsNgen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    grunt.registerMultiTask('browserstack-performance-test', 'A grunt plugin to run Gemini tests.', function() {

        var options = this.options();
        var directory = '.';
        var cmd = 'browserstack-runner';
        var next = this.async();
        var results = [];
        var xml = require('xml');
        var filePath = options.filePath || 'performance-test/result.xml';

        var browserstack = grunt.util.spawn({
            cmd: cmd,
            args: [],
            opts: {
                cwd: directory
            }
        }, function (err, result, code) {
            if (err) {
                grunt.fail.fatal(err, code);
                next(code);
            } else {
                var xmlContent = xml({testResults: results}, true);
                grunt.file.write(filePath, xmlContent);
                next();
            }
        });

        if (typeof browserstack === 'undefined') {
            grunt.fail.fatal('Browserstack-runner task failed.');
        }

        browserstack.stdout.on('data', function (buf) {
            var string = String(buf);
            var begin, end, systemInfo, result, loadTime, attachedTime;

            if (string.indexOf('result') !== -1) {

                begin = string.indexOf('[');
                end = string.indexOf(']');

                if (begin === -1 || end === -1) {
                    grunt.fail.fatal('Browserstack response processing error.');
                }

                systemInfo = string.slice(begin + 1, end);

                begin = string.indexOf('] ');
                if (begin === -1 || end === -1) {
                    grunt.fail.fatal('Browserstack response processing error.');
                }
                result = JSON.parse(string.slice(begin + 1));
                loadTime = Number(result.result.loadTime).toFixed(2);
                attachedTime = Number(result.result.attachedTime).toFixed(2);

                results.push({
                    result: [
                        {
                            _attr: {
                                systemInfo: systemInfo
                            }
                        },
                        {
                            loadTime: loadTime
                        },
                        {
                            attachedTime: attachedTime
                        }
                    ]
                });

                if (options.toConsole) {
                    grunt.log.write('[' + systemInfo + '] Load Time:' + loadTime + ' Attached Time:' + attachedTime);
                }
            }
        });
        browserstack.stderr.on('data', function (buf) {
            grunt.log.error(String(buf));
        });
    });

};
