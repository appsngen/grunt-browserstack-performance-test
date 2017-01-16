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
        var next = this.async();
        var xml = require('xml');
        var filePath = options.filePath || 'performance-test/result.xml';
        var numberOfRuns = options.numberOfRuns || 3;
        var browserstackProcessFinished = 0;
        var numberDecimalPlaces = 2;

        var testResults = {};

        var browserstackRunner = require('browserstack-runner');
        var config = require('../../../browserstack.json');

        var processTestReport = function (reports) {
            if (!Array.isArray(reports) || reports.length !== config.browsers.length) {
                throw new Error('Failed to run tests. Go to https://www.browserstack.com/ for more details.');
            }

            reports.forEach(function (report) {
                var result = {};

                report.tests[0].assertions.forEach(function (assertion) {
                    result[assertion.message] = assertion.actual;
                });

                testResults[report.browser] = testResults[report.browser] || [];
                testResults[report.browser].push(result);
            });
        };

        var calculateResult = function () {
            var report = [];

            Object.getOwnPropertyNames(testResults).forEach(function (systemInfo) {
                var result = {};

                result.systemInfo = systemInfo;
                result.results = testResults[systemInfo].reduce(function (sumObject, testResult) {
                    sumObject.loadTime += Number(testResult.loadTime);
                    sumObject.attachTime += Number(testResult.attachTime);

                    return sumObject;
                }, {
                    loadTime: 0,
                    attachTime: 0
                });

                result.results.loadTime /= numberOfRuns;
                result.results.attachTime /= numberOfRuns;

                result.results.loadTime = result.results.loadTime.toFixed(numberDecimalPlaces);
                result.results.attachTime = result.results.attachTime.toFixed(numberDecimalPlaces);

                report.push(result);
            });

            return report;
        };

        var formatResultToXml = function (results) {
            var xmlResults = results.map(function (result) {
                return {
                    result: [
                        {
                            _attr: {
                                systemInfo: result.systemInfo
                            }
                        },
                        {
                            loadTime: result.results.loadTime
                        },
                        {
                            attachTime: result.results.attachTime
                        }
                    ]
                };
            });

            return xml({
                testResults: xmlResults
            }, true);
        };

        var processResults = function () {
            var result = calculateResult();
            var xmlContent;

            if (options.toConsole) {
                grunt.log.writeln(JSON.stringify(result, null, 4));
            }

            if (options.toFile) {
                xmlContent = formatResultToXml(result);
                grunt.file.write(filePath, xmlContent);
            }
        };

        var processError = function (error) {
            var xmlContent;

            if (options.toConsole) {
                grunt.log.error(error);
            }

            if (options.toFile) {
                xmlContent = xml({
                    testResults: [
                        {
                            error: error.message
                        }
                    ]
                }, true);

                grunt.file.write(filePath, xmlContent);
            }
        };

        var startTask = (function () {
            var testIndex = 0;

            return function () {
                var callback = (function () {
                    var func;
                    var firstTimeCall = function (error, report) {
                        if (error) {
                            grunt.util.error(error);
                            next(error);
                        } else {
                            ++browserstackProcessFinished;

                            try {
                                processTestReport(report);
                            } catch (error) {
                                processError(error);
                                process.exit(1);
                            }

                            if (browserstackProcessFinished >= numberOfRuns) {
                                processResults();
                                next();
                            } else {
                                process.nextTick(startTask);
                            }
                        }
                    };
                    var secondTimeCall = function () {
                        grunt.log.error('Callback is called more than once. It\'s a browserstack-runner\'s bug.');
                    };

                    func = firstTimeCall;

                    return function () {
                        func.apply(this, arguments);
                        func = secondTimeCall;
                    };
                })();

                ++testIndex;
                grunt.log.writeln(`Running: ${testIndex} of ${numberOfRuns}.`);
                browserstackRunner.run(Object.assign({}, config), callback);
            };
        })();

        startTask();
    });
};
