// vite-plugin-custom-endpoints.js
// import fs from "node:fs";
// import mime from "mime-types";
import type { ViteDevServer } from "vite";
// import { URL } from "node:url";
import {
	findSQLiteFiles,
	getDurableObjectsFromConfig,
	isSQLiteFile,
	readConfigFile,
} from "../api/utils";
import MiniRouter from "./MiniRouter";
import { serializeSQLiteToJSON } from "./utils";

type Options = {
	// endpoints?: EndpointConfig[];
	basePath?: string;
	// staticOptions?: StaticOptions;
};
export default function customEndpointsPlugin(options: Options = {}) {
	const {
		basePath = "/fp-agents", // base path for all endpoints
		// staticOptions = {    // static file serving options
		//   enabled: false,
		//   root: '',          // root directory to serve files from
		//   prefix: '/static', // URL prefix for static files
		//   index: ['index.html', 'index.htm'] // index files to look for
		// }
	} = options;

	const router = new MiniRouter({
		basePath,
	});

	router.get("/api/agents", (req, res) => {
		const result = getDurableObjectsFromConfig();

		res.setHeader("Content-Type", "application/json");
		if (result.success === false) {
			res.statusCode = 500;
			res.end(JSON.stringify(result));
		}

		res.statusCode = 200;
		res.end(JSON.stringify(result));
	});
	router.get("/api/agents/:id/db", async (_req, res, ctx) => {
		const id = ctx.params.id;
		const { name } = readConfigFile("./wrangler.toml");

		const files = await findSQLiteFiles(
			`./.wrangler/state/v3/do/${name}-${id}`,
		);
		const filePath = files.find((file) => isSQLiteFile(file));
		if (filePath === undefined) {
			res.statusCode = 404;
			res.end(JSON.stringify({ error: "No database found" }));
			return;
		}

		// const dbPath = files[0];
		// isSQLiteFile  // const outputPath = `./.wrangler/state/v3/do/${name}-${id}.json`;

		const result = await serializeSQLiteToJSON(filePath);
		res.setHeader("Content-Type", "application/json");
		res.statusCode = 200;
		res.end(JSON.stringify(result));
	});

	return {
		name: "vite-plugin-custom-endpoints",
		configureServer(server: ViteDevServer) {
			server.middlewares.use(router.handler());
			// // Set up static file serving if enabled
			// if (staticOptions.enabled && staticOptions.root) {
			//   const staticRoot = staticOptions.root;
			//   const staticPrefix = staticOptions.prefix || '/static';

			//   console.log(`Serving static files from ${staticRoot} at ${staticPrefix}`);

			//   // Create a middleware to handle static file requests
			//   server.middlewares.use(staticPrefix, (req, res, next) => {
			//     // Extract the file path from the URL, removing the prefix
			//     let urlPath = req.url;

			//     // Remove query string if present
			//     if (urlPath.includes('?')) {
			//       urlPath = urlPath.split('?')[0];
			//     }

			//     // Prevent directory traversal attacks
			//     if (urlPath.includes('..')) {
			//       res.statusCode = 403;
			//       return res.end('Forbidden');
			//     }

			//     // Calculate the file path relative to the static root
			//     const filePath = path.join(staticRoot, urlPath);

			//     // Check if the file exists
			//     fs.stat(filePath, (err, stats) => {
			//       if (err) {
			//         // File not found, pass to next middleware
			//         return next();
			//       }

			//       // If it's a directory, look for index files
			//       if (stats.isDirectory()) {
			//         // Try to find an index file
			//         for (const indexFile of staticOptions.index) {
			//           const indexPath = path.join(filePath, indexFile);
			//           if (fs.existsSync(indexPath)) {
			//             return serveFile(indexPath, res);
			//           }
			//         }

			//         // No index file found
			//         res.statusCode = 404;
			//         return res.end('Not Found');
			//       }

			//       // Serve the file
			//       serveFile(filePath, res);
			//     });
			//   });
		},
	};
}

// // Helper function to serve a static file
// function serveFile(filePath, res) {
//   // Determine content type
//   const contentType = mime.lookup(filePath) || "application/octet-stream";

//   // Set response headers
//   res.setHeader("Content-Type", contentType);

//   // Stream the file to the response
//   const fileStream = fs.createReadStream(filePath);
//   fileStream.pipe(res);

//   // Handle file stream errors
//   fileStream.on("error", (error) => {
//     console.error(`Error streaming file: ${error.message}`);
//     res.statusCode = 500;
//     res.end("Internal Server Error");
//   });
// }
// // };
// // }
