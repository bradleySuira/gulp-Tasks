/// <reference path="typings/node/node.d.ts"/>

var gulp 		= require('gulp');
var args		= require('yargs').argv;
var config 		= require('./gulp.config')();
var del 		= require('del');
var browserSync = require('browser-sync');
var path        = require('path');
var _           = require('lodash');
var $		    = require('gulp-load-plugins')({ lazy:true });
var port        = process.env.PORT || config.defaultPort;
var reload      = browserSync.reload;
var runSequence = require('run-sequence');

gulp.task('styles', function() {
    log('Compiling Less --> CSS');

    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.temp));
});


gulp.task('fonts', function() {
    log('Copying fonts');
    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.temp + 'fonts'))
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images',  function() {
    log('Copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean', function(done) {
    
    var delconfig;
    if(args.path)
    {
       delconfig = args.path; 
    }else{
      delconfig = [].concat(config.build, config.temp); 
    }
    
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

gulp.task('jshint', function () {
    log('Analyzing source with JSHint and JSCS');
    return gulp.src(config.allJs)
                .pipe(reload({stream: true, once: true}))
                .pipe($.jshint())
                .pipe($.jshint.reporter('jshint-stylish'))
                .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});


gulp.task('templatecache', function() {
    log('Creating AngularJS $templateCache');

    return gulp
        .src(config.templates)
        .pipe($.minifyHtml({empty: true, quotes: true}))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
            ))
        .pipe(gulp.dest(config.temp));
});

gulp.task('wiredep', function() {
	var options = config.wiredepOptions();
	var wiredep = require('wiredep').stream;
	
	return gulp
			.src(config.index)
			.pipe(wiredep(options))
			.pipe(gulp.dest(config.src)); 
});

gulp.task('copy', function(){
    return gulp.src(config.appUtilities)
               .pipe(gulp.dest(config.build));
});

gulp.task('inject', function() {
    log('Wire up the app css and js into the html');

    return gulp
            .src(config.index)
            .pipe($.inject(gulp.src(config.css, {read: false, cwd: config.temp}), 
                        {
                            relative: false, ignorePath: '/', 
                            transform: function (filepath, file, i, length) {
                                     return '<link rel="stylesheet" href="'+ filepath.substring(1) + '" />';
                    }
                    }))
            .pipe($.inject(gulp.src(config.appJs, {read: false, cwd: config.src}), {relative: true}))
            .pipe(gulp.dest(config.src));
});

gulp.task('build-dev', ['clean'], function (cb) {
    log('build-dev');
    runSequence('wiredep', 'styles', 'inject', 'fonts', cb);
    
     var msg = {
        title: 'gulp build-dev',
        subtitle: 'build from dev folder',
        message: 'Running `gulp serve-build`'
    };
    
    log(msg);
    notify(msg);
});

gulp.task('build', ['clean'], function(cb) {
    log('build');

     runSequence('wiredep', 'styles', 'templatecache', 'inject', 'images', 'fonts', 'optimize-index', 'copy', cb);
   
});

gulp.task('optimize-index', ['optimize-assets'], function(){
    return gulp.src(config.build + 'index.html')
               .pipe($.minifyHtml({empty: true, quotes: true}))
               .pipe(gulp.dest(config.build));
});

gulp.task('optimize-assets', function() {
    log('Optimizing the javascript, css, html');

        var assets = $.useref.assets({searchPath: [config.temp, config.src]});
        
        return gulp
            .src(config.index)
            .pipe($.plumber())
            .pipe($.inject(gulp.src(config.templateCache.file, {read: false, cwd: config.temp}), 
                        {
                            relative: false, 
                            ignorePath: '/',
                            starttag: '<!-- inject:templates:js -->',
                            transform: function (filepath, file, i, length) {
                                     return '<script src="'+ filepath.substring(1) + '"></script>';
                    }
                    }))
            .pipe(assets)
            .pipe($.if('*.css', $.csso()))
            .pipe($.if('**/*'+ config.optimized.app, $.ngAnnotate()))
            .pipe($.if('*.js', $.uglify()))
            .pipe($.rev())
            .pipe(assets.restore())
            .pipe($.useref())
            .pipe($.revReplace())
            .pipe(gulp.dest(config.build))
            .pipe($.rev.manifest())
            .pipe(gulp.dest(config.build));
 });

gulp.task('serve-build', ['build'], function() {
     var msg = {
        title: 'serve-build',
        subtitle: 'Deployed to the build folder',
        message: 'Running `gulp serve-build`'
    };
    log(msg);
    notify(msg);
    serve(false /* isDev */);
});

gulp.task('serve-dev', ['build-dev'], function() {
    serve(true /* isDev */);
    var msg = {
        title: 'serve-dev',
        subtitle: 'serving from dev folder',
        message: 'Running `gulp serve-dev`'
    };
    log(msg);
    notify(msg);
});

/******************** Utils ********************/
 
function serve(isDev) {
    var modRewrite = require('connect-modrewrite');
    
    log('Starting browser-sync on port ' + port);
    
    // Watch files for changes & reload
    browserSync.init({
        notify: true,
        port: port,
        // Customize the BrowserSync console logging prefix
        logPrefix: 'iRS25',
        server:  isDev ? [config.src, '!' + config.allLess, config.temp ] : config.build,
        middleware: [
          modRewrite(['!\.html|\.js|\.css|\.png|\.jpg|\.eot|\.svg|\.ttf|\.woff|\.woff2$ /index.html [L]'])
        ]
     });


    if (isDev) {
         gulp.watch([config.allLess], ['styles', reload]);
         gulp.watch(config.allJs, ['inject', reload]); 
         gulp.watch(config.html, reload); 
         gulp.watch(config.images + '**/*', ['images', reload]); 
            
    }
}


function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.src + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function notify(options) {
    var notifier = require('node-notifier');
    var notifyOptions = {
        sound: 'Bottle',
        contentImage: path.join(__dirname, 'gulp.png'),
        icon: path.join(__dirname, 'gulp.png')
    };
    _.assign(notifyOptions, options);
    notifier.notify(notifyOptions);
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

