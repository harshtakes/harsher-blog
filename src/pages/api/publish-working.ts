export async function POST({ request }) {
  try {
    const { title, description, content, tags, date } = await request.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and content required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    // Create markdown content
    const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description ? description.replace(/"/g, '\\"') : ''}"
pubDate: "${date}"
author: "Harsh"
tags: [${tags.map(t => `"${t.trim()}"`).join(', ')}]
layout: ../../layouts/BlogPost.astro
---

${content}`;

    // GitHub API credentials (you'll need to set these as environment variables)
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = "harshtakes/harsher-blog";
    const GITHUB_OWNER = "harshtakes";

    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server not configured for publishing. Please contact admin.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Path in GitHub repo
    const filePath = `src/pages/blog/${slug}.md`;
    
    // Get current file to check if it exists
    let sha = null;
    try {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO.split('/')[1]}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // File doesn't exist, that's fine
    }

    // Create/update file in GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO.split('/')[1]}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `publish: ${title}`,
          content: Buffer.from(markdown).toString('base64'),
          ...(sha && { sha }) // Include sha if file exists (for update)
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish to GitHub');
    }

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
