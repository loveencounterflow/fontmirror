

'use strict'



############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/HELPERS'
log                       = CND.get_logger 'plain',     badge
debug                     = CND.get_logger 'debug',     badge
info                      = CND.get_logger 'info',      badge
warn                      = CND.get_logger 'warn',      badge
alert                     = CND.get_logger 'alert',     badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
#...........................................................................................................
@cwd_abspath              = CND.cwd_abspath.bind  CND
@cwd_relpath              = CND.cwd_relpath.bind  CND
@here_abspath             = CND.here_abspath.bind CND
@_drop_extension          = ( path ) -> path[ ... path.length - ( PATH.extname path ).length ]
@project_abspath          = ( ( P... ) -> @here_abspath __dirname, '..', P... ).bind @
PATH                      = require 'path'
FS                        = require 'fs'
types                     = require './types'
{ isa
  validate
  type_of
  defaults
  Failure }               = types

#-----------------------------------------------------------------------------------------------------------
@load_configuration = ->
  return Object.assign ( x.settings for x in @_load_configurations_from_standard_locations() )...

#-----------------------------------------------------------------------------------------------------------
@_load_configurations_from_standard_locations = ->
  home  = start_home = @project_abspath()
  R     = []
  loop
    break if home is '/'
    path = PATH.resolve PATH.join home, 'ucdb.json'
    try
      R.push { path, settings: ( require path ), }
    catch error
      throw error unless error.code is 'MODULE_NOT_FOUND'
    home = PATH.dirname home
  if R.length is 0
    throw new Error "^ucdb#2201 unable to locate file ucdb.json in any parent directory of #{start_home}"
  return R

#-----------------------------------------------------------------------------------------------------------
@_get_user_home = -> PATH.abspath ( require 'os' ).homedir()

# debug @load_configuration()
# debug ( k for k of require.main)
# debug require.main.filename
# debug ( require 'app-root-path' ).path
# debug ( require 'os' ).homedir()

# PATH                      = require 'path'
# #...........................................................................................................
# @assign                   = Object.assign


# info @here_abspath  '/foo/bar', '/baz/coo'
# info @cwd_abspath   '/foo/bar', '/baz/coo'
# info @here_abspath  '/baz/coo'
# info @cwd_abspath   '/baz/coo'
# info @here_abspath  '/foo/bar', 'baz/coo'
# info @cwd_abspath   '/foo/bar', 'baz/coo'
# info @here_abspath  'baz/coo'
# info @cwd_abspath   'baz/coo'
# info @here_abspath  __dirname, 'baz/coo', 'x.js'


#-----------------------------------------------------------------------------------------------------------
@walk_cids_in_cid_range = ( range ) =>
  ### TAINT this method should conceivably be in a type casting module ###
  return ( -> yield chr.codePointAt 0 for chr in [ range... ]                 )() if isa.text range
  ### TAINT do some type checking (must be list of two CIDs) ###
  return ( -> yield cid               for cid in [ range[ 0 ] .. range[ 1 ] ] )()


# #-----------------------------------------------------------------------------------------------------------
# @readable_stream_from_text = ( text ) ->
#   ### thx to https://stackoverflow.com/a/22085851/7568091 ###
#   R = new ( require 'stream' ).Readable()
#   R._read = () => {} # redundant?
#   R.push text
#   R.push null
#   return R




############################################################################################################
### TAINT the following methods that are prefixed with `SQL_` should become part of an updated ICQL APLI ###
############################################################################################################

#-----------------------------------------------------------------------------------------------------------
@SQL_text_as_literal = ( x ) ->
  ### NOTE: lifted from ICQL ###
  validate.text x
  "'" + ( x.replace /'/g, "''" ) + "'"

# #-----------------------------------------------------------------------------------------------------------
# @SQL_list_as_json_literal = ( x ) ->
#   ### NOTE: lifted from ICQL ###
#   validate.list x
#   return @SQL_text_as_literal JSON.stringify x

#-----------------------------------------------------------------------------------------------------------
@SQL_escape_value = ( x ) ->
  ### NOTE: lifted from ICQL ###
  switch type = type_of x
    when 'text'     then return @SQL_text_as_literal      x
    # when 'list'     then return @SQL_list_as_json_literal x
    when 'number'   then return x.toString()
    when 'boolean'  then return ( if x then '1' else '0' )
    when 'null'     then return 'null'
  throw new Failure '^sfm/sql@error_no_literal^', "unable to express a #{type} as SQL literal, got #{rpr x}"

#-----------------------------------------------------------------------------------------------------------
@SQL_generate_values_tuple = ( values ) ->
  validate.list values
  return '( ' + ( ( @SQL_escape_value x for x in values ).join ', ' ) + ' )'

