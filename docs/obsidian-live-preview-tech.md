# Obsidian Live Preview Technical Document

## 1. Core Architecture: CodeMirror 6
Obsidian's Live Preview (LP) mode is built on **CodeMirror 6 (CM6)**. Unlike traditional markdown editors that separate "Edit" and "Preview" modes, Live Preview uses CM6's modular architecture to render rich content directly within the editor.

### Key Components
- **State Layer**: Manages the editor's content and configuration (Transactions, State Fields, Facets).
- **View Layer**: Handles DOM rendering and user interaction (View Plugins, Decorators, Widgets).

## 2. Extension Mechanisms

### State Fields
State Fields store persistent data within the `EditorState`. In Obsidian, they are often used to track the location of specific syntax blocks (like links or code blocks) that need special rendering.

### View Plugins
View Plugins are reactive components that listen to editor updates. They are typically used to create and update **Decorators**.

### Decorators and Widgets
- **Decorators**: Mark ranges of text to be styled or replaced.
- **Widgets**: DOM elements inserted into the editor.
    - **Inline Widgets**: Used for things like icons or small tags.
    - **Block Widgets**: Used for larger embeds (like code previews or math blocks). Block widgets must be managed via State Fields to correctly handle vertical layout changes.

## 3. Implementation Workflow for Plugins
To add a custom preview in Live Preview mode:
1. **Define a Widget**: Create a class extending `WidgetType` that implements `toDOM()` to render your custom content.
2. **Create a State Field/View Plugin**: 
    - Parse the document (using CM6's `SyntaxTree` or regular expressions) to find triggers (e.g., specific link patterns).
    - Generate `Decoration` objects (specifically `Decoration.widget`) at the target positions.
3. **Register the Extension**: Use `registerEditorExtension()` in the plugin's `onload` method.

## 4. Reading Mode vs. Live Preview
| Aspect | Reading Mode | Live Preview |
| --- | --- | --- |
| **API** | `MarkdownPostProcessor` | `EditorExtension` |
| **Lifecycle** | Triggered after markdown is converted to HTML. | Triggered in real-time as the user types/scrolls. |
| **DOM** | Static HTML preview. | Dynamic CodeMirror widgets. |
| **Context** | Access via `MarkdownPostProcessorContext`. | Access via `EditorView` and `EditorState`. |

## 5. Integration Best Practices
- **Performance**: Use incremental parsing. Avoid full-document scans on every keystroke.
- **Editability**: Ensure widgets don't break cursor movement or text selection.
- **Consistency**: Mirror styles used in Reading Mode to ensure a seamless experience across both views.
