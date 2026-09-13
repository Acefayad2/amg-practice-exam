# Redesign production asset verification

**Passed.** Deployment `6aa60f52b05d0279db962ab7`, application commit `6b2fbe5325aa415d5804ee1a97358bf8058355a5`. Completed 2026-09-13T02:53:27.835Z.

All **215 canonical build assets** were read from production and compared with the exact PUBLISH/dist build inventory:

- **151 files match byte-for-byte**, including the new font, shared styles, runtime JavaScript, all lesson-data files and all captions.
- **64 HTML files** match after removing only the same previously reviewed **536-byte inert hosting-attribution block**. Its exact literal occurs once per affected page, wholly inside `<head>`. No arbitrary whitespace or other content normalization was allowed.
- The course home, practice dashboard and Part1 directory routes were separately fetched and reconciled. **Zero route failures or unexpected differences.** The previous homepage prototype-link normalization is not needed by this redesigned homepage.

The attribution contains an HTML comment and two ordinary named metadata tags, with no executable script or resource-loading element. The accepted literal and prior review provenance are recorded in known-host-attribution.json. This check changed no site settings, product files or media. No video/audio bodies or student state were requested. Complete static response bodies were hashed in memory and discarded.

| Evidence | SHA256 |
|---|---|
| [Final verification](live-assets.json) | `869d327cff63373f4378e05d566f160d3e4366effb77ea903a919c8798e8a1bd` |
| [Unmodified strict comparisons](live-assets-strict.json) | `010cb09c17199bae28c9c54b7439c5cde738501ec2720ff0a039f53f3a9efe10` |
| [Build inventory](build-assets.json) | `bc7403977c42153739cfe218180896fa4c1aef44db4afd7f085ebaba76867b09` |
| [Known attribution literal](known-host-attribution.json) | `4c9f8328b9b7e9ec2279f055f55f2f9851f35310dac5509fcaf577bbd9b150d3` |

Static byte verification is separate from the root and independent-agent production browser checks. No old release evidence was overwritten.
