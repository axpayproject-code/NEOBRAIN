# Local data directory

Small attributed reference tables and advisory metadata are tracked with the project. The NASA POWER daily series and any downloaded CliMap export are excluded from Git by `.gitignore`; they are local inputs with provider-specific attribution or terms.

To recreate the exploratory NASA POWER point series, follow the commands in the root README. To use a CliMap export, first confirm redistribution and usage conditions, then use `scripts/prepare_climap.py`. Do not commit client or personal data.
