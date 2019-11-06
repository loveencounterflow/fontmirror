

# FontMirror

## Font Catalog

The FM Font Catalog is implemented as a number of directories which contain symbolic links (symlinks as
provided by the file system) to build collections of pointers to the objects of interest. Apart from reading
file metadata and file contents, FM will not touch, move or alter any object file, and it will not change
anything outside a designated catalog location; thus, all effects of its actions are purely local and
discardable without risk of data loss beyond what FM has produced itself.

In order to use FontMirror,

* give it a source location in the file system where to look for font files; call it `myfonts` and assume it
  points to, say, `/home/user/fonts`;

* give it a a target location where to store the resulting symlinks; let's say we tell it to use
  `/home/user/fmcatalog`;

The source is stored as a symlink in the `sources` subdirectory of the target, so there will be a symlink
`/home/user/fmcatalog/sources/myfonts ↷ /home/user/fonts`

FM will then go and and look for fonts by running [glob](https://github.com/isaacs/node-glob) against the
pattern `/home/user/fonts/**/*.+(otf|ttf|woff|woff2|ttc)`. For each file found, it will produce a nickname
(a fontnick) by substituting 'problematic' letters in the filename by unproblematic replacement characters;
the fontnicks then become the names to the fonts under `fmcatalog/all`.

> 'Problematic' in this case means 'cannot be used within a legal (Xe)(La)TeX name', as defined by
> [`latex3/unicode-data`](https://github.com/latex3/unicode-data); I realize this is a very specific
> requirement that may not suit every use case, so probably in the future the sanitizing rules will be made
> configurable.

Here is what `fmcatalog/all` might look like after this step:

```
fmcatalog/all/cwːteːxqyuanːmediumːttf           ↷ ../sources/myfonts/cwTeXQYuan-Medium.ttf
fmcatalog/all/simfangːttf                       ↷ ../sources/myfonts/simfang.ttf
fmcatalog/all/notoːserifːjpːblackːotf           ↷ ../sources/myfonts/NotoSerif/NotoSerifJP-Black.otf
fmcatalog/all/robotoːcondensedːboldːitalicːttf  ↷ ../sources/myfonts/Roboto/RobotoCondensed-BoldItalic.ttf
fmcatalog/all/sourceːcodeːproːboldːotf          ↷ ../sources/myfonts/SourceCodePro-Bold.otf
```





### Purpose and Method

### Fontnicks

FontMirror

### Tagging

Tags are notated as whitespace-less words with a `+` (plus sign) as prefix. U+002D `-` (hyphen-minus) is
not allowed in tags as it is reserved for future use as a negation operator.

Tags serve to positively identify subset of entities. For example, when one tags

* `a` as `+latin+vowel+letter`
* `b` as `+latin+consonant+letter`
* `A` as `+latin+vowel+letter+uppercase`
* `B` as `+latin+consonant+letter+uppercase`
* `&` as `+latin+symbol`
* `δ` as `+greek+consonant+letter`
* `Δ` as `+greek+consonant+letter+uppercase`

then

* `+latin`              selects `abAB&`
* `+latin+uppercase`    selects `AB`
* `+latin+letter`       selects `abAB`
* `+letter`             selects `abABδΔ`
* `+consonant`          selects `bBδΔ`

Combinations of tags (*combotags*) may be written without intervening spaces. As demonstrated above,
combotags select the *intersection* of their constituent tags, that is, adding another tag to an existing
combotag will always result in the selection staying constant or becoming smaller.



<!-- --------------------------------------------------------------------------------------------------- -->
> **Extensions (not implemented)**
>
> There is (currently) no way to express the *union* of tagged entities, as in 'give me everything tagged
> `+consonant` or `+symbol`' (which would result in `bB&δΔ`).
>
> The Universe of Discourse (Grundmenge) may be written as `+*` ('plus-any'), which selects `abAB&δΔ`.
>
> To exclude a subset identified by a common tag, that tag may be written with a leading `-` ('minus'), as
> in `+latin+letter-uppercase`, which selects `ab`.
>
> The set of all untagged entities may be written as `-*` ('minus-any').

<!-- --------------------------------------------------------------------------------------------------- -->


## Outline Cache



