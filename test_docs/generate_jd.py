import zipfile
import io

# 1. TXT
jd_text = """Job Title: Cloud Software Engineer
Location: Bangalore, India
Requirements:
- Strong proficiency in Python, REST APIs, and modern JavaScript (React).
- Hands-on experience with AWS Cloud: AWS Lambda, Amazon S3, Amazon RDS MySQL.
- Solid understanding of SQL database design, indexing, and query optimization.
- Familiarity with Git, Docker containerization, and automated CI/CD pipelines.
- Experience or interest in NLP and Machine Learning fundamentals.
Responsibilities:
- Build and maintain serverless cloud applications on AWS.
- Collaborate with engineering teams to design resilient architectures."""

with open('test_docs/sample_jd.txt', 'w', encoding='utf-8') as f:
    f.write(jd_text)

# 2. PDF
pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 320 >>
stream
BT
/F1 12 Tf
72 720 Td
(Position: Cloud Software Engineer - AWS & Python) Tj
0 -20 Td
(Requirements: Python, AWS Lambda, Amazon S3, Amazon RDS, MySQL, Docker, Git) Tj
0 -20 Td
(Experience: Building scalable web services and cloud-native solutions) Tj
0 -20 Td
(Familiarity with Natural Language Processing, Machine Learning, and REST APIs) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000236 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
678
%%EOF
"""
with open('test_docs/sample_jd.pdf', 'wb') as f:
    f.write(pdf_content)

# 3. DOCX
docx_buf = io.BytesIO()
with zipfile.ZipFile(docx_buf, 'w') as docx:
    docx.writestr('[Content_Types].xml', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""")
    docx.writestr('_rels/.rels', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""")
    docx.writestr('word/document.xml', """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Target Job: Graduate Cloud Engineer (AWS &amp; Python)</w:t></w:r></w:p>
    <w:p><w:r><w:t>Requirements: Python, AWS Lambda, Amazon S3, Amazon RDS MySQL, Docker, React, Git, CI/CD pipelines.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Candidates must have foundational understanding of Machine Learning and NLP.</w:t></w:r></w:p>
  </w:body>
</w:document>""")

with open('test_docs/sample_jd.docx', 'wb') as f:
    f.write(docx_buf.getvalue())

print('Sample JD files created successfully!')
