# Certificate automation

`generate-certificates.py` reads the `conference-registrations` sheet, keeps
only rows whose `status` is `approved`, and writes one certificate per person
plus a combined PDF.

```bash
python tools/generate-certificates.py --limit 2
python tools/generate-certificates.py --all
```

The supplied certificate PDF is preserved as the background. The participant
name and SRC ID are overlaid at the configured coordinates near the top of the
script. If the template's blank line is positioned differently, tune the four
coordinate constants once.
