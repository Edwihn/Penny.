from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, ListFlowable, ListItem, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path(r"C:\Windows\Fonts")
pdfmetrics.registerFont(TTFont("Arial", str(FONT_DIR / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_DIR / "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Italic", str(FONT_DIR / "ariali.ttf")))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-Bold")

GREEN = colors.HexColor("#244C3E")
INK = colors.HexColor("#283A32")
MUTED = colors.HexColor("#68776D")
PALE = colors.HexColor("#F1F4EC")
GRID = colors.HexColor("#DDE4DA")
GOLD = colors.HexColor("#B49A64")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="DocTitle", fontName="Arial-Bold", fontSize=25, leading=30, textColor=GREEN, spaceAfter=10, keepWithNext=True))
styles.add(ParagraphStyle(name="Meta", fontName="Arial", fontSize=9, leading=13, textColor=MUTED, spaceAfter=12))
styles.add(ParagraphStyle(name="Intro", fontName="Arial", fontSize=10, leading=15, textColor=INK, spaceAfter=13))
styles.add(ParagraphStyle(name="H2Custom", fontName="Arial-Bold", fontSize=15.5, leading=18, textColor=GREEN, spaceBefore=11, spaceAfter=6, keepWithNext=True))
styles.add(ParagraphStyle(name="H3Custom", fontName="Arial-Bold", fontSize=11.5, leading=14, textColor=GREEN, spaceBefore=7, spaceAfter=4, keepWithNext=True))
styles.add(ParagraphStyle(name="BodyCustom", fontName="Arial", fontSize=9.2, leading=13.4, textColor=INK, spaceAfter=6, alignment=TA_LEFT, splitLongWords=True))
styles.add(ParagraphStyle(name="BulletCustom", parent=styles["BodyCustom"], leftIndent=15, firstLineIndent=-9, spaceAfter=4))
styles.add(ParagraphStyle(name="NumberCustom", parent=styles["BodyCustom"], leftIndent=19, firstLineIndent=-15, spaceAfter=4))
styles.add(ParagraphStyle(name="Cell", fontName="Arial", fontSize=8, leading=11, textColor=INK, spaceAfter=0))
styles.add(ParagraphStyle(name="CellHeader", fontName="Arial-Bold", fontSize=8, leading=10.5, textColor=colors.white, spaceAfter=0))


def inline_markup(text):
    text = text.replace("\u2013", "-").replace("\u2014", "-").replace("\u2011", "-").replace("\u2212", "-")
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font name="Arial">\1</font>', text)
    return text


