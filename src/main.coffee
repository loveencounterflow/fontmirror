
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
#...........................................................................................................
_glob                     = require 'glob'
glob                      = ( require 'util' ).promisify _glob
require                   './exception-handler'
PD                        = require 'pipedreams'
{ $
  $async
  $watch
  $show  }                = PD.export()
#...........................................................................................................
mkts_options              = require './_TEMPORARY_options'
mkts_glyph_styles         = mkts_options.tex[ 'glyph-styles' ]
MKNCR                     = require 'mingkwai-ncr'
SVGTTF                    = require 'svgttf'
MIRAGE                    = require 'sqlite-file-mirror'
# RCFG                      = require './read-configuration'
Multimix                  = require 'multimix'
#...........................................................................................................
runmode                   = 'production'
runmode                   = 'debug'
runmode                   = 'debug_small'
runmode                   = 'debug_cross_cjk'


#-----------------------------------------------------------------------------------------------------------
@read_rsgs = ( me ) -> return new Promise ( resolve ) ->
  #.........................................................................................................
  $as_datom = ->
    lnr = 0
    return $ ( line, send ) ->
      lnr++
      return null if ( isa.blank_text line )
      return null if ( line.match /^\s*#/ )?
      unless ( match = line.match /^(?<new_rsg>\S+)\s+(?<old_rsg>\S+)\s+(?<block_name>.+)$/ )?
        throw new Error "^ucdb@1001^ unexpected line format in line #{lnr}"
      send PD.new_datom '^entry', { match.groups..., lnr, }
  #.........................................................................................................
  $collect = ( collector ) ->
    last = Symbol 'last'
    return $ { last, }, ( d, send ) ->
      if d is last
        collector.new_by_old[ 'u'       ] = 'u-----'
        collector.old_by_new[ 'u-----'  ] = 'u'
        collector.new_by_old[ 'jzr'     ] = 'jzr---'
        collector.old_by_new[ 'jzr---'  ] = 'jzr'
        return send collector
      collector.new_by_old[ d.old_rsg ] = d.new_rsg
      collector.old_by_new[ d.new_rsg ] = d.old_rsg
  #.........................................................................................................
  # debug FS.readFileSync path
  # debug path
  path      = project_abspath '../../io/mingkwai-rack/jzrds/ucdx/rsgs.txt'
  pipeline  = []
  rsgs      = { new_by_old: {}, old_by_new: {} }
  pipeline.push PD.read_from_file path
  pipeline.push PD.$split()
  pipeline.push $as_datom()
  pipeline.push $collect rsgs
  # pipeline.push PD.$show()
  pipeline.push PD.$drain -> me.rsgs = rsgs; resolve null
  PD.pull pipeline...


#-----------------------------------------------------------------------------------------------------------
@_get_iclabel = ( me, cid, glyph, csg, old_rsg ) ->
  unless ( new_rsg = me.rsgs.new_by_old[ old_rsg ] )?
    throw new Error "^ucdb@1002^ unknown RSG #{rpr old_rsg}"
  # A:uc0---:005750:坐
  switch csg
    when 'u'    then  realm = 'A'; swatch = glyph
    when 'jzr'  then  realm = 'I'; swatch = glyph
    when 'test' then  realm = 'X'; swatch = glyph
    else              realm = 'L'; swatch = '�'
  cid_hex = ( cid.toString 16 ).padStart 6, '0'
  return "#{realm}:#{new_rsg}:#{cid_hex}:#{swatch}"


#===========================================================================================================
# FONTNICKS
#-----------------------------------------------------------------------------------------------------------
@read_fontnicks = ( me ) ->
  R         = {}
  has_rows  = false
  for row from me.db.configured_fontnicks_and_files()
    { fontnick
      filename
      otf     }       = row
    has_rows          = true
    R[ fontnick ]     = { filename, }
    R[ fontnick ].otf = otf if otf?
  unless has_rows
    throw new Error "^ucdb@98567 unable to find any configured fonts"
  return R

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
@populate_table_fontnicks = ( me ) -> new Promise ( resolve, reject ) =>
  me.fontnicks    = await @read_fontnicks me
  font_cache      = await @_build_fontcache me
  preamble        = []
  data            = []
  line_count      = 0
  preamble.push me.db.create_table_fontnicks_first()
  #.........................................................................................................
  for fontnick, { filename, otf, } of me.fontnicks
    line_count++
    unless ( cache_entry = font_cache[ filename ] )?
      warn '^4432^', "unable to find fontnick #{fontnick}, filename #{filename}"
      continue
    { filepath
      filesize }    = cache_entry
    otf            ?= null
    row             = { fontnick, filename, filepath, filesize, otf, }
    data.push ( me.db.create_table_fontnicks_middle row ) + ','
  if ( last_idx = data.length - 1 ) > -1
    data[ last_idx ] = data[ last_idx ].replace /,\s*$/g, ''
  #.........................................................................................................
  sql         = [ preamble..., data..., ';', ].join '\n'
  me.db.$.execute sql
  me.line_count += line_count
  resolve null

#-----------------------------------------------------------------------------------------------------------
@_fontnick_from_tex_block = ( me, tex_block ) ->
  return null unless tex_block?
  # unless tex_block?
  #   throw new Error "^ucdb@1005^ tex_block must not be null"
  unless ( match = tex_block.match /^\\(?<texstyle>[a-zA-Z]+)\{\}$/ )?
    throw new Error "^ucdb@1006^ unexpected tex_block format #{rpr tex_block}"
  texstyle  = style?.cmd ? match.groups.texstyle
  # texstyle  = @_fontnick_from_texname texstyle
  unless ( fontnick = @fontnick_by_texstyles[ texstyle ] )?
    throw new Error "^ucdb@1007^ unknown texstyle #{rpr texstyle}"
  return fontnick

#-----------------------------------------------------------------------------------------------------------
@_fontnick_from_style = ( me, style = null ) ->
  return null unless ( style                )?
  return null unless ( command = style.cmd  )?
  validate.nonempty_text command
  unless ( fontnick = @fontnick_by_texstyles[ command ] )?
    # throw new Error "^ucdb@1008^ unknown texstyle #{rpr style}"
    warn "^ucdb@1008^ unknown texstyle #{rpr style}"
    return null
  return fontnick

#-----------------------------------------------------------------------------------------------------------
@_fontnick_from_style_or_tex_block = ( me, style, tex_block ) ->
  # try
  fontnick_A = @_fontnick_from_style      me, style
  fontnick_B = @_fontnick_from_tex_block  me, tex_block
  # catch error
  #   if not me._seen_unknown.has error.message
  #     me._seen_unknown.add error.message
  #     warn '^47474', fncr, glyph, error.message
  return fontnick_A ? fontnick_B ? null

#-----------------------------------------------------------------------------------------------------------
@_cleanup_style = ( me, style ) ->
  return null unless style?
  ### Remove redundant `cmd` property, drop empty styles: ###
  delete style.cmd  if style.cmd?
  return if ( Object.keys style ).length is 0 then null else style


#===========================================================================================================
# MAIN TABLE
#-----------------------------------------------------------------------------------------------------------
@_XXX_get_all_glyphs_as_list_from_cfg_glyphsets = ( me ) ->
  ### TAINT to be replaced by a configuration that maps from runmodes to sets of glyphs and fonts ###
  return Array.from ( @_XXX_get_all_glyphstrings_from_cfg_glyphsets me ).join ''

@_XXX_get_all_glyphstrings_from_cfg_glyphsets = ( me ) ->
  ### TAINT to be replaced by a configuration that maps from runmodes to sets of glyphs and fonts ###
  return ( row.glyphs for row from me.db.$.query "select setname, glyphs from cfg_glyphsets;"  )

#-----------------------------------------------------------------------------------------------------------
@populate_table_main = ( me ) -> new Promise ( resolve, reject ) =>
  preamble          = []
  data              = []
  line_count        = 0
  me._seen_unknown  = new Set()
  preamble.push me.db.create_table_main_first()
  await @read_rsgs me
  cid_ranges        = @_XXX_get_all_glyphstrings_from_cfg_glyphsets me ### TAINT see remark in method ###
  #.........................................................................................................
  for cid_range in cid_ranges
    #.......................................................................................................
    ### TAINT use casting or call subroutine to derive range iterator ###
    if isa.text cid_range
      cids = ->
        for _glyph in [ cid_range... ]
          yield _glyph.codePointAt 0
    #.......................................................................................................
    else
      cids = ->
        for cid in [ cid_range[ 0 ] .. cid_range[ 1 ] ]
          yield cid
    #.......................................................................................................
    for cid from cids()
      whisper '^ucdb@1009^', ( CND.format_number line_count ) if ( ++line_count % 10000 ) is 0
      description = MKNCR.describe cid
      glyph       = String.fromCodePoint cid
      style       = mkts_glyph_styles[ glyph ] ? null
      tags        = ( description?.tag ? [] ).sort()
      is_u9cjkidg = ( 'assigned' in tags ) and ( 'cjk' in tags ) and ( 'ideograph' in tags )
      tags        = ';' + ( tags.join ';' ) + ';'
      csg         = description?.csg            ? null
      rsg         = description?.rsg            ? null
      fncr        = description?.fncr           ? null
      sfncr       = description?.sfncr          ? null
      ncr         = description?.ncr            ? null
      xncr        = description?.xncr           ? null
      iclabel     = @_get_iclabel me, cid, glyph, csg, rsg
      # tex_glyph   = description?.tex?.codepoint ? null
      #.....................................................................................................
      # tex_block   = description?.tex?.block     ? null
      # fontnick    = @_fontnick_from_style_or_tex_block me, style, tex_block
      # unless fontnick?
      #   warn "^ucdb@1010^ missing fontnick for #{fncr} #{glyph}"
      #   continue
      # style       = jr @_cleanup_style me, style
      #.....................................................................................................
      row         = {
        iclabel, glyph, cid, is_u9cjkidg, tags,
        csg, rsg, fncr, sfncr, ncr, xncr, }
      data.push ( me.db.create_table_main_middle row ) + ','
  #.........................................................................................................
  if ( last_idx = data.length - 1 ) > -1
    data[ last_idx ] = data[ last_idx ].replace /,\s*$/g, ''
  #.........................................................................................................
  sql             = [ preamble..., data..., ';', ].join '\n'
  me.db.$.execute sql
  me.line_count  += line_count
  me.db.create_main_indexes()
  resolve { line_count, }
  return null


#===========================================================================================================
# OUTLINES
#-----------------------------------------------------------------------------------------------------------
@filepath_from_fontnick = ( me, fontnick ) -> me.db.$.single_value me.db.filepath_from_fontnick { fontnick, }

#-----------------------------------------------------------------------------------------------------------
@populate_table_outlines = ( me ) ->
  me.db.create_table_contents()
  me.db.create_table_outlines()
  known_hashes = new Set()
  XXX_includes      = null
  # XXX_includes      = 'jizurafourbmp'
  # XXX_includes      = 'kai'
  # XXX_includes      = """sunexta sourcehansansboldone sourcehansansboldsix sourcehansansboldthree"""
  # XXX_includes      = """sunexta thtshynptwo thtshynpone fandolheibold
  #   sourcehansansboldone
  #   sourcehansansboldtwo
  #   sourcehansansboldthree
  #   sourcehansansboldfour
  #   sourcehansansboldfive
  #   sourcehansansboldsix
  #   sourcehansansboldseven
  #   sourcehansansboldeight
  #   sourcehanserifheavyjapan
  #   sourcehanserifregularjapan
  #   sourcehanserifheavykorea
  #   sourcehanserifregularkorea
  #   sourcehanserifheavymainland
  #   sourcehanserifregularmainland
  #   sourcehanserifheavytaiwan
  #   sourcehanserifregulartaiwan"""
  # XXX_includes      = """sourcehanserifheavyjapan
  #   sourcehanserifregularjapan
  #   sourcehanserifheavykorea
  #   sourcehanserifregularkorea
  #   sourcehanserifheavymainland
  #   sourcehanserifregularmainland
  #   sourcehanserifheavytaiwan
  #   sourcehanserifregulartaiwan"""
  # XXX_includes      = 'thtshynpone'
  # XXX_includes      = 'thtshynptwo'
  if XXX_includes?
    XXX_includes = XXX_includes.split /\s+/
    XXX_includes = XXX_includes.filter ( x ) -> x isnt ''
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


#===========================================================================================================
# DB CREATION
#-----------------------------------------------------------------------------------------------------------
@new_ucdb = ( settings = null ) ->
  defaults =
    db_path:    project_abspath './db/ucdb.db'
    icql_path:  project_abspath './db/ucdb.icql'
  #.........................................................................................................
  settings                = { defaults..., settings..., }
  validate.ucdb_settings settings
  #.........................................................................................................
  R                       = {}
  R.db                    = ( require './db' ).new_db settings
  R.dbr                   = R.db
  R.dbw                   = ( require './db' ).new_db settings
  R.line_count            = 0
  return R

#-----------------------------------------------------------------------------------------------------------
@create = ( settings = null ) -> new Promise ( resolve, reject ) =>
  me = @new_ucdb settings
  urge 'ucdb/create@1/4'
  await @read_configuration     me
  urge 'ucdb/create@2/4'
  await @populate_table_fontnicks   me
  urge 'ucdb/create@3/4'
  await @populate_table_main        me
  urge 'ucdb/create@4/4'
  await @compile_configurations me
  urge 'ucdb/create@5/4'
  await @populate_table_outlines    me
  urge 'ucdb/create@6/4'
  # me.db.create_view_main_with_deltas_etc()
  resolve me

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
  # count = 0
  # for row from ucdb.db.read_codepoint_records()
  #   count++
  #   break if count > 5
  #   info 'µ33211', jr row
  # help 'ok'

#-----------------------------------------------------------------------------------------------------------
### TAINT must go to configuration file ###
@fontnick_by_texstyles =
  latin:                                'lmromantenregular'
  cnjzr:                                'jizurathreeb'
  cnxa:                                 'sunexta'
  cnxb:                                 'sunflowerucjkxb'
  cnxc:                                 'hanaminb'
  cnxd:                                 'babelstonehan'
  cn:                                   'sunexta'
  hg:                                   'nanummyeongjo'
  hi:                                   'ipamp'
  ka:                                   'ipamp'
  mktsRsgFb:                            'sunexta'
  cncone:                               'babelstonehan' # CJK Compatibility 1
  cnUcjkcmp:                            'ipaexm'        # CJK Compatibility 1
  cnUcjkcmpf:                           'hanamina'      # CJK Compatibility 1
  cnUcjkcmpione:                        'hanamina'      # CJK Compatibility 1
  cnUcjkcmpitwo:                        'hanamina'      # CJK Compatibility 2
  cnrone:                               'sunexta'       # CJK Radicals 1
  cnrtwo:                               'sunexta'       # CJK Radicals 2
  cnsym:                                'hanamina'
  cnstrk:                               'sunexta'
  cnencsupp:                            'sarasaregular'
  cnxBabel:                             'babelstonehan'
  cnxHanaA:                             'hanamina'
  cnxHanaB:                             'hanaminb'
  cnxSunXA:                             'sunexta'
  cnxUming:                             'uming'
  #.........................................................................................................
  cnxJzr:                               'jizurathreeb'
  mktsFontfileAsanamath:                'asanamath'
  mktsFontfileCwtexqheibold:            'cwtexqheibold'
  mktsFontfileDejavuserif:              'dejavuserif'
  mktsFontfileEbgaramondtwelveregular:  'ebgaramondtwelveregular'
  mktsFontfileNanummyeongjo:            'nanummyeongjo'
  mktsFontfileSunexta:                  'sunexta'
  mktsStyleBoxDrawing:                  'iosevkatermslabmedium'

#-----------------------------------------------------------------------------------------------------------
### TAINT must go to configuration file ###
@fontnick_by_rsgs =
  'u-cjk-cmpi1':          'babelstonehan'
  'u-cjk-xd':             'babelstonehan'
  'u-cjk-sym':            'hanamina'
  'u-cjk-xc':             'hanaminb'
  'u-cjk-hira':           'ipamp'
  'u-cjk-kata':           'ipamp'
  'jzr':                  'jizurathreeb'
  'u-cdm':                'lmromantenregular'
  'u-cyrl':               'lmromantenregular'
  'u-cyrl-s':             'lmromantenregular'
  'u-grek':               'lmromantenregular'
  'u-latn':               'lmromantenregular'
  'u-latn-a':             'lmromantenregular'
  'u-latn-b':             'lmromantenregular'
  'u-punct':              'lmromantenregular'
  'u-latn-1':             'lmromantenregular'
  'u-hang-syl':           'nanummyeongjo'
  'u-arrow':              'sunexta'
  'u-arrow-b':            'sunexta'
  'u-boxdr':              'sunexta'
  'u-cjk-cmpf':           'sunexta'
  'u-llsym':              'sunexta'
  'u':                    'sunexta'
  'u-cjk-strk':           'sunexta'
  'u-cjk-xa':             'sunexta'
  'u-geoms':              'sunexta'
  'u-cjk':                'sunexta'
  'u-cjk-rad2':           'sunexta'
  'u-cjk-xb':             'sunflowerucjkxb'

# keys = [ 'cn', 'cncone', 'cnjzr', 'cnrone', 'cnrtwo', 'cnstrk', 'cnsym', 'cnxa', 'cnxb', 'cnxBabel', 'cnxc',
#   'cnxd', 'cnxHanaA', 'cnxHanaB', 'cnxJzr', 'cnxSunXA', 'cnxUming', 'hg', 'hi', 'ka', 'latin',
#   'mktsFontfileAsanamath', 'mktsFontfileCwtexqheibold', 'mktsFontfileDejavuserif',
#   'mktsFontfileEbgaramondtwelveregular', 'mktsFontfileNanummyeongjo', 'mktsFontfileSunexta', 'mktsRsgFb',
#   'mktsStyleBoxDrawing', ]

# for key in keys
#   info key unless @fontnick_by_texstyles[ key ]?


# #-----------------------------------------------------------------------------------------------------------
# @_find_fontnick_ranges = ( me = null ) ->
#   me ?= @new_ucdb()
#   me.db.create_view_main_with_deltas_etc()
#   # for row from me.db.main_with_deltas()
#   #   info '^77763^', row.iclabel, row.fontnick, row.rear_delta_cid, row.fore_delta_cid
#   for row from me.db.fontnick_boundaries()
#     # help '^77456^', row
#     help '^77763^', \
#       ( CND.yellow row.fontnick.padEnd 30 ),            \
#       ( CND.blue row.first_iclabel        ),            \
#       ( CND.blue row.last_iclabel         ),            \
#       ( CND.grey row.first_cid            ),            \
#       ( CND.grey row.last_cid             )
#       # ( CND.yellow row.cid.toString 16 ), \
#       # ( CND.orange if row.last_cid? then row.next_cid.toString 16 else '' )


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
MAIN = @
class Ucdb extends Multimix
  @include MAIN, { overwrite: false, }
  @include ( require './styles.mixin'         ), { overwrite: false, }
  @include ( require './configuration.mixin'  ), { overwrite: false, }
  # @extend MAIN, { overwrite: false, }

module.exports = UCDB = new Ucdb()


############################################################################################################
if require.main is module then do =>
  # info await @_build_fontcache null
  await @write_ucdb()

  # # await @read_rsgs null
  # @_find_fontnick_ranges()
  # help await @_describe_filename null, 'DejaVuSansMono-Bold.ttf'
  # help await @_describe_filename null, 'TH-Khaai-TP2.ttf'
  # help await @_locate_fontfile 'TH-Khaai-*.ttf'

# all_tags = """ascii-whitespace assigned bopomofo cjk geta hangeul hexagram hiragana ideograph idl jamo
#   japanese kana kanbun katakana korean kxr punctuation stroke syllable symbol trigram unassigned vertical
#   yijing"""



