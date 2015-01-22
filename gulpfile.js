var gulp = require('gulp');
var del = require('del');
var concat = require('gulp-concat');
var less = require('gulp-less');
var templateCache = require('gulp-angular-templatecache');
var debug = require('gulp-debug');
var jsSrc = [
    "src/js/**/*.js"
];
var templateSrc = [
    "src/templates/**/*.html"
];
var lessSrc = [
    "src/less/**/*.less"
];

var distJs = [
    "dist/*.js"
]

gulp.task('clean', function() {
    del.sync("dest/**/*.*", { force: true });
});

gulp.task('less-compile', ['clean'], function() {
    gulp.src(lessSrc)
        .pipe(concat('tc-grid.css'))
        .pipe(less())
        .pipe(gulp.dest('dist/'))
});

gulp.task('js-compile', ['clean'], function() {
    gulp.src(jsSrc)
        .pipe(concat('tc-grid.js'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('template-compile', function() {
    gulp.src(templateSrc)
        .pipe(templateCache('tc-grid-templates.js', {module: 'tc-grid'}))
        .pipe(gulp.dest('dist/'));
})

gulp.task('compile', ['js-compile', 'template-compile'], function() {

})

gulp.task('default', ['js-compile', 'less-compile'], function() {
    gulp.watch(templateSrc, ['template-compile'])
    gulp.watch(jsSrc, ['js-compile'])
    gulp.watch(lessSrc, ['less-compile'])
});