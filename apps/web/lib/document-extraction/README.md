# Document Extraction Library

A reusable, industry-agnostic document extraction system that supports multiple file types with smart detection and Azure OpenAI integration.

## Features

✅ **Direct PDF Support** - PDFs sent directly to Azure OpenAI without conversion  
✅ **Multiple File Types** - PDF, DOCX, XLSX, XLS, and Images  
✅ **Vision API Integration** - Azure OpenAI handles both text and scanned PDFs automatically  
✅ **Industry Agnostic** - Designed for reuse across multiple industries  
✅ **Type Safe** - Full TypeScript support with comprehensive types  
✅ **Robust Error Handling** - Comprehensive validation and error messages  
✅ **Format Validation** - Validates file formats using magic numbers  
✅ **Size Limits** - Protects against memory issues with large files  
✅ **Password Detection** - Detects encrypted/password-protected files  

## Architecture

```
Document Upload → Validate Format → Extract/Process → Azure OpenAI → Response
                        ↓
                   PDF: Direct to Azure OpenAI Chat Completions API
                   ├─ Format validation (magic numbers)
                   ├─ Size validation (20MB max)
                   ├─ Password detection
                   └─ Sent as base64 data URL to Azure
                       
                   DOCX: Mammoth extraction
                   ├─ Format validation (ZIP magic numbers)
                   ├─ Size validation (50MB max)
                   ├─ Error categorization
                   └─ Text extraction with warnings
                       
                   XLSX: SheetJS extraction
                   ├─ Format validation (ZIP/OLE)
                   ├─ Size validation (50MB max)
                   ├─ Row limiting (10,000 rows/sheet)
                   └─ Per-sheet error handling
                       
                   Images: Direct Vision API
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

### PDF (Direct Azure OpenAI Processing)
- **All PDF types**: Sent directly to Azure OpenAI Chat Completions API
- **No conversion**: Azure handles both text-based and scanned PDFs
- **Automatic OCR**: Azure extracts text and images automatically
- **Multi-page support**: Handles documents up to Azure's page limits
- **Format validation**: Checks for valid PDF magic numbers (%PDF-)
- **Size limit**: 20MB (Azure Vision API limit)
- **Password detection**: Rejects encrypted/password-protected PDFs
- **Best for**: Certificates, technical documents, forms, scanned documents

### DOCX (Robust Mammoth Extraction)
- **Text extraction**: Uses `mammoth` library for accurate text parsing
- **Format validation**: Validates ZIP structure (DOCX magic numbers)
- **Size limit**: 50MB maximum
- **Warning handling**: Logs warnings for unsupported formatting
- **Empty document detection**: Handles documents with no extractable text
- **Error categorization**: Specific errors for corruption, memory issues
- **Best for**: Reports, specifications, contracts, documentation

### XLSX/XLS (Enhanced SheetJS Processing)
- **Full parsing**: Handles both XLSX (ZIP) and XLS (OLE) formats
- **Format validation**: Checks magic numbers for both formats
- **Size limit**: 50MB maximum
- **Row limiting**: 10,000 rows per sheet (prevents memory issues)
- **Multi-sheet support**: Processes all sheets with per-sheet error handling
- **Data type handling**: Properly parses dates, numbers, formulas
- **Truncation warnings**: Logs when sheets are truncated
- **Structured data**: Returns both text and JSON representations
- **Best for**: Data sheets, specifications, test results, formulations

### Images (Direct Vision API)
- **Direct processing**: Sent to Azure OpenAI Vision API as data URLs
- **Supports**: JPEG, PNG, GIF, WEBP
- **Best for**: Product photos, charts, diagrams, scanned documents

## Configuration

Environment variables required:

```env
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_VISION_DEPLOYMENT=gpt-4o  # Must be a vision-capable model
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

**Important**: The `AZURE_OPENAI_VISION_DEPLOYMENT` must point to a vision-capable model:
- ✅ gpt-4o (recommended)
- ✅ gpt-4o-mini
- ✅ gpt-4-turbo
- ✅ gpt-4-vision-preview
- ❌ gpt-3.5-turbo (no vision support)
- ❌ gpt-4 base (no vision support)

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

All functions throw descriptive errors with specific messages:

```typescript
try {
  const result = await extractDocumentContent(buffer, mimeType)
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
    // Examples of error messages:
    // - "Invalid PDF file format. The file may be corrupted..."
    // - "PDF file is too large (25.3MB). Maximum supported size is 20MB..."
    // - "PDF file appears to be password-protected..."
    // - "DOCX extraction failed: File appears to be corrupted..."
    // - "Excel extraction failed: File is password-protected..."
  }
}
```

### Error Categories

**Format Errors**
- Invalid file format (magic number check)
- Corrupted files
- Unsupported file types

**Size Errors**
- Files exceeding maximum size limits
- Memory issues with very large files

**Security Errors**
- Password-protected files
- Encrypted documents

**Content Errors**
- Empty documents
- No extractable text/data
- Parsing failures

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

- **PDFs**: Variable (depends on Azure API, typically 3-10s)
  - Azure handles both text and images automatically
  - Multi-page PDFs take longer
  - No local processing overhead
- **DOCX**: Fast (~100-500ms for typical documents)
- **XLSX**: Fast to medium (~200ms-2s depending on size)
  - Truncated to 10,000 rows/sheet for performance
- **Images**: Medium (vision API, ~1-3s)

## Limitations

### PDF
- Maximum file size: 20MB (Azure Vision API limit)
- Password-protected PDFs not supported
- Very large PDFs may timeout (consider page limits)

### DOCX
- Maximum file size: 50MB
- Complex formatting may not be preserved
- Embedded images/objects not extracted (text only)

### XLSX
- Maximum file size: 50MB
- Row limit: 10,000 rows per sheet (configurable)
- Complex formulas evaluated to values only
- Macros and VBA code not processed

### General
- Vision API costs apply for all PDFs and images
- Processing time increases with file size
- Network latency affects Azure API calls

## Best Practices

### File Upload
1. **Validate before upload**: Check file size client-side
2. **Show progress**: Long operations need user feedback
3. **Handle errors gracefully**: Display user-friendly error messages

### PDF Processing
1. **Use Azure directly**: Don't convert PDFs to images locally
2. **Monitor costs**: Vision API usage for all PDFs
3. **Page limits**: Consider limiting pages for very large PDFs
4. **Quality matters**: Higher quality scans = better extraction

### DOCX Processing
1. **Check file size**: Reject extremely large files early
2. **Handle warnings**: Log Mammoth warnings for debugging
3. **Text-only**: Understand that images are not extracted

### Excel Processing
1. **Row limits**: Default 10,000 rows per sheet prevents memory issues
2. **Multiple sheets**: Each sheet processed independently
3. **Data types**: Dates and numbers are formatted as strings
4. **Large files**: Consider async processing or streaming

### Error Handling
1. **Specific messages**: Use error messages to guide users
2. **Retry logic**: Implement retries for transient API errors
3. **Logging**: Log full errors for debugging, show simple messages to users

## Future Enhancements

- [ ] Support for PPTX files
- [ ] Batch processing API
- [ ] Caching extracted content
- [ ] Progress callbacks for long operations
- [ ] Streaming for very large files
- [ ] Configurable row limits per file type
- [ ] PDF page range selection
- [ ] Multiple language support

