'use strict';

var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    bs = require('browser-sync').create(),
    concat = require('gulp-concat'),
    fileinclude = require('gulp-file-include'),
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),
    jshint = require('gulp-jshint'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    strip = require('gulp-strip-comments'),
    styleguide = require('sc5-styleguide'),
    uglify = require('gulp-uglify'),
    util = require('gulp-util'),
    // webstandards = require('gulp-webstandards'),
    outputPath = 'output';


// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("dev/scss/**/*.scss")
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest("dist/css/"))
        .pipe(bs.stream());
});

// Copy web fonts to dist
gulp.task('fonts', function() {
    return gulp.src(['dev/fonts/**'])
        .pipe(gulp.dest('dist/fonts'))
});

// HTML minify
gulp.task('htmlmin', function() {
    return gulp.src('dev/*.html')
        .pipe(plumber())
        .pipe(strip({
            safe: '<!--[if'
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/'))
        .pipe(bs.stream());
});

gulp.task('projects', function() {
    return gulp.src('dev/projects/**/**/*.html')
        .pipe(plumber())
        .pipe(strip({
            safe: '<!--[if'
        }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/projects'))
        .pipe(bs.stream());
});


// Compile Scripts and after minimizing auto-inject into browsers
gulp.task('scripts', function() {
    return gulp.src('dev/scripts/**/*.js')
        .pipe(plumber())
        .pipe(strip())
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/scripts'))
});

// Images minify
gulp.task('images', function() {
    return gulp.src('dev/images/**/*')
        .pipe(imagemin({
            interlaced: true,
            progressive: true,
            optimizationLevel: 5,
            svgoPlugins: [{ removeViewBox: true }]
        }))
        .pipe(gulp.dest('dist/images'))
});

gulp.task('styleguide:generate', function() {
    return gulp.src('dev/scss/**/*.scss')
        .pipe(styleguide.generate({
            title: 'Styleguide title',
            server: true, // Un-Comment this code if you want to host the styleguide locally
            port: 3001,
            rootPath: outputPath,
            overviewPath: 'README.md',
            //appRoot: '/gulp-fe-dev/output', // Un-Comment this code if you want to host the styleguide on Server.
            extraHead: [
                '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>'
            ],
            disableEncapsulation: true
        }))
        .pipe(gulp.dest(outputPath))
});

gulp.task('styleguide:applystyles', function() {
    return gulp.src('dist/css/styles.min.css')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(styleguide.applyStyles())
        .pipe(gulp.dest(outputPath))
});

// Static Server + watching scss/html files
gulp.task('serve', ['sass', 'htmlmin', 'projects', 'styleguide'], function() {
    bs.init({
        server: "dist/"
    });
    gulp.watch("dev/scss/**/*.scss", ['sass', 'styleguide']).on('change', bs.reload);
    gulp.watch("dev/images/**/*", ['images']).on('change', bs.reload);
    gulp.watch("dev/scripts/**/*.js", ['scripts']).on('change', bs.reload);
    gulp.watch("dev/**/*.html", ['htmlmin']).on('change', bs.reload);
    gulp.watch("dev/projects/**/**/*.html", ['projects']).on('change', bs.reload);
});

gulp.task('webstandards', function() {
    return gulp.src('dist/**/*')
        .pipe(webstandards());
});

gulp.task('styleguide', ['styleguide:generate', 'styleguide:applystyles']);
gulp.task('default', ['serve', 'styleguide', 'fonts']);