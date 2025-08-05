# n8n-nodes-sharp-pdf-merge

This is a custom node for n8n to merge a PDF (first page) with a PNG overlay using `sharp`.

## Inputs

- Binary input `pdf`: The base PDF file (only first page used)
- Binary input `overlay`: A PNG image to overlay

## Output

- One binary image file (PNG) with overlay applied.
