

# FontMirror

## Font Catalog

### Purpose and Method

### Fontnicks

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



