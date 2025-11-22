'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
// TextStyle is required for Color extension
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
  Palette,
  Upload,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start typing...', 
  className,
  minHeight = '200px'
}: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: true,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-semibold prose-p:my-2',
          'prose-ul:my-2 prose-ol:my-2 prose-li:my-1',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Handle button clicks with proper editor state check
  const handleCommand = (command: () => void) => {
    if (!editor || !editor.isEditable) return
    command()
  }

  const openLinkDialog = () => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    const linkAttributes = editor.getAttributes('link')
    
    setLinkText(selectedText || linkAttributes.href || '')
    setLinkUrl(linkAttributes.href || '')
    setIsLinkDialogOpen(true)
  }

  const insertLink = () => {
    if (!editor || !linkUrl.trim()) return

    if (linkText.trim()) {
      // Insert link with custom text
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run()
    } else {
      // Apply link to selected text or insert URL
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      }
    }
    
    setIsLinkDialogOpen(false)
    setLinkUrl('')
    setLinkText('')
    toast.success('Link inserted successfully')
  }

  const removeLink = () => {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setIsLinkDialogOpen(false)
    toast.success('Link removed')
  }

  const openImageDialog = () => {
    setImageUrl('')
    setImageFile(null)
    setImagePreview(null)
    setIsImageDialogOpen(true)
  }

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async () => {
    if (!editor) return

    if (imageFile) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', imageFile)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const result = await response.json()
        const uploadedUrl = result.image.url

        editor.chain().focus().setImage({ src: uploadedUrl }).run()
        setIsImageDialogOpen(false)
        setImageFile(null)
        setImagePreview(null)
        toast.success('Image uploaded and inserted successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      } finally {
        setIsUploading(false)
      }
    } else if (imageUrl.trim()) {
      // Insert image from URL
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setIsImageDialogOpen(false)
      setImageUrl('')
      toast.success('Image inserted successfully')
    } else {
      toast.error('Please provide an image URL or upload a file')
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleBold().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleItalic().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleUnderline().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-muted')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings & Styles */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            className={cn('h-8 px-2 text-xs', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
            title="Heading"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleBlockquote().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('blockquote') && 'bg-muted')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleCodeBlock().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('codeBlock') && 'bg-muted')}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleBulletList().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().toggleOrderedList().run())}
            className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().setTextAlign('left').run())}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().setTextAlign('center').run())}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().setTextAlign('right').run())}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Link & Image */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openLinkDialog}
            className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-muted')}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openImageDialog}
            className="h-8 w-8 p-0"
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().undo().run())}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(() => editor.chain().focus().redo().run())}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Placeholder Shortcuts */}
        <div className="ml-auto flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
              >
                Insert Placeholder
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Pitchivo Placeholders</h4>
                  <div className="space-y-1.5">
                    {[
                      { code: '{{product_url}}', desc: 'Product page URL' },
                      { code: '{{product_name}}', desc: 'Product name' },
                      { code: '{{user_org_name}}', desc: 'Organization name' },
                      { code: '{{user_name}}', desc: 'Campaign creator' },
                      { code: '{{campaign_name}}', desc: 'Campaign name' },
                    ].map((placeholder) => (
                      <button
                        key={placeholder.code}
                        type="button"
                        onClick={() => {
                          editor.commands.insertContent(placeholder.code)
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-xs transition-colors"
                      >
                        <code className="font-mono text-primary">{placeholder.code}</code>
                        <span className="text-muted-foreground ml-2">- {placeholder.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Email Merge Tags</h4>
                  <div className="space-y-1.5">
                    {[
                      { code: '{first_name}', desc: 'Lead first name' },
                      { code: '{last_name}', desc: 'Lead last name' },
                      { code: '{full_name}', desc: 'Lead full name' },
                      { code: '{company_name}', desc: 'Lead company' },
                      { code: '{email}', desc: 'Lead email' },
                      { code: '{Title}', desc: 'Lead job title' },
                    ].map((placeholder) => (
                      <button
                        key={placeholder.code}
                        type="button"
                        onClick={() => {
                          editor.commands.insertContent(placeholder.code)
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-xs transition-colors"
                      >
                        <code className="font-mono text-primary">{placeholder.code}</code>
                        <span className="text-muted-foreground ml-2">- {placeholder.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        className="bg-background"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a link to your content. You can link to selected text or insert a new link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                placeholder="Enter link text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the URL as link text
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    insertLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="destructive"
                onClick={removeLink}
              >
                Remove Link
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={insertLink}
              disabled={!linkUrl.trim()}
            >
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Upload an image file or provide an image URL to insert into your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Upload Option */}
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <span>Choose Image</span>
                        </Button>
                      </Label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileSelect}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WEBP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            {/* URL Option */}
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={!!imageFile}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && imageUrl.trim() && !imageFile) {
                    uploadImage()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct image URL
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImageDialogOpen(false)
                setImageFile(null)
                setImagePreview(null)
                setImageUrl('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={uploadImage}
              disabled={(!imageFile && !imageUrl.trim()) || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Insert Image'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
