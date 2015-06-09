var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var templateCache = require('gulp-angular-templatecache');
var babel = require('gulp-babel');
var ngAnnotate = require('gulp-ng-annotate');
var addSrc = require('gulp-add-src');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
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
        gulp.dest(config.dist.base),
		minifyCss(),
        rename({ suffix: '.min' }),
		gulp.dest(config.dist.base)
    );
});

gulp.task('build:js', function() {
    var htmlFilter = filter("**/*.html");

    return pipe(
        gulp.src(config.src.js),        
        babel(),
        ngAnnotate(),
        addSrc(config.src.html),
        htmlFilter,
        templateCache({module: config.dist.angularModule}),
        htmlFilter.restore(),
        concat(config.dist.bundle),
        gulp.dest(config.dist.base),
		uglify({ mangle: true, warnings: false }),
        rename({ suffix: '.min' }),
		gulp.dest(config.dist.base)
    );
});

gulp.task('build', ['build:css','build:js']);

gulp.task('default', ['build'], function() {
    gulp.watch([config.src.js, config.src.html], ['build:js']);
    gulp.watch(config.src.less, ['build:css']);
});