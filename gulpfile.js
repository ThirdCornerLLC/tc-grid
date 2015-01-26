var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var templateCache = require('gulp-angular-templatecache');
var to5 = require('gulp-6to5');
var ngAnnotate = require('gulp-ng-annotate');
var addSrc = require('gulp-add-src');
var filter = require('gulp-filter');
var pipe = require('multipipe');

var config = {
    src: {
        js: "src/js/**/*.js",
        less: "src/less/**/*.less",
        html: "src/templates/**/*.html"
    },
    dist: {
        base: "dist",
        less: "tc-grid.css",
        bundle: "tc-grid.js",
        angularModule: "tc-grid"     
    }
};

gulp.task('build:css', function() {
    return pipe(
        gulp.src(config.src.less),
        concat(config.dist.less),
        less(),
        gulp.dest(config.dist.base)
    );
});

gulp.task('build:js', function() {
    var htmlFilter = filter("**/*.html");

    return pipe(
        gulp.src(config.src.js),        
        to5(),
        ngAnnotate(),
        addSrc(config.src.html),
        htmlFilter,
        templateCache({module: config.dist.angularModule}),
        htmlFilter.restore(),
        concat(config.dist.bundle),
        gulp.dest(config.dist.base)
    );
});

gulp.task('build', ['build:css','build:js']);

gulp.task('default', ['build'], function() {
    gulp.watch([config.src.js, config.src.html], ['build:js']);
    gulp.watch(config.src.less, ['build:css']);
});