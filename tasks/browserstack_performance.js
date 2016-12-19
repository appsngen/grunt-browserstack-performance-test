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
        var xml = require('xml');
        var filePath = options.filePath || 'performance-test/result.xml';
        var numberOfRuns = options.numberOfRuns || 1;
        var browserstackProcessFinished = 0;
        var responseData = {};
        var numberDecimalPlaces = 2;
        var browserstack;

        var writeResult = function (results, consoleLog) {
            var xmlContent;

            if (options.toConsole) {
                grunt.log.write(consoleLog);
            }

            if (options.toFile) {
                xmlContent = xml({testResults: results}, true);
                grunt.file.write(filePath, xmlContent);
            }
        };

        var calculateResult = function () {
            var results = [];
            var consoleLog = '';
            var key, loadTime, attachedTime, performanceTestResults, i, systemInfo, length;

            for (key in responseData) {
                if (responseData.hasOwnProperty(key)) {
                    systemInfo = key;
                    loadTime = 0;
                    attachedTime = 0;
                    performanceTestResults = responseData[key];
                    length = performanceTestResults.length;

                    for (i = 0; i < length; i++) {
                        loadTime += performanceTestResults[i].loadTime / length;
                        attachedTime += performanceTestResults[i].attachedTime / length;
                    }

                    loadTime = loadTime.toFixed(numberDecimalPlaces);
                    attachedTime = attachedTime.toFixed(numberDecimalPlaces);

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

                    consoleLog += '[' + systemInfo + '] Load Time:' + loadTime +
                        ' Attached Time:' + attachedTime + '\n';
                }
            }

            writeResult(results, consoleLog);
        };

        var responseProcessing = function (response) {
            var string = response;
            var begin, end, systemInfo, result, loadTime, attachedTime;

            if (string.indexOf('testResult') !== -1) {

                begin = string.indexOf('[');
                end = string.indexOf(']');

                if (begin === -1 || end === -1) {
                    grunt.fail.fatal('Browserstack response processing error.');
                }

                systemInfo = string.slice(begin + 1, end);
                begin = string.indexOf('] ');
                if (begin === -1) {
                    grunt.fail.fatal('Browserstack response processing error.');
                }

                try {
                    result = JSON.parse(string.slice(begin + 1));
                } catch (err) {
                    return;
                }
                loadTime = Number(result.testResult.loadTime);
                attachedTime = Number(result.testResult.attachedTime);

                responseData[systemInfo] = responseData[systemInfo] || [];
                responseData[systemInfo].push({
                    loadTime: loadTime,
                    attachedTime: attachedTime
                });
            }
        };

        var startTask = function () {
            browserstack = grunt.util.spawn({
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
                    browserstackProcessFinished++;
                    if (browserstackProcessFinished === numberOfRuns) {
                        calculateResult();
                        next();
                    } else {
                        setTimeout(startTask, 2500);
                    }
                }
            });

            if (typeof browserstack === 'undefined') {
                grunt.fail.fatal('Browserstack-runner task failed.');
            }

            browserstack.stdout.on('data', function (buf) {
                var string = String(buf);
                responseProcessing(string);
            });
            browserstack.stderr.on('data', function (buf) {
                grunt.log.error(String(buf));
            });
        };

        startTask();
    });
};
