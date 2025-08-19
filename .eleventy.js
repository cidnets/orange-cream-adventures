const { DateTime } = require("luxon");
const { format } = require("date-fns");
const markdownIt = require("markdown-it");
const markdownItDecorate = require('markdown-it-decorate');
const markdownItAttrs = require('markdown-it-attrs');
const { execSync } = require('child_process');

// --- START: Markdown-It External Links Plugin ---
function externalLinksPlugin(md) {
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex('href');

    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];

      // IMPORTANT: Customize this with your actual site's domain.
      const YOUR_SITE_HOSTNAME = 'bngo.pages.dev'; // <<<--- CUSTOMIZE THIS!

      const isExternalHttp = (href.startsWith('http://') || href.startsWith('https://')) &&
                             !href.includes(YOUR_SITE_HOSTNAME);
      const hasExistingTargetBlank = token.attrGet('target') === '_blank';

      if (isExternalHttp && !hasExistingTargetBlank) {
        let targetIndex = token.attrIndex('target');
        if (targetIndex < 0) {
          token.attrPush(['target', '_blank']);
        } else {
          token.attrs[targetIndex][1] = '_blank';
        }

        let relIndex = token.attrIndex('rel');
        if (relIndex < 0) {
          token.attrPush(['rel', 'noopener noreferrer']);
        } else {
          let relValue = token.attrs[relIndex][1];
          if (!relValue.includes('noopener')) {
            relValue += ' noopener';
          }
          if (!relValue.includes('noreferrer')) {
            relValue += ' noreferrer';
          }
          token.attrs[relIndex][1] = relValue.trim();
        }
      }
    }
    return defaultRender(tokens, idx, options, env, self);
  };
}
// --- END: Markdown-It External Links Plugin ---


module.exports = function(eleventyConfig) {
	// --- Passthrough Copies ---
	eleventyConfig.addPassthroughCopy("src/assets/");
	eleventyConfig.addPassthroughCopy("src/css/");
	eleventyConfig.addPassthroughCopy("src/js/");
	
	// --- Watch Targets ---
	eleventyConfig.addWatchTarget("src/css/");
	
	// --- Markdown Configuration ---
	const md = markdownIt({
		html: true,
		breaks: true,
		linkify: true
	})
    .use(markdownItDecorate)
    .use(markdownItAttrs, {

    });

    md.use(externalLinksPlugin); // Apply our custom plugin (also perfect!)
	eleventyConfig.setLibrary("md", md); // Eleventy will now use this fully configured 'md' instance!
	
	 // Pass-through copy for the Pagefind directory
  eleventyConfig.addPassthroughCopy("pagefind");
	// Configure Pagefind
  eleventyConfig.on('eleventy.after', () => {
    // Run the Pagefind command on the output directory
    execSync(`npx pagefind --site _site`, { encoding: 'utf-8', stdio: 'inherit' });
  });
	
	// --- Filters ---
	eleventyConfig.addFilter("myDateFormat", (dateObj) => {
		return format(dateObj, "MMM dd, yyyy");
	});
  
	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
	});
	
	eleventyConfig.addNunjucksFilter("startsWith", function(str, prefix) {
		if (typeof str !== 'string' || typeof prefix !== 'string') {
		return false;
		}
		return str.startsWith(prefix);
	});
  
	// --- Collections ---
    eleventyConfig.addCollection("blogPosts", function (collection) {
		const coll = collection
			.getFilteredByTag("posts")
			.filter(item => !item.data.tags || !item.data.tags.includes("links"))
			.sort((a, b) => b.data.date - a.data.date);
		
		for (let i = 0; i < coll.length; i++) {
			const prevPost = coll[i - 1];
			const nextPost = coll[i + 1];

			coll[i].data["prevPost"] = prevPost;
			coll[i].data["nextPost"] = nextPost;
		}

		return coll;
	});
	
	// --- Return Eleventy Config Object ---
	return {
		dir: {
			input: 'src',
			includes: '_includes',
			output: '_site',
		},
		templateFormats: ['md', 'njk', 'html'],
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		dataTemplateEngine: 'njk',
	};
};