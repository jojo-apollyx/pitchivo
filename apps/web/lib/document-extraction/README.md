# Document Extraction Library

A reusable, industry-agnostic document extraction system that supports multiple file types with smart detection and Azure OpenAI integration.

## Features

✅ **Smart PDF Detection** - Automatically detects text-based, scanned, or mixed PDFs  
✅ **Multiple File Types** - PDF, DOCX, XLSX, XLS, and Images  
✅ **Vision API Integration** - Handles scanned PDFs and images with Azure OpenAI Vision  
✅ **Industry Agnostic** - Designed for reuse across multiple industries  
✅ **Type Safe** - Full TypeScript support with comprehensive types  
✅ **Error Handling** - Robust error handling and logging  

## Architecture

```
Document Upload → Detect Type → Extract Content → Azure OpenAI → Response
                       ↓
                  PDF: Smart Detection
                  ├─ Text-based → Direct extraction
                  ├─ Scanned → Vision API
                  └─ Mixed → Vision API
                       
                  DOCX → Mammoth extraction
                  XLSX → SheetJS extraction
                  Images → Direct Vision API
```

## Installation

Dependencies are already installed:
- `unpdf` - PDF text extraction and rendering
- `@napi-rs/canvas` - PDF to image conversion
- `mammoth` - DOCX text extraction
- `xlsx` - Excel file parsing

## Usage

### Basic Extraction

```typescript
import { extractDocumentContent } from '@/lib/document-extraction'

const buffer = Buffer.from(fileData)
const result = await extractDocumentContent(
  buffer,
  'application/pdf',
  'document.pdf'
)

console.log(result.content) // Extracted text
console.log(result.metadata) // Extraction metadata
```

### PDF with Vision API

```typescript
import { 
  extractDocumentContent, 
  processPdfWithVision 
} from '@/lib/document-extraction'

const buffer = Buffer.from(pdfData)
const extraction = await extractDocumentContent(buffer, 'application/pdf')

if (extraction.metadata.method === 'vision-ocr') {
  // PDF needs vision processing
  const result = await processPdfWithVision(
    buffer,
    'Extract all text from this document',
    { maxPages: 20 }
  )
  console.log(result.response) // OCR text
}
```

### Check if Vision is Needed

```typescript
import { requiresVisionProcessing } from '@/lib/document-extraction'

const needsVision = await requiresVisionProcessing(buffer, 'application/pdf')
if (needsVision) {
  // Use vision API
}
```

### Structured Data Extraction

```typescript
import { extractStructuredData } from '@/lib/document-extraction'

const schema = {
  name: "string",
  email: "string",
  phone: "string"
}

const data = await extractStructuredData(extractionResult, schema)
console.log(data) // Structured JSON
```

## File Type Support

### PDF
- **Text-based PDFs**: Direct text extraction using `unpdf`
- **Scanned PDFs**: Converted to images and processed with Vision API
- **Mixed PDFs**: Text extraction + Vision API for image pages

### DOCX
- Text extraction using `mammoth`
- Preserves basic formatting

### XLSX/XLS
- Full spreadsheet parsing with `xlsx`
- Supports multiple sheets
- Returns both text representation and structured data

### Images
- Direct processing with Azure OpenAI Vision API
- Supports: JPEG, PNG, GIF, WEBP

## Configuration

Environment variables required:

```env
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_VISION_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

## Options

### DocumentExtractionOptions

```typescript
{
  maxPages?: number | null        // Max PDF pages (default: 20, null = unlimited)
  imageScale?: number              // PDF image scale (default: 2.5)
  maxImageHeight?: number         // Max image height (default: 1998)
  extractExcelStructured?: boolean // Extract Excel structured data (default: true)
}
```

### AiProcessingOptions

```typescript
{
  prompt?: string                  // Custom AI prompt
  schema?: Record<string, any>     // Schema for structured extraction
  temperature?: number             // AI temperature (default: 0.3)
  maxTokens?: number              // Max tokens (default: 4000)
}
```

## API Reference

### Main Functions

#### `extractDocumentContent(buffer, mimeType, filename?, options?)`
Extract content from any supported document type.

#### `detectDocumentType(mimeType, filename?)`
Detect document type from MIME type or filename.

#### `requiresVisionProcessing(buffer, mimeType)`
Check if document requires vision API processing.

#### `processDocumentWithAI(buffer, mimeType, systemPrompt, options?)`
Process document with AI (handles vision automatically).

### PDF Functions

#### `extractPdfContent(buffer, options?)`
Extract content from PDF with smart detection.

#### `detectPdfType(buffer)`
Detect if PDF is text-based, scanned, or mixed.

#### `preparePdfForVision(buffer, options?)`
Convert PDF pages to images for vision API.

### DOCX Functions

#### `extractDocxContent(buffer)`
Extract text from DOCX file.

### Excel Functions

#### `extractExcelContent(buffer, options?)`
Extract content from Excel file.

### AI Functions

#### `processWithAI(extractionResult, options?)`
Process extracted content with Azure OpenAI.

#### `processPdfWithVision(buffer, systemPrompt, options?)`
Process PDF with vision API.

#### `extractStructuredData(extractionResult, schema, options?)`
Extract structured JSON data from document.

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  const result = await extractDocumentContent(buffer, mimeType)
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

## Integration with Existing System

The library is integrated with:
- `/api/documents/extract` - Main extraction endpoint
- Supabase storage - Document storage
- Document extractions table - Database tracking

## Industry Customization

The library is designed to be industry-agnostic. Industry-specific schemas and prompts are handled in the API routes, not in the extraction library itself.

To add industry-specific processing:

1. Create industry-specific schema in your API route
2. Use `extractStructuredData()` with your schema
3. Customize the system prompt for your industry

## Performance

- **Text-based PDFs**: Fast (direct extraction)
- **Scanned PDFs**: Slower (vision API, ~2-5s per page)
- **DOCX/XLSX**: Fast (direct parsing)
- **Images**: Medium (vision API, ~1-3s)

## Limitations

- PDF vision processing limited to 20 pages by default (configurable)
- Large Excel files may take longer to process
- Vision API costs apply for scanned PDFs and images

## Future Enhancements

- [ ] Support for more file types (PPTX, RTF, etc.)
- [ ] Batch processing
- [ ] Caching extracted content
- [ ] Progress callbacks for long operations

