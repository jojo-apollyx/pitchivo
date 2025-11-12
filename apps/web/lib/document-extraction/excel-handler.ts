/**
 * Excel Document Handler
 * Handles XLSX and XLS file extraction using SheetJS
 */

import * as XLSX from 'xlsx'
import type { ExtractionResult, DocumentExtractionOptions } from './types'

const DEFAULT_OPTIONS: Required<Pick<DocumentExtractionOptions, 'extractExcelStructured'>> = {
  extractExcelStructured: true
}

/**
 * Extract content from Excel file
 */
export function extractExcelContent(
  excelBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): ExtractionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' })
    
    const structuredData: Record<string, any> = {
      sheets: {},
      summary: {
        totalSheets: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
      }
    }
    
    // Extract data from each sheet
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1, // Use array of arrays
        defval: '', // Default value for empty cells
        blankrows: false
      })
      
      structuredData.sheets[sheetName] = {
        data: jsonData,
        rowCount: jsonData.length,
        columnCount: jsonData[0]?.length || 0
      }
    })
    
    // Create text representation
    let textContent = ''
    for (const [sheetName, sheetData] of Object.entries(structuredData.sheets)) {
      const data = sheetData as { data: any[][]; rowCount: number; columnCount: number }
      
      textContent += `\n\n=== Sheet: ${sheetName} ===\n`
      textContent += `Rows: ${data.rowCount}, Columns: ${data.columnCount}\n\n`
      
      // Convert to readable table format
      data.data.forEach((row) => {
        textContent += row.join(' | ') + '\n'
      })
    }
    
    return {
      content: textContent,
      metadata: {
        method: 'xlsx',
        totalSheets: structuredData.summary.totalSheets,
        sheetNames: structuredData.summary.sheetNames
      },
      structuredData: opts.extractExcelStructured ? structuredData : undefined
    }
  } catch (error) {
    console.error('[Excel Handler] Extraction error:', error)
    throw new Error(
      `Excel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

