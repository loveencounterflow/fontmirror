
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'FONTMIRROR/LINKS'
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
FS                        = require 'fs'
mkdirp                    = require 'mkdirp'
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
trash                     = require 'trash'

#-----------------------------------------------------------------------------------------------------------
@_lstat_safe = ( path ) ->
  try
    return FS.lstatSync path
  catch error
    return null if error.code is 'ENOENT'
    throw error

#-----------------------------------------------------------------------------------------------------------
@_get_symlink_status = ( source_path, target_path = null ) ->
  ### Given a `source_path` and an optional `target_path`, return the status of the assumed symlink
  at `source_path`: If no file system object can be found, status is `'nothing'`; if something is found
  but is not a symlink, an error is thrown; if it is a symlink, then if `target_path` is given and the
  symlink points to `target_path`, `'ok'` is returned, and `'symlink'` otherwise. ###
  return 'nothing' unless ( stats = @_lstat_safe source_path )?
  if stats.isSymbolicLink()
    return 'ok' if target_path? and ( FS.readlinkSync source_path ) is target_path
    return 'symlink'
  throw new Error "^fontmirror/links@3387^ expected symlink, found other file system object at #{source_path}"

#-----------------------------------------------------------------------------------------------------------
@link = ( source_path, target_path ) ->
  ### Create a link in `source_path` that points to `target_path`. This will fail with `EEXISTS` in case
  `source_path` already exists; use `relink()` instead to avoid having to deal with errors. ###
  FS.symlinkSync target_path, source_path

#-----------------------------------------------------------------------------------------------------------
@relink = ( source_path, target_path ) ->
  ### Like `link()`, but tries to always perfrom without error:
    * If `source_path` doesn't exist, then `link()` is executed;
    * if `source_path` does exist:
      * if `source_path` exists but is not a symlink, an error is raised;
      * if `source_path` is a symlink, then it is rewritten to point to `target_path` when necessary.
    Observe that inconsistencies may still result in case `source_path` is manipulated at the same
    time this method is running, as is always the case with FS-bound methods. The one error condition
    of `relink()` indicates that only the user can decide how to resolve the conflict if we want to
    avoid removing files other than symlinks. ###
  switch status = @_get_symlink_status source_path, target_path
    when 'nothing'  then null
    when 'ok'       then return 0
    when 'symlink'
      warn "removing #{source_path}"
      await trash source_path
    else throw new Error "^fontmirror/links@3344^ internal error: unexpected symlink status #{rpr status}"
  @link source_path, target_path
  return 1


############################################################################################################
if require.main is module then do =>
  debug '^334521^'
  source_path = '/tmp/x-link'
  target_path = '/tmp/x.txt'
  home        = PATH.dirname target_path
  mkdirp.sync home
  FS.writeFileSync target_path, 'helo'
  debug '^87541^', await @relink source_path, target_path
  @link '/tmp/foo', 'nonexistant'
  # try
  #   FS.linkSync target_path, source_path
  # catch error
  #   warn error.name
  #   warn error.code
  #   throw error

