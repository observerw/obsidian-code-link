# Obsidian Code Link

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/observerw/obsidian-code-link?style=flat) ![latest download](https://img.shields.io/github/downloads/observerw/obsidian-code-link/latest/total?style=plastic) 
[![Github release](https://img.shields.io/github/manifest-json/v/observerw/obsidian-code-link?color=blue)](https://github.com/observerw/obsidian-code-link/releases/latest) ![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/observerw/obsidian-code-link?include_prereleases&label=BRAT%20beta)

[ [English](./README.md) | [简体中文](./README-CN.md) ]

</div>

在 Obsidian 中展示代码，只展示你感兴趣的部分！

![main](./assets/main.png)

- **像链接笔记一样链接代码文件**，并且你可以**预览它们的内容**。
- 通过符号搜索/标签搜索/代码大纲（或者你想叫它什么都可以）, 你可以**直接链接到代码文件中的特定符号**（例如类、函数、或者类中的方法）。

通过使用符号创建链接，你可以在笔记中引用你感兴趣的代码部分，避免其他内容的干扰。这在学习复杂的开源项目时特别有用。

# ⚠️注意

- 为了能够使用内部链接链接到代码文件，请确保**设置 - 文件和链接 - 检测所有类型的文件**选项已启用。
- **嵌入式预览仅在阅读视图中有效**，所以如果你发现预览没有显示，请按 `Ctrl/Cmd + E` 切换到阅读视图。
- 在执行标签搜索之前，请确保设置 - 代码链接 - **启用标签搜索选项**已启用。

# 使用方法

1. 在 Obsidian 仓库中创建一个文件夹，用于存储导入的代码项目，路径默认为 `projects`。
2. 打开命令面板，运行 `Code Link: Import project`，选择要导入的项目文件夹（详见[下面的介绍](#将项目导入-obsidian-仓库)），然后项目将被导入到你在步骤 1 中创建的文件夹中。
3. 打开编辑器，像链接笔记一样链接到代码文件，然后就可以在编辑器中预览代码了。

# 代码预览

支持代码文件的悬停预览和嵌入式预览。

<div style="display: flex; justify-content: center;">
    <img src="./assets/hover.png" width="50%">
</div>

<div style="display: flex; justify-content: center;">
    <img src="./assets/embed.png" width="100%">
</div>

在嵌入式预览下方列出了对所引用的代码文件的链接，以及当前符号的标签路径（例如，如果你链接到一个名为 `methodB` 的方法，它在一个名为 `ClassA` 的类中，标签路径是 `class ClassA > def methodB`）。当你点击标签路径中的符号时，嵌入式预览将临时将显示的代码内容切换到该符号的内容。

# 标签搜索

**将光标放在代码链接的后面**（例如 `[[main.py]]|`，其中 `|` 是光标）将触发标签搜索。当在标签搜索中选择了指定的符号时，代码链接将被替换。从该位置处输入内容可以筛选tag search中的条目，如 `[[main.py]]def` 将会筛选出条目中所有包含 `def` 关键字的条目。注意输入的内容需要紧跟在 `]]` 之后。

<div style="display: flex; justify-content: center;">
    <img src="./assets/tag-search.png" width="50%">
</div>

⚠️注意：插件安装后，若标签搜索无法正常触发，尝试关闭并重新打开Obsidian。

此功能是通过 [TreeSitter](https://tree-sitter.github.io/tree-sitter/) 和 [zed 编辑器的 .scm 文件](https://zed.dev/) 实现的。当前支持的语言包括 C, C++, JavaScript, TypeScript, Rust, Go, Python。如果你希望支持更多的语言，请考虑模仿[现有的 `.scm` 文件](https://github.com/observerw/obsidian-code-link/tree/main/src/lang/data/scm)编写其他语言的 tree-sitter 查询，并提交一个Pull Request。感激不尽！

# 将项目导入 Obsidian 仓库

Obsidian 仅允许链接到仓库内的文件，所以你需要将项目导入到你的仓库中才能链接到它。

要导入项目，打开命令面板，运行 `Code Link: Import project`，然后选择要导入的项目文件夹。项目将被导入到 projects 文件夹中。

请注意，“导入”意味着创建符号链接（或者在 Windows 中指文件快捷方式）到原始文件。符号链接只是对原始文件的引用，所以如果你删除了原始文件，符号链接将会失效。