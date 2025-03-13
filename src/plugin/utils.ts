import sqlite3 from "sqlite3";
import { promisify } from "node:util";
import fs from "node:fs";

// Function to serialize a SQLite database to a JavaScript object
export async function serializeSQLiteToJSON(
	dbPath: string,
	outputPath?: string,
): Promise<{ [tableName: string]: any[] }> {
	return new Promise((resolve, reject) => {
		// Open the database
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) {
				reject(`Error opening database: ${err.message}`);
				return;
			}
			console.log(`Connected to the database: ${dbPath}`);

			// Create a promisified version of db.all for easier async usage
			const dbAll = promisify(db.all.bind(db));

			// Initialize the result object that will hold all tables
			const result: { [tableName: string]: any[] } = {};

			// First, get all table names
			db.all(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
				async (err, tables) => {
					if (err) {
						reject(`Error getting table names: ${err.message}`);
						return;
					}

					try {
						// Process each table
						for (const table of tables) {
							const tableName = table.name;
							console.log(`Processing table: ${tableName}`);

							// Get all rows from the table
							const rows = await dbAll(`SELECT * FROM "${tableName}"`);
							result[tableName] = rows;

							console.log(`Added ${rows.length} rows from table ${tableName}`);
						}

						// Write to file if outputPath is provided
						if (outputPath) {
							fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
							console.log(`Database successfully serialized to ${outputPath}`);
						}

						// Close the database connection
						db.close((err) => {
							if (err) {
								reject(`Error closing database: ${err.message}`);
								return;
							}
							console.log("Database connection closed", result);
							resolve(result); // Return the data object
						});
					} catch (error) {
						reject(`Error processing tables: ${error}`);
					}
				},
			);
		});
	});
}
