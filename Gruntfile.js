/******************************************************
 * PATTERN LAB NODE
 * EDITION-NODE-GRUNT
 * The grunt wrapper around patternlab-node core, providing tasks to interact with the core library and move supporting frontend assets.
******************************************************/

module.exports = function (grunt) {

  var path = require('path'),
      argv = require('minimist')(process.argv.slice(2));

  /* 
   * load all grunt tasks
   */

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browser-sync');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-parker'); 
  grunt.loadNpmTasks('grunt-image');

  /*
   * Pattern Lab configuration
   */

  var config = require('./patternlab-config.json'),
    pl = require('patternlab-node')(config);

  function paths() {
    return config.paths;
  }

  function getConfiguredCleanOption() {
    return config.cleanPublic;
  }

  grunt.registerTask('patternlab', 'create design systems with atomic design', function (arg) {

    if (arguments.length === 0) {
      pl.build(function(){}, getConfiguredCleanOption());
    }

    if (arg && arg === 'version') {
      pl.version();
    }

    if (arg && arg === "patternsonly") {
      pl.patternsonly(function(){},getConfiguredCleanOption());
    }

    if (arg && arg === "help") {
      pl.help();
    }

    if (arg && arg === "liststarterkits") {
      pl.liststarterkits();
    }

    if (arg && arg === "loadstarterkit") {
      pl.loadstarterkit(argv.kit, argv.clean);
    }

    if (arg && (arg !== "version" && arg !== "patternsonly" && arg !== "help" && arg !== "liststarterkits" && arg !== "loadstarterkit")) {
      pl.help();
    }
  });


  grunt.initConfig({

    //
    // Compile Sass to CSS
    //

    sass: {
      dist: {
        options: {
          style: 'expanded'
        },
        files: {
          './public/assets/css/style.css': './source/assets/css/style.scss'
        }
      }, 
      pattern_scaffolding: {
        options: {
          style: 'expanded'
        },
        files: {
          './public/assets/css/pattern-scaffolding.css': './source/assets/css/pattern-scaffolding.scss'
        }
      }
    },

    //
    // Minify stylesheets
    //

    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1, 
        sourceMap: true
      },
      target: {
        files: {
          './public/assets/css/style.min.css': ['./public/assets/css/style.css']
        }
      }
    },

    //
    // Add CSS vendor prefixes
    //

    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')//, 
          //require('cssnano')
        ]
      },
      dist: {
        src: ['./public/assets/css/style.css', './public/assets/css/style.min.css']
      }
    }, 

    //
    // Analyze CSS
    //

    parker: {
      normal: {
        options: {
          file: "./inventory/css-metrics-normal.md",
          colophon: true,
          usePackage: true
        },
        src: [
          './public/assets/css/style.css'
        ]
      }, 
      minified: {
        options: {
          file: "./inventory/css-metrics-minified.md",
          colophon: true,
          usePackage: true
        },
        src: [
          './public/assets/css/style.min.css'
        ]
      }
    }, 

    //
    // Copy static assets to 'public' directory
    //

    copy: {
      main: {
        files: [
          { expand: true, cwd: path.resolve(paths().source.js), src: '**/*.js', dest: path.resolve(paths().public.js) },
          { expand: true, cwd: path.resolve(paths().source.js), src: '**/*.js.map', dest: path.resolve(paths().public.js) },
          //{ expand: true, cwd: path.resolve(paths().source.css), src: '**/*.css', dest: path.resolve(paths().public.css) },        
          { expand: true, cwd: path.resolve(paths().source.css), src: '**/*.css.map', dest: path.resolve(paths().public.css) },
          { expand: true, cwd: path.resolve(paths().source.fonts), src: '**/*', dest: path.resolve(paths().public.fonts) },
          { expand: true, cwd: path.resolve(paths().source.root), src: 'favicon.ico', dest: path.resolve(paths().public.root) },
          { expand: true, cwd: path.resolve(paths().source.styleguide), src: ['*', '**'], dest: path.resolve(paths().public.root) },
          { expand: true, flatten: true, cwd: path.resolve(paths().source.styleguide, 'styleguide', 'css', 'custom'), src: '*.css)', dest: path.resolve(paths().public.styleguide, 'css') }
        ]
      }
    }, 

    //
    // Optimize images
    // https://www.npmjs.com/package/grunt-image

    image: {
      static: {
        options: {
          optipng: false,
          pngquant: true,
          zopflipng: true,
          jpegRecompress: false,
          mozjpeg: true,
          guetzli: false,
          gifsicle: true,
          svgo: true
        },
        files: {
          'dist/img.png': 'src/img.png',
          'dist/img.jpg': 'src/img.jpg',
          'dist/img.gif': 'src/img.gif',
          'dist/img.svg': 'src/img.svg'
        }
      },
      dynamic: {
        files: [{
          expand: true,
          cwd: 'source/assets/images/',
          src: ['**/*.{png,jpg,gif,svg}'],
          dest: 'public/assets/images/'
        }]
      }
    },

    //
    // Compress static assets into a .zip
    //
    
    compress: {
      all: {
        options: {
          archive: 'prod-ready-assets/prod-ready-assets.zip'
        },
        files: [
          {
            src: [
              'public/assets/**',
              '!public/assets/images/people/*',
              '!public/assets/js/**/_*.*',
              '!public/assets/js/pattern-lab-only',
              '!public/assets/js/pattern-lab-only.*',
              '!public/assets/js/pattern-lab-only/*'
            ],
            dest: 'prod-ready-assets/'
          }
        ]
      }
    },
    
    //
    // Local server and watch tasks
    //

    watch: {
      all: {
        files: [
          path.resolve(paths().source.css + '**/*.css'),
          path.resolve(paths().source.styleguide + 'css/*.css'),
          path.resolve(paths().source.patterns + '**/*'),
          path.resolve(paths().source.fonts + '/*'),
          path.resolve(paths().source.images + '/*'),
          path.resolve(paths().source.data + '*.json'),
          path.resolve(paths().source.js + '/*.js'),
          path.resolve(paths().source.root + '/*.ico')
        ],
        tasks: ['default', 'bsReload:css']
      }
    },

    browserSync: {
      dev: {
        options: {
          server:  path.resolve(paths().public.root),
          watchTask: true,
          watchOptions: {
            ignoreInitial: true,
            ignored: '*.html'
          },
          snippetOptions: {
            // Ignore all HTML files within the templates folder
            blacklist: ['/index.html', '/', '/?*']
          },
          plugins: [
            {
              module: 'bs-html-injector',
              options: {
                files: [path.resolve(paths().public.root + '/index.html'), path.resolve(paths().public.styleguide + '/styleguide.html')]
              }
            }
          ],
          notify: {
            styles: [
              'display: none',
              'padding: 15px',
              'font-family: sans-serif',
              'position: fixed',
              'font-size: 1em',
              'z-index: 9999',
              'bottom: 0px',
              'right: 0px',
              'border-top-left-radius: 5px',
              'background-color: #1B2032',
              'opacity: 0.4',
              'margin: 0',
              'color: white',
              'text-align: center'
            ]
          }
        }
      }
    },

    bsReload: {
      css: path.resolve(paths().public.root + '**/*.css')
    }

  });

  /*
   * Compound tasks
   */

  grunt.registerTask('default', ['patternlab', 'css', 'copy', 'compress', 'image:dynamic']);

  grunt.registerTask('pl', ['patternlab']);
  grunt.registerTask('patternlab:build', ['patternlab', 'copy:main']);
  grunt.registerTask('patternlab:watch', ['patternlab', 'copy:main', 'watch:all']);
  grunt.registerTask('patternlab:serve', ['patternlab', 'copy:main', 'browserSync', 'watch:all']);

  grunt.registerTask('css', ['sass', 'cssmin', 'postcss', 'parker']); 
  
  grunt.registerTask('pl_css', ['pl', 'css']); 

};
