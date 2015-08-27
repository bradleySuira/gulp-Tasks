module.exports = function(){
	var src = './src/';
	var build = './build/';
	var temp = './.tmp/';
	
	var config = {
		/* Main Paths */
		src: src,
		temp: temp,
		build: build,
		appUtilities: [
            src + 'favicon.ico',
            src + 'manifiest.webapp',
            src + 'manifiest.json',
            src + 'robots.txt',
            src + 'browserconfig.xml',
            src + 'manifiest.webapp',
            src + 'Web.config',
            
        ],
        
		/* Files Paths */
		index : src + 'index.html',
		
		allJs: [
			src + 'app/**/*.js'
		],
		
		allLess: src + 'styles/*.less',
		
		appJs: [
			'app/**/*.module.js',
			'app/**/*.service.js',
			'app/**/*.controller.js',
			'app/**/*.directive.js',
			'app/**/*.config.js'
		],
		
		images: src + 'images/*.*',
		
		css: 'styles.css',
		
		fonts: [
			src + 'vendor/bootstrap/fonts/*.*'
		],
		
		less: 
			src + 'styles/styles.less',
		
		html: [
			src + 'app/**/*.html'
		],
		
        templates: src + 'app/**/*.html',
		  /**
         * optimized files
         */
        optimized: {
            app: 'app.js',
            lib: 'lib.js'
        },
        
        
        /**
         * template cache
         */
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app'
            },
			path: 'js'
        },
		
		defaultPort: 3000
		
	};
	
	//wiredep
	config.wiredepOptions = function()
	{
		var options = {
			bowerJson: require('./bower.json'),
			directory: src + 'vendor',
			exclude: 	[
						'vendor/jquery/dist/jquery.js',
						'vendor/bootstrap/dist/js/bootstrap.js'
						],
			cwd: src,
			ignorePath: '../..'
		};
		
		return options;
	};
		
	return config;
};