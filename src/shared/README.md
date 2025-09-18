# Shared Parser Utilities

This directory contains shared utilities for processing server-rendered content in WordPress blocks.

## DOM-to-React Parser

The `dom-to-react-parser.js` file provides utilities for converting server-rendered HTML with `<InnerBlocks />` placeholders into React elements. The parser is compiled as a separate JavaScript file and loaded globally via PHP.

### Features

- **Global Availability**: Loaded once via PHP and available to all blocks
- **Universal Parser**: Works with any block that needs to process server-rendered content
- **InnerBlocks Support**: Automatically detects and replaces `<InnerBlocks />` placeholders
- **Flexible Configuration**: Customizable allowed blocks, templates, and wrapper selectors
- **DOM-to-React Conversion**: Converts HTML elements to React elements with proper attribute handling
- **Style Processing**: Converts inline CSS strings to React style objects

### How It Works

The parser is compiled as a separate JavaScript file (`build/shared/dom-to-react-parser.js`) and loaded globally via PHP in the main plugin file. This means:

1. **Single Load**: The parser is loaded once for all blocks
2. **Global Access**: Available as `window.NativeBlocksParser` in all block edit components
3. **No Imports**: Blocks don't need to import the parser - it's globally available
4. **Automatic Dependencies**: WordPress handles dependency loading via the asset file

### Usage

#### Basic Usage

```javascript
function Edit() {
    const [serverContent, setServerContent] = useState('');
    const blockProps = useBlockProps();

    // Fetch server content...
    
    return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps);
}
```

#### With InnerBlocks Configuration

```javascript
function Edit() {
    const [serverContent, setServerContent] = useState('');
    const blockProps = useBlockProps();

    return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps, {
        allowedBlocks: ['core/paragraph', 'core/heading', 'core/image'],
        template: [['core/paragraph', { placeholder: 'Add content...' }]],
        templateLock: false,
        wrapperSelector: '[class*="wp-block-"]'
    });
}
```

#### Minimal Configuration (Uses InnerBlocks defaults)

```javascript
function Edit() {
    const [serverContent, setServerContent] = useState('');
    const blockProps = useBlockProps();

    // Uses InnerBlocks default behavior - no restrictions
    return window.NativeBlocksParser.createServerContentRenderer(serverContent, blockProps);
}
```

#### Advanced Usage with Custom Parser

```javascript
function Edit() {
    const [serverContent, setServerContent] = useState('');
    const blockProps = useBlockProps();

    const parsed = window.NativeBlocksParser.parseServerContentWithInnerBlocks(serverContent, {
        allowedBlocks: ['core/paragraph'],
        template: [['core/paragraph']]
    });

    if (parsed) {
        return (
            <div {...blockProps} className={parsed.wrapperClasses}>
                {parsed.elements}
            </div>
        );
    }

    return <div {...blockProps} dangerouslySetInnerHTML={{ __html: serverContent }} />;
}
```

### API Reference

#### `createServerContentRenderer(serverContent, blockProps, options)`

Creates a React component that renders server content with optional InnerBlocks support.

**Parameters:**
- `serverContent` (string): The server-rendered HTML content
- `blockProps` (Object): Block properties from `useBlockProps()`
- `options` (Object): Configuration options (all optional)
  - `allowedBlocks` (Array|null): Array of allowed block types for InnerBlocks (optional)
  - `template` (Array|null): Template for InnerBlocks (optional)
  - `templateLock` (boolean): Whether template is locked (optional, defaults to false)
  - `wrapperSelector` (string): CSS selector for the wrapper element (optional, defaults to '[class*="wp-block-"]')

**Returns:** JSX.Element

#### `parseServerContentWithInnerBlocks(serverContent, options)`

Parses server content and returns parsed elements and wrapper classes.

**Parameters:**
- `serverContent` (string): The server-rendered HTML content
- `options` (Object): Configuration options (same as above)

**Returns:** Object with `{ elements, wrapperClasses }` or `null` if no placeholder found

### How It Works

1. **Detection**: Checks if the server content contains `<InnerBlocks />` placeholders
2. **Placeholder Replacement**: Replaces `<InnerBlocks />` with safe DOM placeholders
3. **DOM Parsing**: Parses the HTML into a DOM structure
4. **Wrapper Detection**: Finds the block wrapper element using CSS selector
5. **Recursive Conversion**: Converts DOM nodes to React elements recursively
6. **Attribute Processing**: Handles class names, inline styles, and other attributes
7. **InnerBlocks Integration**: Replaces placeholders with actual InnerBlocks components

### Benefits

- **Code Reuse**: Eliminates duplicate parsing logic across blocks
- **Consistency**: Ensures all blocks handle server content the same way
- **Maintainability**: Centralized logic is easier to update and debug
- **Flexibility**: Configurable options for different block requirements
- **Performance**: Optimized parsing and conversion process

### Integration with Block Registration

The parser works seamlessly with the PHP-side InnerBlocks processor:

1. **PHP Side**: `innerblocks-processor.php` handles server-side rendering
2. **JavaScript Side**: `dom-to-react-parser.js` handles client-side parsing
3. **Automatic Detection**: Blocks with `"innerBlocks": true` support get automatic processing

This creates a complete solution for blocks that need to render server content with InnerBlocks support.
