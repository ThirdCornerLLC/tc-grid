var gulp = require('gulp');
var del = require('del');
var concat = require('gulp-concat');
var less = require('gulp-less');
var templateCache = require('gulp-angular-templatecache');
var to5 = require('gulp-6to5');
var runSequence = require('run-sequence');
var vinylPaths = require('vinyl-paths');

var config = {
    src: {
        watch: "src/**/*.*",
        js: "src/js/**/*.js",
        less: "src/less/**/*.less",
        html: "src/templates/**/*.html"
    },
    dist: {
        base: "dist",
        js: "tc-grid-directives.js",
        less: "tc-grid.css",
        html: "tc-grid-templates.js",
        bundle: "tc-grid.js",
        angularModule: "tc-grid"     
    }
};

var htmlBundle = [
    config.dist.base + "/" + config.dist.js,
    config.dist.base + "/" + config.dist.html    
];

function remove(files){
    del.sync(config.dist.base + "/**/" + files, { force: true });
}

gulp.task('clean', function(done) {
    remove('*.*');
    done();
});

gulp.task('less-build', function() {
    return gulp.src(config.src.less)
        .pipe(concat(config.dist.less))
        .pipe(less())
        .pipe(gulp.dest(config.dist.base));
});

gulp.task('js-build', function() {
    return gulp.src(config.src.js)
        .pipe(concat(config.dist.js))
        .pipe(to5())
        .pipe(gulp.dest(config.dist.base));
});

gulp.task('html-build', function() {
    return gulp.src(config.src.html)
        .pipe(templateCache(config.dist.html, {module: config.dist.angularModule}))
        .pipe(gulp.dest(config.dist.base));
});

gulp.task('html-merge', function(){
    return gulp.src(htmlBundle)
        .pipe(concat(config.dist.bundle))
        .pipe(gulp.dest(config.dist.base));
});

gulp.task('html-clean', function(done){
    del.sync(htmlBundle, { force: true });
    done();
});

gulp.task('build', function(done) {    
    runSequence(
        'clean',
        ['less-build','js-build'],
        'html-build',
        'html-merge',
        'html-clean',
        done);
})

gulp.task('default', ['build'], function() {
    gulp.watch(config.src.watch, ['build']);
});