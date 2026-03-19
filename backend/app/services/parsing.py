import pdfplumber
from docx import Document


class ParsingLimitError(Exception):

    def __init__(self, detail):
        super().__init__(detail)
        self.detail = detail


def extract_pdf_pages(pdf_path, max_pages=0, max_total_chars=0):

    pages = []
    total_chars = 0

    with pdfplumber.open(pdf_path) as pdf:

        for i, page in enumerate(pdf.pages):

            page_number = i + 1

            if max_pages > 0 and page_number > max_pages:
                raise ParsingLimitError(
                    f"Paper is too lengthy ({len(pdf.pages)} pages). Please upload up to {max_pages} pages."
                )

            text = page.extract_text()

            if text:
                total_chars += len(text)

                if max_total_chars > 0 and total_chars > max_total_chars:
                    raise ParsingLimitError(
                        "Paper is too lengthy for this deployment. Please upload a shorter paper."
                    )

                pages.append({
                    "page": page_number,
                    "text": text
                })

    return pages


def extract_docx_pages(docx_path, max_pages=0, max_total_chars=0):

    doc = Document(docx_path)

    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        return []

    text = "\n".join(paragraphs)

    if max_total_chars > 0 and len(text) > max_total_chars:
        raise ParsingLimitError(
            "Paper is too lengthy for this deployment. Please upload a shorter paper."
        )

    return [
        {
            "page": 1,
            "text": text
        }
    ]
