# -*- coding: utf-8 -*-
import os
import sys
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

folder = r'C:\งานโบ๊ท\โปรเจค\เนื้อหาอบรบสไลด์'
out_dir = r'ai\data\cr_discipline_extracted'
os.makedirs(out_dir, exist_ok=True)

for fname in os.listdir(folder):
    if fname.endswith('.pdf'):
        pdf_path = os.path.join(folder, fname)
        reader = pypdf.PdfReader(pdf_path)
        clean_name = fname.replace('.pdf', '.txt').replace(' ', '_').replace('&', 'and').replace('(', '').replace(')', '')
        out_path = os.path.join(out_dir, clean_name)
        
        pages_content = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ''
            if text.strip():
                pages_content.append(f'=== PAGE {idx+1} ===\n' + text)
                
        full_content = '\n\n'.join(pages_content)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
            
        print(f'Extracted: {fname} ({len(reader.pages)} pages) -> {clean_name} ({len(full_content)} chars)')
