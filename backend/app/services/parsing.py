import pdfplumber
from docx import Document


def extract_pdf_pages(pdf_path):

    pages = []

    with pdfplumber.open(pdf_path) as pdf:

        for i, page in enumerate(pdf.pages):

            text = page.extract_text()

            if text:
                pages.append({
                    "page": i + 1,
                    "text": text
                })

    return pages


def extract_docx_pages(docx_path):

    doc = Document(docx_path)

    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        return []

    return [
        {
            "page": 1,
            "text": "\n".join(paragraphs)
        }
    ]
