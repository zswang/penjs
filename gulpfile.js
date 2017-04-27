/*jshint globalstrict: true*/
/*global require*/

'use strict'

const gulp = require('gulp')
const connect = require('gulp-connect')
const jdists = require('gulp-jdists')
const uglify = require('gulp-uglify')
const rename = require("gulp-rename")
const replace = require('gulp-replace')
const open = require('gulp-open')
const examplejs = require('gulp-examplejs')

const port = 20176;

gulp.task('example', function() {
  return gulp.src([
      'src/*.js'
    ])
    .pipe(examplejs({
      header: `
global.jnodes = require('../src/jnodes.js');
global.ejs = require('ejs');
global.jhtmls = require('jhtmls');
      `
    }))
    .pipe(gulp.dest('test'))
})

gulp.task('open', function() {
  gulp
    .src(__filename)
    .pipe(open({
      uri: `http://localhost:${port}/example/index.html`
    }))
})

gulp.task('connect', function() {
  connect.server({
    port: port,
    livereload: {
      prot: 35731
    }
  })
})

gulp.task('watch', function() {
  gulp.watch(['./example/*.html', './src/**/*.js'], ['build', 'reload'])
})

gulp.task('reload', function() {
  gulp
    .src(['./example/*.html', './src/**/*.js'], ['build', 'reload'])
    .pipe(connect.reload())
})

gulp.task('build', function() {
  gulp.src('./src/penjs.js')
    .pipe(jdists({
      trigger: 'release'
    }))
    .pipe(gulp.dest('./'))
    .pipe(uglify())
    .pipe(rename('penjs.min.js'))
    .pipe(gulp.dest('./'))
})

gulp.task('default', ['build', 'connect', 'watch', 'open'])

gulp.task('dist', ['build'])