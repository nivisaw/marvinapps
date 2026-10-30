// MarvinApps — configuración de Eleventy
// Fuente: src/   ·   Sitio generado (lo que se sube al hosting): sitio-web/
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export default function (eleventyConfig) {
  // Archivos que se copian tal cual
  for (const f of ["assets", "favicon.ico", "robots.txt", "site.webmanifest", ".htaccess", "llms.txt", "llms-full.txt"]) {
    eleventyConfig.addPassthroughCopy(`src/${f}`);
  }

  // "/assets/css/styles.css" → "/assets/css/styles.css?v=<hash>": la URL cambia cuando cambia el archivo,
  // así el navegador no usa una versión vieja guardada en caché.
  eleventyConfig.addFilter("v", (url) => {
    const hash = createHash("md5").update(readFileSync(`src${url}`)).digest("hex").slice(0, 8);
    return `${url}?v=${hash}`;
  });

  eleventyConfig.addGlobalData("layout", "base.njk");
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  // Páginas del sitio en el orden del sitemap
  eleventyConfig.addCollection("pages", (api) =>
    api.getAll().filter((p) => p.data.sitemap).sort((a, b) => a.data.sitemap.order - b.data.sitemap.order)
  );

  // JSON-LD: une los nodos compartidos (_data/schema.json) con los propios de cada página.
  // Un nodo {"$shared": "org"} se reemplaza por el nodo común; sus demás claves lo sobrescriben.
  eleventyConfig.addFilter("jsonld", function (nodes, lang) {
    const { schema, site } = this.ctx;
    const graph = nodes.map(({ $shared, ...rest }) => {
      const node = $shared ? { ...schema[lang][$shared], ...rest } : rest;
      return "dateModified" in node ? { ...node, dateModified: site.updated } : node;
    });
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1);
  });

  return {
    dir: { input: "src", output: "sitio-web", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
  };
}
