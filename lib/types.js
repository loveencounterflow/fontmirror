(function() {
  'use strict';
  var CND, L, badge, debug, intertype, rpr;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'MKTS-MIRAGE/TYPES';

  debug = CND.get_logger('debug', badge);

  intertype = new (require('intertype')).Intertype(module.exports);

  //-----------------------------------------------------------------------------------------------------------
  this.declare('ucdb_clean_filename', {
    /*
    acc. to https://github.com/parshap/node-sanitize-filename:
      Control characters (0x00–0x1f and 0x80–0x9f)
      Reserved characters (/, ?, <, >, \, :, *, |, and ")
      Unix reserved filenames (. and ..)
      Trailing periods and spaces (for Windows)
    */
    tests: {
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
  this.declare('ucdb_settings', {
    tests: {
      "x is a object": function(x) {
        return this.isa.object(x);
      },
      "x.db_path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.db_path);
      },
      "x.icql_path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.icql_path);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('ucdb_web_layout_SLUG_settings', {
    tests: {
      "x is a object": function(x) {
        return this.isa.object(x);
      },
      "x.missing is 'drop'": function(x) {
        return x.missing === 'drop';
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('ucdb_cid', {
    tests: {
      "x is an integer": function(x) {
        return this.isa.integer(x);
      },
      "x is between 0x20 and 0x10ffff": function(x) {
        return (0x0 <= x && x <= 0x10ffff);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('ucdb_cid_codepage_text', {
    tests: {
      "x is a text": function(x) {
        return this.isa.text(x);
      },
      "x matches one to four hex digits": function(x) {
        return (x.match(/^[0-9a-f]{1,4}$/u)) != null;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('ucdb_glyph', {
    tests: {
      "x is a text": function(x) {
        return this.isa.text(x);
      },
      "x contains single codepoint": function(x) {
        return (x.match(/^.$/u)) != null;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('nonnegative_integer', (x) => {
    return (Number.isInteger(x)) && x >= 0;
  });

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
      throw new Error(`^ucdb/types@3422 unable to cast a ${type} as iterator`);
    },
    //---------------------------------------------------------------------------------------------------------
    hex: function(x) {
      L.validate.nonnegative_integer(x);
      return '0x' + x.toString(16);
    },
    //---------------------------------------------------------------------------------------------------------
    ucdb_cid_codepage_number: function(x) {
      L.validate.ucdb_cid_codepage_text(x);
      return parseInt(x + '00', 16);
    }
  };

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

}).call(this);
