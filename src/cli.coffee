
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/CLI'
log                       = CND.get_logger 'plain',     badge
info                      = CND.get_logger 'info',      badge
whisper                   = CND.get_logger 'whisper',   badge
alert                     = CND.get_logger 'alert',     badge
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
PATH                      = require 'path'
{ assign
  jr }                    = CND
# { walk_cids_in_cid_range
#   cwd_abspath
#   cwd_relpath
#   here_abspath
#   _drop_extension
#   project_abspath }       = require './helpers'
@types                    = require './types'
{ isa
  validate
  cast
  type_of }               = @types
#...........................................................................................................
# require                   './exception-handler'


#-----------------------------------------------------------------------------------------------------------
@cli = ->
  ###
  fontmirror source [source_path] # (set or get)
  fontmirror target [target_path] # (set or get) where to write links, outlines (defaults to CWD)
  fontmirror refresh-tags
  fontmirror cache-outlines --target [target_path]
  ###
  FONTMIRROR  = require '..'
  app         = require 'commander'
  has_command = false
  app
    .name     FONTMIRROR.CFG.name
    .version  FONTMIRROR.CFG.version
  #.........................................................................................................
  app
    .command 'cfg'
    .description "show current configuration values"
    .action ( source_path, d ) =>
      has_command = true
      FONTMIRROR.CFG.show_cfg()
  #.........................................................................................................
  app
    .command 'source [source_path]'
    .description "set or get location of source fonts"
    .action ( source_path, d ) =>
      has_command = true
      source_path = PATH.resolve source_path if source_path?
      FONTMIRROR.CFG.set_or_get 'source_path', source_path, true
  #.........................................................................................................
  app
    .command 'target [target_path]'
    .description "set or get location where tagged links and outlines are to be stored"
    .action ( target_path, d ) =>
      has_command = true
      target_path = PATH.resolve target_path if target_path?
      FONTMIRROR.CFG.set_or_get 'target_path', target_path, true
  #.........................................................................................................
  app
    .command 'link-all-sources'
    .description "rewrite links to fonts in target/all"
    .action ( d ) =>
      has_command = true
      FONTMIRROR.TAGS.link_all_sources()
  #.........................................................................................................
  app
    .command 'refresh-tags'
    .description "rewrite tagged links as described in target/cfg/tags.txt"
    .action ( d ) =>
      has_command = true
      FONTMIRROR.TAGS.refresh()
  #.........................................................................................................
  app
    .command 'cache-outlines [tags]'
    .description "read all outlines from fonts and store them in target/outlines"
    .option '-f --force', "force overwrite existing outline files"
    .action ( d ) =>
      has_command     = true
      force_overwrite = d.force ? false
      info '^33332^', "cache", force_overwrite
      # await FONTMIRROR.cache_font_outlines source_path, target_path, force_overwrite
  #.........................................................................................................
  app.parse process.argv
  unless has_command
    app.outputHelp ( message ) -> CND.orange message
  # debug '^33376^', ( k for k of app).sort().join ', '
  return null



############################################################################################################
if require.main is module then do =>
  @cli()

