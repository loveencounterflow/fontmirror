
'use strict'

############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'UCDB'
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
FSP                       = FS.promises
PATH                      = require 'path'
{ assign
  jr }                    = CND
{ walk_cids_in_cid_range
  cwd_abspath
  cwd_relpath
  here_abspath
  _drop_extension
  project_abspath }       = require './helpers'
@types                    = require './types'
#...........................................................................................................
{ isa
  validate
  declare
  cast
  size_of
  last_of
  type_of }               = @types


#-----------------------------------------------------------------------------------------------------------
@_build_fontcache = ( me ) -> new Promise ( resolve, reject ) =>
  ### TAINT cache data to avoid walking the tree many times, see https://github.com/isaacs/node-glob#readme ###
  # validate.ucdb_clean_filename filename
  #.........................................................................................................
  fonts_home  = project_abspath '.', 'font-sources'
  pattern     = fonts_home + '/**/*'
  settings    = { matchBase: true, follow: true, stat:true, }
  R           = {}
  info "^ucdb@1003^ building font cache..."
  globber     = new _glob.Glob pattern, settings, ( error, filepaths ) =>
    return reject error if error?
    info "^ucdb@1004^ found #{filepaths.length} files"
    for filepath in filepaths
      unless ( stat = globber.statCache[ filepath ] )?
        ### TAINT stat missing file instead of throwing error ###
        return reject new Error "^77464^ not found in statCache: #{rpr filepath}"
      filename      = PATH.basename filepath
      continue if R[ filename ]?
      filesize      = stat.size
      R[ filename ] = { filepath, filesize, }
    resolve R

#-----------------------------------------------------------------------------------------------------------
@_describe_filename = ( me, filename ) ->
  filepath  = await @_locate_fontfile     me, filename
  filesize  = await @_filesize_from_path  me, filepath
  return { filepath, filesize, }


#-----------------------------------------------------------------------------------------------------------
@populate_table_outlines = ( me ) ->
  me.db.create_table_contents()
  me.db.create_table_outlines()
  known_hashes = new Set()
  ### TAINT do not retrieve all glyphrows, iterate instead; call @_insert_into_table_outlines with
  single glyphrow ###
  XXX_sql           = """
    select
        *
      from main
      order by cid;"""
  glyphrows         = ( row           for row from me.db.$.query XXX_sql        )
  fontnicks         = ( row.fontnick  for row from me.db.walk_fontnick_table()  )
  me._outline_count = 0
  debug "^ucdb@43847^ XXX_includes:", jr XXX_includes
  for fontnick in fontnicks
    continue if XXX_includes? and fontnick not in XXX_includes ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    info "^ucdb@1011^ adding outlines for #{fontnick}"
    @_insert_into_table_outlines me, known_hashes, fontnick, glyphrows
  me.db.finalize_outlines()
  return null

#-----------------------------------------------------------------------------------------------------------
@_get_false_fallback_pathdata_from_SVGTTF_font = ( me, SVGTTF_font ) ->
  fontnick  = SVGTTF_font.nick
  row       = ( me.db.$.first_row me.db.false_fallback_probe_from_fontnick { fontnick, } ) ? null
  return null unless row?
  cid       = row.probe.codePointAt 0
  d         = SVGTTF.glyph_and_pathdata_from_cid SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid
  return null unless d?
  return d.pathdata

