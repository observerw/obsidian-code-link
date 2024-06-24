# Obsidian Code Link

Display code everywhere, and only the parts you're interested in!

![](./assets/main.png)

# Usage

1. First of all, please create a special folder in the repository for storing your code projects, the default path is "/project".
2. Open Command Palette and run `Code Link: Import project`, select the project folder you want to import, then the project will be imported into your Obsidian vault.
3. Open editor, link to the code file just like linking to a note, then you can preview the code in the editor. **Make sure that Settings - Files and Links - Detect all types of files are opened.**

# Preview

Supports hover preview and embed preview.

# Tag Search

<div style="display: flex; justify-content: center;">
    <img src="./assets/tag-search.png" width="50%">
</div>

When a tag search link is previewing, you can click on the tag list to display any parent tags.

Use [TreeSitter](https://tree-sitter.github.io/tree-sitter/) and [.scm files from zed editor](https://zed.dev/).

# Import Project Into Obsidian Vault

`Code Link: Import project`

Create a symlink to the project folder in your Obsidian vault.

Note that symlinks are just a reference to the original file, so if you delete the original file, the symlink will be broken.