def split_table_row(line):
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def make_table(rows, width):
    header = [Paragraph(inline_markup(cell), styles["CellHeader"]) for cell in rows[0]]
    body = [[Paragraph(inline_markup(cell), styles["Cell"]) for cell in row] for row in rows[1:]]
    count = len(header)
    if count == 3:
        proportions = [0.22, 0.21, 0.57]
    else:
        proportions = [1 / count] * count
    table = Table([header] + body, colWidths=[width * part for part in proportions], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def parse_markdown(path, available_width):
    lines = path.read_text(encoding="utf-8").splitlines()
    story = []
    index = 0
    first_heading = True
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line.startswith("|"):
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(split_table_row(lines[index]))
                index += 1
            table_lines = [row for row in table_lines if not all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in row)]
            story.extend([Spacer(1, 3), make_table(table_lines, available_width), Spacer(1, 7)])
            continue
        if line.startswith("# "):
            style = styles["DocTitle"] if first_heading else styles["H2Custom"]
            story.append(Paragraph(inline_markup(line[2:].strip()), style))
            first_heading = False
            index += 1
            continue
        if line.startswith("## "):
            story.append(Paragraph(inline_markup(line[3:].strip()), styles["H2Custom"]))
            index += 1
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:].strip()), styles["H3Custom"]))
            index += 1
            continue
        if re.match(r"^\d+\.\s+", line):
            items = []
            while index < len(lines) and re.match(r"^\d+\.\s+", lines[index].strip()):
                raw = re.sub(r"^\d+\.\s+", "", lines[index].strip())
                items.append(ListItem(Paragraph(inline_markup(raw), styles["BodyCustom"]), leftIndent=0))
                index += 1
            story.append(ListFlowable(items, bulletType="1", start="1", leftIndent=22, bulletFontName="Arial-Bold", bulletFontSize=9, bulletColor=GOLD, spaceAfter=5))
            continue
        if line.startswith("- "):
            items = []
            while index < len(lines) and lines[index].strip().startswith("- "):
                raw = lines[index].strip()[2:]
                items.append(ListItem(Paragraph(inline_markup(raw), styles["BodyCustom"]), leftIndent=0))
                index += 1
            story.append(ListFlowable(items, bulletType="bullet", start="circle", leftIndent=18, bulletFontName="Arial", bulletFontSize=8, bulletColor=GOLD, spaceAfter=5))
            continue
        if line.startswith("**") and line.endswith("**"):
            story.append(Paragraph(inline_markup(line), styles["Meta"]))
            index += 1
            continue
        paragraph_lines = [line]
        index += 1
        while index < len(lines):
            candidate = lines[index].strip()
            if not candidate or candidate.startswith(("#", "|", "- ")) or re.match(r"^\d+\.\s+", candidate):
                break
            paragraph_lines.append(candidate)
            index += 1
        pstyle = styles["Intro"] if len(story) == 1 else styles["BodyCustom"]
        story.append(Paragraph(inline_markup(" ".join(paragraph_lines)), pstyle))
    return story


class FooterDocTemplate(BaseDocTemplate):
    def __init__(self, filename, title, lang):
        self.doc_title = title
        self.doc_language = lang
        super().__init__(filename, pagesize=letter, leftMargin=0.72 * inch, rightMargin=0.72 * inch, topMargin=0.76 * inch, bottomMargin=0.68 * inch, title=title, author="Penny project team", subject="Project background, Scrum roles, and scope")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=self.draw_chrome)])

    def draw_chrome(self, canvas, doc):
        canvas.saveState()
        page_w, page_h = letter
        canvas.setStrokeColor(GRID)
        canvas.setLineWidth(0.6)
        canvas.line(self.leftMargin, page_h - 0.48 * inch, page_w - self.rightMargin, page_h - 0.48 * inch)
        canvas.setFont("Arial-Bold", 8)
        canvas.setFillColor(GREEN)
        canvas.drawString(self.leftMargin, page_h - 0.39 * inch, "PENNY")
        canvas.setFont("Arial", 8)
        canvas.setFillColor(MUTED)
        footer_y = 0.4 * inch
        canvas.line(self.leftMargin, footer_y + 0.15 * inch, page_w - self.rightMargin, footer_y + 0.15 * inch)
        footer = "Fundamentos del proyecto" if self.doc_language == "es" else "Project foundations"
        canvas.drawString(self.leftMargin, footer_y - 0.02 * inch, footer)
        canvas.drawRightString(page_w - self.rightMargin, footer_y - 0.02 * inch, f"{doc.page}")
        canvas.restoreState()


documents = [
    (ROOT / "docs" / "FUNDAMENTOS_PROYECTO_ES.md", "Penny: fundamentos del proyecto", "es", "penny-fundamentos-del-proyecto-es.pdf"),
    (ROOT / "docs" / "PROJECT_FOUNDATIONS_EN.md", "Penny: project foundations", "en", "penny-project-foundations-en.pdf"),
]

for source, title, lang, filename in documents:
    destination = OUTPUT / filename
    doc = FooterDocTemplate(str(destination), title, lang)
    story = parse_markdown(source, doc.width)
    doc.build(story)
    print(f"Created: {destination} ({destination.stat().st_size} bytes)")
