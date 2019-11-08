
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
@types                    = require './types'
{ isa
  validate
  cast
  type_of }               = @types
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

#-----------------------------------------------------------------------------------------------------------
### TAINT consider to move this to types module ###
key_infos =
  extensions:
    type:       'nonempty_text'
  source_path:
    type:       'fontmirror_existing_folder'
  target_path:
    type:       'fontmirror_existing_folder'


#-----------------------------------------------------------------------------------------------------------
@set_or_get = ( key, value, display ) ->
  unless ( key_info = key_infos[ key ] )?
    throw new Error "^fontmirror/cfg@3782^ unknown key #{rpr key}"
  type = key_info.type ? null
  if value isnt undefined
    validate[ type ] value if type?
    R = cfg.set key, value
    whisper "fontmirror #{key} set to #{jr value}" if display
    return R
  R = ( cfg.get key ) ? null
  validate[ type ] R if type?
  info "fontmirror #{key}: #{jr R}" if display
  return R

#-----------------------------------------------------------------------------------------------------------
@show_cfg = ->
  whisper "configuration values in #{cfg.path}"
  for key, value of cfg.all
    info ( CND.white ( key + ':' ).padEnd 50 ), ( CND.lime value )
  return null


# ############################################################################################################
# if require.main is module then do =>
#   debug '^334521^'


