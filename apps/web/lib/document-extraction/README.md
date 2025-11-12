# Document Extraction Library

A reusable, industry-agnostic document extraction system that supports multiple file types with smart detection and Azure OpenAI integration.

## Features

✅ **High-Resolution PDF to Image** - Converts PDFs to 300 DPI images for maximum accuracy  
✅ **Multiple File Types** - PDF, DOCX, XLSX, XLS, and Images  
✅ **Vision API Integration** - Processes PDF images with Azure OpenAI Vision API  
✅ **Industry Agnostic** - Designed for reuse across multiple industries  
✅ **Type Safe** - Full TypeScript support with comprehensive types  
✅ **Robust Error Handling** - Comprehensive validation and error messages  
✅ **Format Validation** - Validates file formats using magic numbers  
✅ **Size Limits** - Protects against memory issues with large files  
✅ **Password Detection** - Detects encrypted/password-protected files  

## Architecture

```
Document Upload → Validate Format → Convert/Extract → Azure OpenAI Vision → Response
                        ↓
                   PDF: High-Resolution Image Conversion
                   ├─ Format validation (magic numbers)
                   ├─ Size validation (50MB max)
                   ├─ Password detection
                   ├─ Convert to images (unpdf + @napi-rs/canvas)
                   ├─ Scale: 3.0 (300 DPI equivalent)
                   ├─ Max dimensions: 2048x2048 per page
                   └─ Send all pages to Vision API
                       
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
                   └─ Sent as data URLs
```

## Installation

Dependencies are already installed:
- `unpdf` - PDF rendering and page extraction
- `@napi-rs/canvas` - High-performance canvas for PDF to image conversion
- `mammoth` - DOCX text extraction
- `xlsx` - Excel file parsing (SheetJS)

These libraries provide:
- **unpdf**: Mozilla PDF.js wrapper for Node.js - industry standard PDF processing
- **@napi-rs/canvas**: Native Node.js canvas implementation (faster than node-canvas)
- High-quality image generation at 300 DPI equivalent
- Memory-efficient processing with configurable limits

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

### PDF to Images for Vision API

```typescript
import { 
  extractDocumentContent, 
  preparePdfForVision 
} from '@/lib/document-extraction'

const buffer = Buffer.from(pdfData)

// Convert PDF to high-resolution images
const pdfImages = await preparePdfForVision(buffer, {
  maxPages: 20,
  scale: 3.0, // 300 DPI equivalent
  maxImageWidth: 2048,
  maxImageHeight: 2048
})

console.log(`Converted ${pdfImages.length} pages to images`)
// Each image is a base64 data URL ready for Vision API
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

### PDF (High-Resolution Image Conversion)
- **All PDF types**: Converted to high-resolution images (300 DPI)
- **Image conversion**: Uses unpdf + @napi-rs/canvas
- **Multi-page support**: Processes up to 20 pages by default (configurable)
- **Quality settings**: Scale 3.0 for maximum detail preservation
- **Format validation**: Checks for valid PDF magic numbers (%PDF-)
- **Size limit**: 50MB maximum
- **Password detection**: Rejects encrypted/password-protected PDFs
- **Vision API**: All pages sent as images to Azure OpenAI
- **Best for**: Certificates, technical documents, forms, scanned documents, complex layouts

**Why image conversion?**
- Azure OpenAI Chat Completions API doesn't natively support PDFs
- Image conversion ensures compatibility and consistent results
- High resolution (300 DPI) preserves fine details, small text, and diagrams
- Works with both text-based and scanned PDFs

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
AZURE_OPENAI_VISION_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

## Options

### DocumentExtractionOptions

```typescript
{
  maxPages?: number | null        // Max PDF pages (default: 20, null = unlimited)
  scale?: number                   // PDF scale factor (default: 3.0 = 300 DPI)
  maxImageWidth?: number          // Max image width (default: 2048)
  maxImageHeight?: number         // Max image height (default: 2048)
  extractExcelStructured?: boolean // Extract Excel structured data (default: true)
}
```

**PDF Scale Guidelines:**
- `1.0` = 100 DPI (low quality, small file size)
- `2.0` = 200 DPI (medium quality)
- `3.0` = 300 DPI (high quality, recommended) ⭐
- `4.0` = 400 DPI (very high quality, larger files)

Higher scale = better quality but larger images and slower processing.

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

- **PDFs**: Medium to slow depending on pages
  - Image conversion: ~500-1000ms per page at 300 DPI
  - Vision API: ~2-5s per page
  - Total: ~2.5-6s per page
  - Example: 5-page PDF = ~15-30 seconds
- **DOCX**: Fast (~100-500ms for typical documents)
- **XLSX**: Fast to medium (~200ms-2s depending on size)
  - Truncated to 10,000 rows/sheet for performance
- **Images**: Medium (vision API, ~1-3s)

**Optimization Tips:**
- Limit pages for faster processing (`maxPages: 5`)
- Lower scale for speed over quality (`scale: 2.0`)
- Process in background for large PDFs

## Limitations

### PDF
- **Maximum file size**: 50MB
- **Maximum pages processed**: 20 by default (configurable with `maxPages`)
- **Image size**: 2048x2048 pixels max per page
- **Processing time**: Increases linearly with page count
- **Password-protected PDFs**: Not supported
- **Very large PDFs**: May cause memory issues or timeouts

### DOCX
- **Maximum file size**: 50MB
- **Complex formatting**: May not be preserved
- **Embedded images/objects**: Not extracted (text only)

### XLSX
- **Maximum file size**: 50MB
- **Row limit**: 10,000 rows per sheet (configurable)
- **Complex formulas**: Evaluated to values only
- **Macros and VBA code**: Not processed

### General
- **Vision API costs**: Apply for all PDF pages and images
- **Processing time**: Increases with file size and complexity
- **Network latency**: Affects Azure API calls
- **Memory usage**: High-resolution PDFs can be memory-intensive

## Future Enhancements

- [ ] Support for more file types (PPTX, RTF, etc.)
- [ ] Batch processing
- [ ] Caching extracted content
- [ ] Progress callbacks for long operations

