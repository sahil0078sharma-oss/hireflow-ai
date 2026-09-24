import zipfile
import io

# Minimal valid DOCX structure
docx_buf = io.BytesIO()
with zipfile.ZipFile(docx_buf, "w") as docx:
    docx.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""")
    docx.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""")
    docx.writestr("word/document.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Rahul Sharma - Cloud &amp; AI Engineer</w:t></w:r></w:p>
    <w:p><w:r><w:t>Technical Skills: Python, Java, AWS Lambda, Amazon S3, Amazon RDS, MySQL, Docker, React, Git, Machine Learning</w:t></w:r></w:p>
    <w:p><w:r><w:t>Projects: Campus Placement Management Platform built with React and AWS Serverless.</w:t></w:r></w:p>
  </w:body>
</w:document>""")

with open("test_docs/sample_resume.docx", "wb") as f:
    f.write(docx_buf.getvalue())

print("Generated valid test DOCX: test_docs/sample_resume.docx")
