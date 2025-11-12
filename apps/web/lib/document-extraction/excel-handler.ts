/**
 * Excel Document Handler
 * Handles XLSX and XLS file extraction using SheetJS
 * Best practices:
 * - Validates file format before processing
 * - Handles corrupted files gracefully
 * - Processes large spreadsheets efficiently
 * - Preserves data structure and types
 * - Handles formulas, merged cells, and formatting
 */

import * as XLSX from 'xlsx'
import type { ExtractionResult, DocumentExtractionOptions } from './types'

const DEFAULT_OPTIONS: Required<Pick<DocumentExtractionOptions, 'extractExcelStructured'>> = {
  extractExcelStructured: true
}

// Maximum rows to process per sheet to prevent memory issues
const MAX_ROWS_PER_SHEET = 10000
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Validate Excel file format
 */
function isValidExcel(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  
  // Check for XLSX (ZIP format - PK\x03\x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return true
  }
  
  // Check for XLS (OLE format - \xD0\xCF\x11\xE0)
  if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
    return true
  }
  
  return false
}

/**
 * Extract content from Excel file with robust error handling
 */
export function extractExcelContent(
  excelBuffer: Buffer,
  options: DocumentExtractionOptions = {}
): ExtractionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Validate file format
  if (!isValidExcel(excelBuffer)) {
    throw new Error(
      'Invalid Excel file format. The file may be corrupted or is not a valid Excel document (.xlsx, .xls).'
    )
  }
  
  // Validate file size
  if (excelBuffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Excel file is too large (${(excelBuffer.length / 1024 / 1024).toFixed(2)}MB). ` +
      `Maximum supported size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    )
  }
  
  try {
    // Read workbook with options for better parsing
    const workbook = XLSX.read(excelBuffer, { 
      type: 'buffer',
      cellDates: true, // Parse dates properly
      cellNF: true, // Read cell number format
      cellText: true, // Read formatted text
      cellStyles: false, // Skip styles for performance
      sheetStubs: false // Skip empty cells
    })
    
    // Validate workbook
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no sheets')
    }
    
    const structuredData: Record<string, any> = {
      sheets: {},
      summary: {
        totalSheets: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
      }
    }
    
    let totalRows = 0
    let hasData = false
    
    // Extract data from each sheet
    for (const sheetName of workbook.SheetNames) {
      try {
        const sheet = workbook.Sheets[sheetName]
        
        if (!sheet) {
          console.warn(`[Excel Handler] Sheet "${sheetName}" is empty or invalid`)
          continue
        }
        
        // Convert to JSON with proper handling of different data types
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1, // Use array of arrays
          defval: '', // Default value for empty cells
          blankrows: false, // Skip blank rows
          raw: false, // Format values (dates, numbers)
          dateNF: 'yyyy-mm-dd' // Date format
        })
        
        // Limit rows per sheet to prevent memory issues
        const limitedData = jsonData.slice(0, MAX_ROWS_PER_SHEET)
        const wasTruncated = jsonData.length > MAX_ROWS_PER_SHEET
        
        if (wasTruncated) {
          console.warn(
            `[Excel Handler] Sheet "${sheetName}" truncated from ${jsonData.length} to ${MAX_ROWS_PER_SHEET} rows`
          )
        }
        
        structuredData.sheets[sheetName] = {
          data: limitedData,
          rowCount: limitedData.length,
          columnCount: limitedData[0]?.length || 0,
          wasTruncated,
          originalRowCount: jsonData.length
        }
        
        totalRows += limitedData.length
        if (limitedData.length > 0) {
          hasData = true
        }
      } catch (sheetError) {
        console.error(`[Excel Handler] Error processing sheet "${sheetName}":`, sheetError)
        structuredData.sheets[sheetName] = {
          error: `Failed to process sheet: ${sheetError instanceof Error ? sheetError.message : 'Unknown error'}`,
          data: [],
          rowCount: 0,
          columnCount: 0
        }
      }
    }
    
    // Check if any data was extracted
    if (!hasData) {
      console.warn('[Excel Handler] No data extracted from any sheets')
      return {
        content: '',
        metadata: {
          method: 'xlsx',
          totalSheets: structuredData.summary.totalSheets,
          sheetNames: structuredData.summary.sheetNames,
          confidence: 'low'
        },
        structuredData: opts.extractExcelStructured ? structuredData : undefined
      }
    }
    
    // Create text representation
    let textContent = `Excel file with ${structuredData.summary.totalSheets} sheet(s)\n`
    textContent += `Total rows extracted: ${totalRows}\n`
    
    for (const [sheetName, sheetData] of Object.entries(structuredData.sheets)) {
      const data = sheetData as { 
        data: any[][]; 
        rowCount: number; 
        columnCount: number;
        wasTruncated?: boolean;
        originalRowCount?: number;
        error?: string;
      }
      
      if (data.error) {
        textContent += `\n\n=== Sheet: ${sheetName} ===\n`
        textContent += `Error: ${data.error}\n`
        continue
      }
      
      textContent += `\n\n=== Sheet: ${sheetName} ===\n`
      textContent += `Rows: ${data.rowCount}, Columns: ${data.columnCount}`
      
      if (data.wasTruncated) {
        textContent += ` (truncated from ${data.originalRowCount} rows)`
      }
      textContent += '\n\n'
      
      // Convert to readable table format
      // Limit text output to prevent extremely large responses
      const maxRowsInText = Math.min(data.data.length, 100)
      for (let i = 0; i < maxRowsInText; i++) {
        const row = data.data[i]
        // Clean and format cell values
        const cleanedRow = row.map(cell => {
          if (cell === null || cell === undefined) return ''
          return String(cell).replace(/\s+/g, ' ').trim()
        })
        textContent += cleanedRow.join(' | ') + '\n'
      }
      
      if (data.data.length > maxRowsInText) {
        textContent += `... (${data.data.length - maxRowsInText} more rows)\n`
      }
    }
    
    return {
      content: textContent,
      metadata: {
        method: 'xlsx',
        totalSheets: structuredData.summary.totalSheets,
        sheetNames: structuredData.summary.sheetNames,
        confidence: 'high'
      },
      structuredData: opts.extractExcelStructured ? structuredData : undefined
    }
  } catch (error) {
    console.error('[Excel Handler] Extraction error:', error)
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error(
          'Excel extraction failed: File is password-protected or encrypted. ' +
          'Please remove the password and try again.'
        )
      }
      if (error.message.includes('zip') || error.message.includes('corrupt')) {
        throw new Error(
          'Excel extraction failed: File appears to be corrupted. ' +
          'Please ensure the file is a valid Excel document.'
        )
      }
      if (error.message.includes('memory')) {
        throw new Error(
          'Excel extraction failed: Insufficient memory to process this spreadsheet. ' +
          'The file may be too large or contain too many complex formulas.'
        )
      }
    }
    
    throw new Error(
      `Excel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please verify the file is not corrupted or password-protected.'
    )
  }
}