#-----------------------------------------------------------------------------------------------------------
@_insert_into_table_outlines = ( me, known_hashes, fontnick, glyphrows ) ->
  ### NOTE to be called once for each font with all or some cid_ranges ###
  outlines_data     = []
  content_data      = []
  line_count        = 0
  duplicate_count   = 0
  batch_size        = 5000
  progress_count    = 100 ### output progress whenever multiple of this number reached ###
  # fragment insert_into_outlines_first(): insert into outlines ( iclabel, fontnick, pathdata ) values
  #.........................................................................................................
  ### TAINT refactor ###
  SVGTTF_font                 = {}
  SVGTTF_font.nick            = fontnick
  SVGTTF_font.path            = @filepath_from_fontnick me, fontnick
  SVGTTF_font.metrics         = SVGTTF.new_metrics()
  try
    SVGTTF_font.otjsfont        = SVGTTF.otjsfont_from_path SVGTTF_font.path
  catch error
    warn "^ucdb@1012^ when trying to open font #{rpr fontnick}, an error occurred: #{error.message}"
    return null
  # return null
  SVGTTF_font.advance_factor  = SVGTTF_font.metrics.em_size / SVGTTF_font.otjsfont.unitsPerEm
  XXX_advance_scale_factor    = SVGTTF_font.advance_factor * ( SVGTTF_font.metrics.global_glyph_scale ? 1 )
  #.........................................................................................................
  false_fallback_pathdata = @_get_false_fallback_pathdata_from_SVGTTF_font me, SVGTTF_font
  if false_fallback_pathdata?
    warn '^ucdb@6374445^', "filtering codepoints with outlines that look like fallback (placeholder glyph)"
  #.........................................................................................................
  for { iclabel, cid, glyph, } from cast.iterator glyphrows
    d = SVGTTF.glyph_and_pathdata_from_cid SVGTTF_font.metrics, SVGTTF_font.otjsfont, cid
    continue if ( not d? ) or ( false_fallback_pathdata? and ( d.pathdata is false_fallback_pathdata ) )
    whisper '^ucdb@1013^', me._outline_count - 1 if ( me._outline_count++ % progress_count ) is 0
    advance           = d.glyph.advanceWidth * XXX_advance_scale_factor
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    if ( isa.nan advance ) or ( advance is 0 )
      ### TAINT code repetition ###
      cid_hex = '0x' + ( cid.toString 16 ).padStart 4, '0'
      warn "^ucdb@3332^ illegal advance for #{SVGTTF_font.nick} #{cid_hex}: #{rpr advance}; setting to 1"
      advance           = 1
    ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    content           = jr { advance, pathdata: d.pathdata, }
    hash              = MIRAGE.sha1sum_from_text content
    #.......................................................................................................
    if known_hashes.has hash
      duplicate_count++
    else
      known_hashes.add hash
      content_data.push ( me.db.insert_into_contents_middle { hash, content, } ) + ','
    #.......................................................................................................
    outlines_data.push ( me.db.insert_into_outlines_middle { iclabel, fontnick, outline_json_hash: hash, } ) + ','
    if ( outlines_data.length + content_data.length ) >= batch_size
      line_count += @_flush_outlines me, content_data, outlines_data
  #.........................................................................................................
  line_count += @_flush_outlines me, content_data, outlines_data
  if duplicate_count > 0
    urge "^ucdb@3376^ found #{duplicate_count} duplicates for font #{fontnick}"
  return line_count

#-----------------------------------------------------------------------------------------------------------
@_flush_outlines = ( me, content_data, outlines_data ) ->
  ### TAINT code duplication, use ICQL method (TBW) ###
  #.........................................................................................................
  remove_comma = ( data ) ->
    last_idx          = data.length - 1
    data[ last_idx ]  = data[ last_idx ].replace /,\s*$/g, ''
    return null
  #.........................................................................................................
  store_data = ( name, data ) ->
    return if data.length is 0
    remove_comma data
    sql = me.db[ name ]() + '\n' + ( data.join '\n' ) + ';'
    me.db.$.execute sql
    data.length = 0
    return null
  #.........................................................................................................
  line_count      = content_data.length + outlines_data.length
  store_data 'insert_into_contents_first',   content_data
  store_data 'insert_into_outlines_first',  outlines_data
  me.line_count  += line_count
  return line_count


###
#-----------------------------------------------------------------------------------------------------------
@write_ucdb = ( settings = null ) ->
  t0      = Date.now()
  try
    ucdb  = await @create settings
  catch error
    warn error.message
    process.exit 1
  t1      = Date.now()
  dt      = t1 - t0
  dts     = ( dt / 1000 ).toFixed 3
  f       = ( ucdb.line_count / dt * 1000 ).toFixed 3
  help "^ucdb@1014^ wrote #{ucdb.line_count} records in #{dts} s (#{f} Hz)"
  return null
###
