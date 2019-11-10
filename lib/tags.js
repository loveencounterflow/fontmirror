(function() {
  'use strict';
  var $, $async, $collect_vocabulary, $drain, $inject_vocabulary, $show, $skip_comments_and_blanks, $split_tags_fields, $split_vocabulary_fields, $validate_tags, $watch, CND, FS, PATH, SP, XXX_PD, alert, assign, badge, cast, debug, echo, first, help, info, isa, jr, last, log, mkdirp, new_datom, rpr, select, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'FONTMIRROR/TAGS';

  log = CND.get_logger('plain', badge);

  info = CND.get_logger('info', badge);

  whisper = CND.get_logger('whisper', badge);

  alert = CND.get_logger('alert', badge);

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  ({assign, jr} = CND);

  // { walk_cids_in_cid_range
  //   cwd_abspath
  //   cwd_relpath
  //   here_abspath
  //   _drop_extension
  //   project_abspath }       = require './helpers'
  this.types = require('./types');

  ({isa, validate, cast, type_of} = this.types);

  //...........................................................................................................
  // require                   './exception-handler'
  mkdirp = require('mkdirp');

  //...........................................................................................................
  SP = require('steampipes');

  ({$, $async, $watch, $show, $drain} = SP.export());

  //...........................................................................................................
  /* TAINT only needed until datoms are implemented in SteamPipes */
  XXX_PD = require('pipedreams');

  ({new_datom, select} = XXX_PD.export());

  last = Symbol('last');

  first = Symbol('first');

  //===========================================================================================================
  // HELPERS
  //-----------------------------------------------------------------------------------------------------------
  $skip_comments_and_blanks = function() {
    /* TAINT implement in SteamPipes */
    return SP.$filter(function(line) {
      return ((line.match(/^\s*#/)) == null) && ((line.match(/^\s*$/)) == null);
    });
  };

  //===========================================================================================================
  // VOCABULARY
  //-----------------------------------------------------------------------------------------------------------
  this.read_vocabulary = function(settings) {
    return new Promise((resolve) => {
      var FONTMIRROR, pipeline, source, source_path, target_path;
      FONTMIRROR = require('..');
      target_path = FONTMIRROR.CFG.set_or_get('target_path');
      source_path = PATH.join(target_path, 'cfg/tag-vocabulary.txt');
      source = SP.read_from_file(source_path);
      pipeline = [];
      //.........................................................................................................
      pipeline.push(source);
      pipeline.push(SP.$split());
      pipeline.push($skip_comments_and_blanks());
      pipeline.push($split_vocabulary_fields());
      pipeline.push($collect_vocabulary());
      pipeline.push($drain(function([vocabulary]) {
        return resolve(vocabulary);
      }));
      //.........................................................................................................
      SP.pull(...pipeline);
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  $split_vocabulary_fields = function() {
    /* TAINT show source location on error */
    return $(function(line, send) {
      var comment, is_vip, tag, tag_with_markup, tail;
      [tag_with_markup, ...tail] = line.split(/\s+/);
      comment = tail.join(' ');
      if (!tag_with_markup.startsWith('+')) {
        throw new Error(`^fontmirror/tags@4543^ not a legal tag: ${rpr(tag)}`);
      }
      if ((is_vip = tag_with_markup.endsWith('!'))) {
        tag = tag_with_markup.replace(/!$/, '');
      } else {
        tag = tag_with_markup;
      }
      return send(new_datom('^tag', {tag, is_vip}));
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  $collect_vocabulary = function() {
    /* TAINT show source location on error */
    var R;
    R = {};
    return $({last}, function(d, send) {
      var is_vip, tag;
      if (d === last) {
        return send(R);
      }
      ({tag, is_vip} = d);
      if (R[tag] != null) {
        throw new Error(`^fontmirror/tags@4548^ duplicate tag: ${rpr(tag)}`);
      }
      R[tag] = {is_vip};
      return null;
    });
  };

  //===========================================================================================================
  // FONTNICKS AND TAGS
  //-----------------------------------------------------------------------------------------------------------
  $split_tags_fields = function() {
    return $(function(line, send) {
      var fontnick, tags, tail;
      [fontnick, ...tail] = line.split(/\s+/);
      tags = tail.join('');
      tags = tags.replace(/\s/g, '');
      tags = tags.split(/(?=\+)/);
      return send(new_datom('^tagged-fontnick', {fontnick, tags}));
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  $validate_tags = function(vocabulary) {
    return $watch(function(d) {
      var i, len, ref, tag;
      ref = d.tags;
      /* TAINT show source location on error */
      for (i = 0, len = ref.length; i < len; i++) {
        tag = ref[i];
        if (vocabulary[tag] == null) {
          throw new Error(`^fontmirror/tags@4549^ unknown tag: ${rpr(tag)}`);
        }
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  $inject_vocabulary = function(vocabulary) {
    return $({first}, function(d, send) {
      if (d === first) {
        return send(new_datom('^vocabulary', {
          value: vocabulary
        }));
      }
      return send(d);
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this._new_tag_source = function(settings) {
    return new Promise(async(resolve) => {
      var FONTMIRROR, pipeline, source, source_path, target_path, vocabulary;
      validate.fontmirror_cli_command_settings(settings);
      vocabulary = (await this.read_vocabulary(settings));
      FONTMIRROR = require('..');
      // source_path         = FONTMIRROR.CFG.set_or_get 'source_path'
      target_path = FONTMIRROR.CFG.set_or_get('target_path');
      source_path = PATH.join(target_path, 'cfg/tags.txt');
      // partitioner         = FONTMIRROR.NICKS.partitioner
      // extensions          = FONTMIRROR.CFG.set_or_get 'extensions'
      // pattern             = PATH.join source_path, "/**/*.+(#{extensions})"
      // paths               = ( require 'glob' ).sync pattern
      // paths_by_fontnicks  = {}
      // links_home          = PATH.join target_path, 'all'
      // font_count          = 0
      source = SP.read_from_file(source_path);
      pipeline = [];
      //.........................................................................................................
      pipeline.push(source);
      pipeline.push(SP.$split());
      pipeline.push($skip_comments_and_blanks());
      pipeline.push($split_tags_fields());
      pipeline.push($validate_tags(vocabulary));
      pipeline.push($inject_vocabulary(vocabulary));
      //.........................................................................................................
      return resolve(SP.pull(...pipeline));
    });
  };

  //===========================================================================================================
  // REFRESH
  //-----------------------------------------------------------------------------------------------------------
  this.refresh = function(settings) {
    return new Promise(async(resolve) => {
      var FONTMIRROR, fontnicks, path_to_fontnicks, pipeline, source, target_path;
      debug('^344772^', settings);
      process.exit(1);
      FONTMIRROR = require('..');
      target_path = FONTMIRROR.CFG.set_or_get('target_path');
      path_to_fontnicks = PATH.join(target_path, 'all');
      fontnicks = FONTMIRROR.LINKS._list_all_fontnicks();
      source = (await this._new_tag_source(settings));
      pipeline = [];
      //.........................................................................................................
      pipeline.push(source);
      pipeline.push($show());
      pipeline.push($drain(function() {
        return resolve();
      }));
      //.........................................................................................................
      SP.pull(...pipeline);
      return null;
    });
  };

  //###########################################################################################################
  if (require.main === module) {
    (() => {
      return debug('^3332^');
    })();
  }

}).call(this);
