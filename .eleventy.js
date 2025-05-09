const { DateTime } = require("luxon");
const { format } = require("date-fns");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/assets/");
	eleventyConfig.addPassthroughCopy("src/css/");
	eleventyConfig.addPassthroughCopy("src/js/");
	
	eleventyConfig.addWatchTarget("src/css/");
	// Configure Eleventy
	
	//Filters
	  eleventyConfig.addFilter("myDateFormat", (dateObj) => {
    console.log("Date object type:", typeof dateObj, dateObj); // Add this line!
    const { format } = require("date-fns");
    return format(dateObj, "MMM dd, yyyy");
  });
  
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });
  
  /* Creating the posts collection */
    eleventyConfig.addCollection("posts", function (collection) {

    const coll = collection
      .getFilteredByTag("posts")
      .sort((a, b) => b.data.date - a.data.date);
    // Adds {{ prevPost.url }} {{ prevPost.data.title }} to templates
    for (let i = 0; i < coll.length; i++) {
      const prevPost = coll[i - 1];
      const nextPost = coll[i + 1];

      coll[i].data["prevPost"] = prevPost;
      coll[i].data["nextPost"] = nextPost;
    }

    return coll;
  });
	
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