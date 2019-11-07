
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
#...........................................................................................................
package_json              = require '../package.json'
@name                     = package_json.name
@version                  = package_json.version
cfg                       = new ( require 'configstore' ) @name, defaults

#-----------------------------------------------------------------------------------------------------------
### TAINT consider to move this to types module ###
types_by_keys =
  source_path:  'fontmirror_existing_folder'
  target_path:  'fontmirror_existing_folder'

#-----------------------------------------------------------------------------------------------------------
@set_or_get = ( key, value, display ) ->
  if value isnt undefined
    validate[ type ] value if ( type = types_by_keys[ key ] )?
    whisper "fontmirror #{key} set to #{jr value}" if display
    return cfg.set key, value
  R = ( cfg.get key ) ? null
  info "fontmirror #{key}: #{jr R}" if display
  return R

#-----------------------------------------------------------------------------------------------------------
@show_cfg = ->
  whisper "configuration values in #{cfg.path}"
  for key, value of cfg.all
    info ( CND.white ( key + ':' ).padEnd 50 ), ( CND.lime value )
  return null
