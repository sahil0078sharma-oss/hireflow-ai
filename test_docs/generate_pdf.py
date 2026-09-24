# Generates a minimal, valid standard PDF with text for testing
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
<< /Length 260 >>
stream
BT
/F1 12 Tf
72 720 Td
(Rahul Sharma - Software Engineer) Tj
0 -20 Td
(Skills: Python, AWS Lambda, Amazon S3, RDS, MySQL, React, Docker, Git) Tj
0 -20 Td
(Experience building full-stack applications with Python and machine learning.) Tj
0 -20 Td
(Education: B.Tech Computer Science, CGPA 8.4) Tj
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
618
%%EOF
"""

with open("test_docs/sample_resume.pdf", "wb") as f:
    f.write(pdf_content)

print("Generated valid test PDF: test_docs/sample_resume.pdf")
