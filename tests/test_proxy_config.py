from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'jenkins' / 'configure-proxy.py'
CONFIG = '''http {
    server {
        listen 80;
        server_name th-ain.beltontechnology.com;
        location / { return 301 https://$host$request_uri; }
    }
    server {
        listen 443 ssl;
        server_name th-ain.beltontechnology.com;
        location / { proxy_pass http://belton-chatbot; }
        location /n8n/ { proxy_pass http://n8n:5678/; }
    }
    server {
        listen 443 ssl;
        server_name cvat.beltontechnology.com;
    }
}
'''

class ProxyConfigTests(unittest.TestCase):
    def invoke(self, path, runner):
        with patch.object(sys, 'argv', [str(SCRIPT), str(path)]), patch('subprocess.run', runner):
            runpy.run_path(str(SCRIPT), run_name='__main__')

    def test_install_is_idempotent_and_preserves_other_routes(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'nginx.conf'
            path.write_text(CONFIG)
            inode = path.stat().st_ino
            runner = unittest.mock.Mock()
            self.invoke(path, runner)
            first = path.read_text()
            self.invoke(path, runner)
            self.assertEqual(first, path.read_text())
            self.assertEqual(inode, path.stat().st_ino)
            self.assertEqual(first.count('# BEGIN BELTONPREVIEW'), 1)
            self.assertIn('location /n8n/ { proxy_pass http://n8n:5678/; }', first)
            self.assertLess(first.index('listen 443 ssl'), first.index('# BEGIN BELTONPREVIEW'))
            backups = list(Path(folder).glob('*.bak'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_text(), CONFIG)

    def test_nginx_rejection_restores_original_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'nginx.conf'
            path.write_text(CONFIG)
            runner = unittest.mock.Mock(side_effect=[subprocess.CalledProcessError(1, 'nginx -t'), None])
            with self.assertRaises(subprocess.CalledProcessError):
                self.invoke(path, runner)
            self.assertEqual(path.read_text(), CONFIG)

    def test_unknown_server_is_left_untouched(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'nginx.conf'
            original = CONFIG.replace('th-ain.beltontechnology.com', 'other.example')
            path.write_text(original)
            with self.assertRaises(SystemExit):
                self.invoke(path, unittest.mock.Mock())
            self.assertEqual(path.read_text(), original)

if __name__ == '__main__':
    unittest.main()
