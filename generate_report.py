import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from wordcloud import WordCloud
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import string
import os
import re

# --- SETTINGS ---
file_path = "dbtt_class_feedback.csv"  # Adjust path if needed
stop_words = set("""
a about above after again against all am an and any are aren't as at be because been before being below between
both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from
further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his
how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor
not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should
shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd
they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were
weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you
you'd you'll you're you've your yours yourself yourselves
""".split())

def sanitize_filename(filename):
    """Convert a string into a safe filename by removing special characters."""
    # Replace spaces and special characters with underscores
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', filename)
    # Remove multiple consecutive underscores
    safe_name = re.sub(r'_+', '_', safe_name)
    # Remove leading/trailing underscores
    safe_name = safe_name.strip('_')
    return safe_name

# --- PREPROCESSING ---
def preprocess_text(text):
    if pd.isna(text):
        return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    return ' '.join([word for word in text.split() if word not in stop_words])

# --- LOAD DATA ---
df = pd.read_csv(file_path, encoding="ISO-8859-1")
open_ended_cols = df.columns[:5]
numeric_cols = df.columns[5:]
df_cleaned = df.copy()

# Preprocess open-ended text
for col in open_ended_cols:
    df_cleaned[col] = df_cleaned[col].apply(preprocess_text)

# --- WORD FREQUENCIES AND WORDCLOUD ---
summary = {}
for col in open_ended_cols:
    text = ' '.join(df_cleaned[col])
    vectorizer = CountVectorizer()
    matrix = vectorizer.fit_transform([text])
    word_freq = dict(zip(vectorizer.get_feature_names_out(), matrix.toarray()[0]))
    summary[col] = word_freq

# --- NUMERIC STATS ---
numeric_summary = df[numeric_cols].describe().round(2)

# --- GENERATE PDF ---
doc = SimpleDocTemplate(
    "class_feedback_report.pdf",
    pagesize=letter,
    rightMargin=72,
    leftMargin=72,
    topMargin=72,
    bottomMargin=72
)

# Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    spaceAfter=30,
    alignment=1  # Center alignment
)
heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=16,
    spaceAfter=20,
    keepWithNext=True  # Ensures heading stays with content
)
subheading_style = ParagraphStyle(
    'CustomSubHeading',
    parent=styles['Heading3'],
    fontSize=14,
    spaceAfter=10,
    keepWithNext=True  # Ensures subheading stays with content
)
normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    alignment=1  # Center alignment
)

# Create story (content)
story = []

# Title Page
title = Paragraph("Class Feedback Report", title_style)
date = Paragraph(f"Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d')}", normal_style)
story.extend([
    title,
    date,
    PageBreak()
])

# Open-ended Feedback Analysis
story.append(Paragraph("Open-ended Feedback Analysis", heading_style))

# Word Clouds
image_paths = []  # Keep track of generated images
for i in range(0, len(open_ended_cols), 2):  # Process two columns at a time
    # Create a group of elements for this page
    page_elements = []
    
    # Process up to two columns
    for j in range(2):
        if i + j < len(open_ended_cols):
            col = open_ended_cols[i + j]
            
            # Generate word cloud with 2:1 aspect ratio
            wc = WordCloud(width=800, height=400, background_color='white').generate_from_frequencies(summary[col])
            
            # Create safe filename
            image_path = f"{sanitize_filename(col)}_wordcloud.png"
            wc.to_file(image_path)
            image_paths.append(image_path)
            
            # Add header and image
            page_elements.append(Paragraph(col, subheading_style))
            # Use 5 inch width to maintain aspect ratio (original is 800x400, so 2:1)
            img = Image(image_path, width=5*inch, height=2.5*inch)
            page_elements.append(img)
            page_elements.append(Spacer(1, 30))  # Increased spacing between word clouds
    
    # Keep all elements for this page together
    story.append(KeepTogether(page_elements))
    
    # Add page break if not the last page
    if i + 2 < len(open_ended_cols):
        story.append(PageBreak())

# Quantitative Analysis (only once)
story.append(PageBreak())
story.append(Paragraph("Quantitative Feedback Summary", heading_style))

# Create table data
table_data = [['Metric', 'Mean', 'Std Dev', 'Min', 'Max']]
for col in numeric_summary.columns:
    stats = numeric_summary[col]
    table_data.append([
        Paragraph(col, ParagraphStyle('TableCell', fontSize=8, leading=10)),  # Wrap text in table
        f"{stats['mean']:.2f}",
        f"{stats['std']:.2f}",
        f"{stats['min']:.2f}",
        f"{stats['max']:.2f}"
    ])

# Create table with style
table_style = TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Left align first column (metric names)
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('TOPPADDING', (0, 1), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
])

# Create table with column widths
col_widths = [250, 60, 60, 60, 60]
table = Table(table_data, colWidths=col_widths, repeatRows=1)  # repeatRows=1 repeats header on new pages
table.setStyle(table_style)
story.append(table)

# Build PDF
doc.build(story)

# Clean up images after PDF is generated
for image_path in image_paths:
    if os.path.exists(image_path):
        os.remove(image_path)

print("✅ Report generated: class_feedback_report.pdf")