import { promises as fs } from 'fs';
import path from 'path';

export async function POST({ request }) {
  try {
    const { title, description, content, tags, date } = await request.json();

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Create frontmatter
    const frontmatter = `---
title: "${title}"
description: "${description || ''}"
pubDate: "${date}"
author: "Harsh"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
layout: ../../layouts/BlogPost.astro
---

${content}`;

    // Write the file to the blog folder
    const postsDir = path.join(process.cwd(), 'src', 'pages', 'blog');
    const filePath = path.join(postsDir, `${slug}.md`);

    // Ensure directory exists
    try {
      await fs.mkdir(postsDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    // Write the markdown file
    await fs.writeFile(filePath, frontmatter, 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post published!',
        slug: slug
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Publishing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
