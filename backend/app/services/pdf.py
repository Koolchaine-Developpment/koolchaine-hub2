import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from typing import List

class PDFService:
    @staticmethod
    def generate_packing_list_pdf(orders: List[dict]) -> bytes:
        """
        Generates a PDF packing list for the given orders.
        Returns the PDF as bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        
        normal_style = styles['Normal']
        
        # Header
        date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        elements.append(Paragraph(f"Koolchaine Hub - Liste de préparation (Bordereau)", title_style))
        elements.append(Paragraph(f"Date: {date_str} | Commandes à préparer: {len(orders)}", styles['Heading3']))
        elements.append(Spacer(1, 20))
        
        if not orders:
            elements.append(Paragraph("Aucune commande à préparer aujourd'hui.", normal_style))
            
        for order in orders:
            # Order details header
            elements.append(Paragraph(f"<b>Commande #{order.get('order_number')}</b> - {order.get('customer_name')}", styles['Heading4']))
            
            # Shipping Address string
            addr = order.get("shipping_address", {})
            addr_str = f"{addr.get('address1', '')} {addr.get('address2', '')}, {addr.get('zip', '')} {addr.get('city', '')} ({addr.get('country_code', '')})"
            elements.append(Paragraph(f"Expédition : {addr_str}", normal_style))
            elements.append(Spacer(1, 5))
            
            # Items table
            items = order.get("items", [])
            data = [["Produit", "Quantité", "SKU"]]
            for item in items:
                data.append([
                    item.get("name", "Inconnu"),
                    str(item.get("quantity", 1)),
                    item.get("sku", "N/A")
                ])
                
            table = Table(data, colWidths=[300, 100, 100])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 25))
            
        # Build document
        doc.build(elements)
        buffer.seek(0)
        return buffer.read()

pdf_service = PDFService()
