/**
 * PricingPDF - Componente para generar PDF de propuesta económica
 * Diseño branded con logo y colores Gard
 * Paginación automática según cantidad de items
 */

import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';
import { PricingData } from '@/types/presentation';

interface PricingPDFProps {
  clientName: string;
  quoteNumber: string;
  quoteDate: string;
  pricing: PricingData;
  contactEmail?: string;
  contactPhone?: string;
}

// Estilos branded de Gard
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2 solid #00d4aa',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  clientInfo: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderBottom: '2 solid #00d4aa',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  tableCell: {
    fontSize: 10,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderTop: '2 solid #00d4aa',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00d4aa',
  },
  note: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  termsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  termItem: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: '1 solid #e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 9,
    color: '#94a3b8',
  },
});

export function PricingPDF({ 
  clientName, 
  quoteNumber, 
  quoteDate,
  pricing,
  contactEmail = 'carlos.irigoyen@gard.cl',
  contactPhone = '+56 98 230 7771'
}: PricingPDFProps) {
  // Calcular paginación
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(pricing.items.length / ITEMS_PER_PAGE);
  
  // Split items en páginas
  const pages: typeof pricing.items[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(pricing.items.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE));
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header en cada página */}
          <View style={styles.header}>
            {/* Logo Gard - Imagen real */}
            <PDFImage 
              src="/Logo Gard azul.webp"
              style={styles.logo}
            />
            
            <Text style={styles.title}>Propuesta Económica</Text>
            <Text style={styles.clientInfo}>Para: {clientName}</Text>
            <Text style={styles.subtitle}>Cotización: {quoteNumber}</Text>
            <Text style={styles.subtitle}>Fecha: {quoteDate}</Text>
          </View>
          
          {/* Tabla */}
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descripción</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>P. Unit.</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Subtotal</Text>
            </View>
            
            {/* Items */}
            {pageItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(item.unit_price)}</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
          </View>
          
          {/* Total solo en última página */}
          {pageIndex === pages.length - 1 && (
            <>
              {/* Total Neto */}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { flex: 1 }]}>TOTAL NETO MENSUAL</Text>
                <Text style={[styles.totalAmount, { flex: 1, textAlign: 'right' }]}>{formatCurrency(pricing.subtotal)}</Text>
              </View>
              
              <Text style={styles.note}>Valores netos. IVA se factura según ley.</Text>
              
              {/* Términos */}
              {(pricing.payment_terms || pricing.adjustment_terms) && (
                <View style={styles.termsSection}>
                  <Text style={styles.termsTitle}>Condiciones Comerciales</Text>
                  {pricing.payment_terms && (
                    <Text style={styles.termItem}>• Forma de pago: {pricing.payment_terms}</Text>
                  )}
                  {pricing.adjustment_terms && (
                    <Text style={styles.termItem}>• Reajuste: {pricing.adjustment_terms}</Text>
                  )}
                  {pricing.notes && pricing.notes.map((note, i) => (
                    <Text key={i} style={styles.termItem}>• {note}</Text>
                  ))}
                </View>
              )}
            </>
          )}
          
          {/* Footer en cada página */}
          <View style={styles.footer} fixed>
            <View>
              <Text style={styles.footerText}>{contactEmail}</Text>
              <Text style={styles.footerText}>{contactPhone}</Text>
            </View>
            <Text style={styles.pageNumber}>Página {pageIndex + 1} de {totalPages}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
