from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
from pypdf import PdfReader

SRC = Path('output/pdf')
DST = Path('output/word')
DST.mkdir(parents=True, exist_ok=True)

NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def run(text, bold=False, size=None):
    props = '<w:rPr>'
    if bold: props += '<w:b/>'
    if size: props += f'<w:sz w:val="{size}"/>'
    props += '</w:rPr>'
    return f'<w:r>{props}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

def para(text='', style=None, bold=False, size=None, center=False):
    ppr = ''
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if center: ppr += '<w:jc w:val="center"/>'
    if not text:
        return f'<w:p><w:pPr>{ppr}</w:pPr></w:p>'
    return f'<w:p><w:pPr>{ppr}</w:pPr>{run(text, bold, size)}</w:p>'

def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

def is_heading(line):
    return (line in {'Introducción', 'Conclusiones'} or line[:1].isdigit() and (line[1:2] == '.' or line[1:2].isdigit()) and len(line) < 90)

def make_docx(pdf):
    reader = PdfReader(str(pdf))
    body = []
    for page_no, page in enumerate(reader.pages):
        lines = [line.strip() for line in (page.extract_text() or '').splitlines()]
        for i, line in enumerate(lines):
            if not line:
                continue
            # The source cover begins with its actual title. Preserve it with a Word Title style.
            if page_no == 0 and i in (2, 3):
                body.append(para(line, 'Title', bold=True, size='32', center=True))
            elif is_heading(line):
                body.append(para(line, 'Heading1', bold=True, size='26'))
            elif line.startswith(('GA11-', 'BIDA -')):
                body.append(para(line, center=True))
            else:
                body.append(para(line, 'Normal'))
        if page_no != len(reader.pages)-1:
            body.append(page_break())
    sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/></w:sectPr>'
    document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{NS}"><w:body>{''.join(body)}{sect}</w:body></w:document>'''
    styles = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{NS}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="120"/></w:pPr></w:style>
</w:styles>'''
    content = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'''
    wordrels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>BIDA</dc:creator><dc:title>Evidencia GA11 BIDA</dc:title></cp:coreProperties>'''
    app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Word</Application></Properties>'''
    out = DST / f'{pdf.stem}.docx'
    with ZipFile(out, 'w', ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content); z.writestr('_rels/.rels', rels)
        z.writestr('word/document.xml', document); z.writestr('word/styles.xml', styles); z.writestr('word/_rels/document.xml.rels', wordrels)
        z.writestr('docProps/core.xml', core); z.writestr('docProps/app.xml', app)
    print(out)

for pdf in sorted(SRC.glob('*.pdf')):
    make_docx(pdf)
