"""Install only the BeltonPreview location in the existing HTTPS server."""
from datetime import datetime, timezone
from pathlib import Path
import re
import subprocess
import sys

config = Path(sys.argv[1])
original = config.read_text(encoding='utf-8')
marker = '# BEGIN BELTONPREVIEW'
block = '''        # BEGIN BELTONPREVIEW
        location = /beltonpreview { return 308 /beltonpreview/; }
        location ^~ /beltonpreview/ {
            resolver 127.0.0.11 valid=10s ipv6=off;
            set $beltonpreview_backend beltonpreview:8080;
            proxy_pass http://$beltonpreview_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
        }
        # END BELTONPREVIEW
'''
if marker in original:
    updated, count = re.subn(r'^[ \t]*# BEGIN BELTONPREVIEW.*?# END BELTONPREVIEW\n?', block, original, flags=re.S | re.M)
    if count != 1:
        raise SystemExit('Expected exactly one managed BeltonPreview block')
else:
    if re.search(r'location[^\n{]*/beltonpreview', original):
        raise SystemExit('Existing unmanaged BeltonPreview location requires review')
    # Locate this host inside the HTTPS server; preserve every other route.
    candidates = list(re.finditer(r'^[ \t]*server_name\s+th-ain\.beltontechnology\.com\s*;', original, re.M))
    matches = []
    for match in candidates:
        start = original.rfind('server {', 0, match.start())
        if start >= 0 and re.search(r'listen\s+443\s+ssl', original[start:match.start()]):
            matches.append(match)
    if len(matches) != 1:
        raise SystemExit('Could not identify a unique TH-AIN HTTPS server')
    insertion = original.index('\n', matches[0].end()) + 1
    updated = original[:insertion] + block + original[insertion:]

if updated != original:
    backup = config.with_name(config.name + '.beltonpreview-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.bak')
    backup.write_text(original, encoding='utf-8')
    if backup.read_text(encoding='utf-8') != original:
        raise SystemExit('Backup verification failed')
    # Keep the inode: nginx bind-mounts this individual file.
    config.write_text(updated, encoding='utf-8')
    try:
        subprocess.run(['docker', 'exec', 'nginx-reverse-proxy', 'nginx', '-t'], check=True)
        subprocess.run(['docker', 'exec', 'nginx-reverse-proxy', 'nginx', '-s', 'reload'], check=True)
    except BaseException:
        config.write_text(original, encoding='utf-8')
        subprocess.run(['docker', 'exec', 'nginx-reverse-proxy', 'nginx', '-s', 'reload'], check=False)
        raise
    print(f'Installed /beltonpreview/ proxy; backup: {backup}')
else:
    subprocess.run(['docker', 'exec', 'nginx-reverse-proxy', 'nginx', '-t'], check=True)
    print('BeltonPreview proxy already configured')
