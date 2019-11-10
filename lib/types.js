(function() {
  'use strict';
  var CND, FS, L, badge, debug, intertype, rpr;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'MKTS-MIRAGE/TYPES';

  debug = CND.get_logger('debug', badge);

  intertype = new (require('intertype')).Intertype(module.exports);

  FS = require('fs');

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_clean_filename', {
    tests: {
      /*
      acc. to https://github.com/parshap/node-sanitize-filename:
        Control characters (0x00–0x1f and 0x80–0x9f)
        Reserved characters (/, ?, <, >, \, :, *, |, and ")
        Unix reserved filenames (. and ..)
        Trailing periods and spaces (for Windows)
      */
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x does not contain control chrs": function(x) {
        return (x.match(/[\x00-\x1f]/)) == null;
      },
      "x does not contain meta chrs": function(x) {
        return (x.match(/[\/?<>\:*|"]/)) == null;
      },
      "x is not `.` or `..`": function(x) {
        return (x.match(/^\.{1,2}$/)) == null;
      },
      "x has no whitespace": function(x) {
        return (x.match(/\s/)) == null;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_existing_filesystem_object', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x points to existing fso": function(x) {
        var error;
        try {
          FS.statSync(x);
        } catch (error1) {
          error = error1;
          return false;
        }
        return true;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_existing_file', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x points to existing file": function(x) {
        var error;
        try {
          return (FS.statSync(x)).isFile();
        } catch (error1) {
          error = error1;
          return false;
        }
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_existing_folder', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      },
      "x points to existing folder": function(x) {
        var error;
        try {
          return (FS.statSync(x)).isDirectory();
        } catch (error1) {
          error = error1;
          return false;
        }
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_settings', {
    tests: {
      "x is a object": function(x) {
        return this.isa.object(x);
      },
      "x.source_path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.source_path);
      },
      "x.target_path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.target_path);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_tagger_job_settings', {
    tests: {
      "x is a object": function(x) {
        return this.isa.object(x);
      },
      "x.dry is a boolean": function(x) {
        return this.isa.boolean(x.dry);
      },
      "x.quiet is a boolean": function(x) {
        return this.isa.boolean(x.quiet);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('fontmirror_fontfile_extensions', function(x) {
    if (!this.isa.list(x)) {
      return false;
    }
    return x.every((e) => {
      return this.isa.nonempty_text(e);
    });
  });

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'fontmirror_web_layout_SLUG_settings',
  //   tests:
  //     "x is a object":                          ( x ) -> @isa.object              x
  //     "x.missing is 'drop'":                    ( x ) -> x.missing is 'drop'

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'fontmirror_cid',
  //   tests:
  //     "x is an integer":                        ( x ) -> @isa.integer x
  //     "x is between 0x20 and 0x10ffff":         ( x ) -> 0x0 <= x <= 0x10ffff

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'fontmirror_cid_codepage_text',
  //   tests:
  //     "x is a text":                            ( x ) -> @isa.text x
  //     "x matches one to four hex digits":       ( x ) -> ( x.match /// ^ [0-9a-f]{1,4} $ ///u )?

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'fontmirror_glyph',
  //   tests:
  //     "x is a text":                            ( x ) -> @isa.text x
  //     "x contains single codepoint":            ( x ) -> ( x.match ///^.$///u )?

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'nonnegative_integer',             ( x ) => ( Number.isInteger x ) and x >= 0

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT experimental */
  L = this;

  this.cast = {
    //---------------------------------------------------------------------------------------------------------
    iterator: function(x) {
      var type;
      switch ((type = L.type_of(x))) {
        case 'generator':
          return x;
        case 'generatorfunction':
          return x();
        case 'list':
          return (function() {
            var i, len, results, y;
            results = [];
            for (i = 0, len = x.length; i < len; i++) {
              y = x[i];
              results.push(y);
            }
            return results;
          })();
      }
      throw new Error(`^fontmirror/types@3422 unable to cast a ${type} as iterator`);
    },
    //---------------------------------------------------------------------------------------------------------
    hex: function(x) {
      L.validate.nonnegative_integer(x);
      return '0x' + x.toString(16);
    }
  };

  // #---------------------------------------------------------------------------------------------------------
  // fontmirror_cid_codepage_number: ( x ) ->
  //   L.validate.fontmirror_cid_codepage_text x
  //   return parseInt x + '00', 16

  //     "x.file_path is a ?nonempty text":        ( x ) -> ( not x.file_path?   ) or @isa.nonempty_text x.file_path
  //     "x.text is a ?text":                      ( x ) -> ( not x.text?        ) or @isa.text          x.text
  //     "x.file_path? xor x.text?":               ( x ) ->
  //       ( ( x.text? ) or ( x.file_path? ) ) and not ( ( x.text? ) and ( x.file_path? ) )
  //     "x.db_path is a ?nonempty text":          ( x ) -> ( not x.db_path?     ) or @isa.nonempty_text x.db_path
  //     "x.icql_path is a ?nonempty text":        ( x ) -> ( not x.icql_path?   ) or @isa.nonempty_text x.icql_path
  //     "x.default_key is a ?nonempty text":      ( x ) -> ( not x.default_key? ) or @isa.nonempty_text x.default_key

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'mirage_main_row',
  //   tests:
  //     "x has key 'key'":                        ( x ) -> @has_key             x, 'key'
  //     "x has key 'vnr'":                        ( x ) -> @has_key             x, 'vnr'
  //     "x has key 'text'":                       ( x ) -> @has_key             x, 'text'
  //     "x.key is a nonempty text":               ( x ) -> @isa.nonempty_text   x.key
  //     "x.vnr is a list":                        ( x ) -> @isa.list            x.vnr
  //     # "x.vnr starts, ends with '[]'":           ( x ) -> ( x.vnr.match /^\[.*\]$/ )?
  //     # "x.vnr is a JSON array of integers":      ( x ) ->
  //     #   lst = JSON.parse x.vnr
  //     #   return false unless @isa.list lst
  //     #   return lst.every ( xx ) => @isa.integer xx

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'true', ( x ) -> x is true

  //-----------------------------------------------------------------------------------------------------------
  this.defaults = {
    fontmirror_cli_command_settings: {
      dry: false,
      quiet: false
    }
  };

}).call(this);
