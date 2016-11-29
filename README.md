# grunt-browserstack-performance-test [![Build Status](https://secure.travis-ci.org/appsngen/grunt-browserstack-performance-test.png?branch=master)](https://travis-ci.org/appsngen/grunt-browserstack-performance-test)

> A grunt plugin to run Gemini tests.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-browserstack-performance-test --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-browserstack-performance-test');
```

## The "browserstack-performance-test" task

### Overview
In your project's Gruntfile, add a section named `gemini-runner` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  browserstack-performance-test: {
    your_target: {
        options: {
          // Task-specific options go here.
        }
    }
  }
});
```

### Options

#### options.filePath
Type: `String`
Default value: `'performance-test/result.xml'`

A string value that is used to defined path to file with test results.

#### options.toConsole
Type: `Boolean`
Default value: `false`

A boolean value that is used to define show result in console or only write in file.

#### options.numberOfRuns
Type: `Number`
Default value: `1`

A number value that is used to define number of runs.

### Usage Examples

In this example, the updated reference screenshots for the local version.

```js
'browserstack-performance-test': {
    'test': {
        options: {
            filePath: 'my/path/result.xml',
            toConsole: true,
            numberOfRuns: 3
        }
    }
}
```