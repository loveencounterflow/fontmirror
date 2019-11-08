
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/TAGS'
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
@link_all_sources = ( dry = false ) ->
  FONTMIRROR          = require '..'
  source_path         = FONTMIRROR.CFG.set_or_get 'source_path'
  target_path         = FONTMIRROR.CFG.set_or_get 'target_path'
  partitioner         = FONTMIRROR.NICKS.partitioner
  extensions          = FONTMIRROR.CFG.set_or_get 'extensions'
  pattern             = PATH.join source_path, "/**/*.+(#{extensions})"
  paths               = ( require 'glob' ).sync pattern
  paths_by_fontnicks  = {}
  #.........................................................................................................
  for path in paths
    name      = PATH.basename path
    fontnick  = FONTMIRROR.NICKS.escape name
    cache     = paths_by_fontnicks[ fontnick ] ?= []
    cache.push name
  #.........................................................................................................
  for fontnick, cache of paths_by_fontnicks
    #.......................................................................................................
    if cache.length is 1
      paths_by_fontnicks[ fontnick ] = cache[ 0 ]
      continue
    if cache.length > 25
      throw new Error "^fontmirror/tags@4443^ too many paths for fontnick #{rpr fontnick}: #{rpr cache}"
    #.......................................................................................................
    delete paths_by_fontnicks[ fontnick ]
    for path, idx in cache
      new_fontnick = fontnick + partitioner + String.fromCodePoint 0x41 + idx
      paths_by_fontnicks[ new_fontnick ] = path
  #.........................................................................................................
  for fontnick, path of paths_by_fontnicks
    echo ( CND.white ( fontnick + ':' ).padEnd 70 ), ( CND.lime path )
    continue if dry
    @_symlink
  #.........................................................................................................
  if dry
    echo CND.grey "dry run; no links have been written"
  return null


############################################################################################################
if require.main is module then do =>
  debug '^3332^'


