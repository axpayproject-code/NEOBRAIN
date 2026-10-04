# Data sources and reuse

The software license in `LICENSE` applies to the project code and documentation. It does not relicense third-party data. Each dataset retains its source-specific conditions and attribution.

| Source | Material in this project | Reuse notes |
|---|---|---|
| NASA POWER | Iloilo City reference-point daily rainfall and temperature | Attribute NASA Langley Research Center / POWER, service version, and access date. NASA POWER asks users to notify the project when data are transmitted to other researchers. Review the [NASA POWER referencing guide](https://power.larc.nasa.gov/docs/referencing/) before publishing a repository that contains the downloaded series. |
| Philippine Statistics Authority | PSGC names/codes/population and provincial palay context | The PSA site states its content is CC BY 4.0 unless otherwise stated. Preserve PSA attribution and the source links in `data/source_register.csv`. Check the specific release for any additional conditions. |
| DOST-PAGASA | Advisory summary and CliMap references | The included advisory entry is a short attributed summary linked to the official release. No CliMap download is included. CliMap data are registration-gated; do not commit downloaded files until the request terms explicitly permit redistribution. |

Before adding data, confirm its right to redistribute, preserve the original file where permitted, and update the source register with provider, source URL, retrieval date, geography, temporal coverage, units, transformations, license/terms, and limitations. Never commit client or personally identifying data.
