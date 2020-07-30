
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/CFG'
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
jr                        = JSON.stringify
PATH                      = require 'path'
{ assign
  jr }                    = CND
types                     = require './types'
{ isa
  validate
  cast
  type_of }               = types
#...........................................................................................................
defaults  =
  source_path:  null
  target_path:  process.cwd()
  extensions:   'otf|ttf|woff|woff2|ttc'
#...........................................................................................................
package_json              = require '../package.json'
@name                     = package_json.name
@version                  = package_json.version
cfg                       = new ( require 'configstore' ) @name, defaults
{ new_datom, }            = require 'datom'


#-----------------------------------------------------------------------------------------------------------
### TAINT consider to move this to types module ###
key_infos =
  source_path:
    type:       'fontmirror_existing_folder'
    default:    null
  target_path:
    type:       'fontmirror_existing_folder'
    default:    null
  extensions:
    type:       'fontmirror_fontfile_extensions'
    default:    [ 'otf', 'ttf', 'woff', 'woff2', 'ttc', ]

#-----------------------------------------------------------------------------------------------------------
@_extract_job_settings = ( _job_settings ) ->
  ### TAINT would be good to use a CLI handler that does not mix user-defined attributes into its own API ###
  R               = {}
  defaults        = types.defaults.fontmirror_cli_command_settings
  R[ k ]          = ( _job_settings[ k ] ? defaults[ k ] ) for k of defaults
  validate.fontmirror_tagger_job_settings R
  return R

#-----------------------------------------------------------------------------------------------------------
@new_tagger = ( _job_settings ) ->
  FONTMIRROR            = require '..'
  R                     = assign {}, FONTMIRROR.CFG.all()
  debug '^3437776^', R
  debug '^3336388^', @_extract_job_settings _job_settings
  R.fontnick_sep        = FONTMIRROR.NICKS.partitioner
  R.glob_fonts          = PATH.join R.source_path, "**/*.+(#{R.extensions})"
  R.path_fonts          = R.source_path
  R.path_fmcatalog      = R.target_path
  R.path_all            = PATH.join R.target_path, 'all'
  R.path_cfg            = PATH.join R.target_path, 'cfg'
  R.path_cache          = PATH.join R.target_path, 'cache'
  R.path_tagged         = PATH.join R.target_path, 'tagged'
  R.path_untagged       = PATH.join R.target_path, 'untagged'
  R.path_outlines       = PATH.join R.target_path, 'outlines'
  #.........................................................................................................
  return new_datom '^fontmirror/tagger', R

#-----------------------------------------------------------------------------------------------------------
@set = ( me, key, value, display ) ->
  unless ( key_info = key_infos[ key ] )?
    throw new Error "^fontmirror/cfg@3782^ unknown key #{rpr key}"
  validate[ type ] value if ( type = key_info.type ? null )?
  me[ key ] = value
  cfg.set key, value
  whisper "fontmirror #{key} set to #{jr value}" if display
  return value

#-----------------------------------------------------------------------------------------------------------
@get = ( me, key, display ) ->
  unless ( key_info = key_infos[ key ] )?
    throw new Error "^fontmirror/cfg@3782^ unknown key #{rpr key}"
  value = ( cfg.get key ) ? null
  validate[ type ] value if ( type = key_info.type ? null )?
  info "fontmirror #{key}: #{jr value}" if display
  return value

#-----------------------------------------------------------------------------------------------------------
@all = -> cfg.all

#-----------------------------------------------------------------------------------------------------------
@show_cfg = ->
  whisper "configuration values in #{cfg.path}"
  for key, value of cfg.all
    info ( CND.white ( key + ':' ).padEnd 50 ), ( CND.lime value )
  return null


# ############################################################################################################
# if require.main is module then do =>
#   debug '^334521^'


